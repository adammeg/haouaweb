import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { isDoctorActive } from "@/lib/auth/require-active";
import { createChatCompletion, createChatCompletionsTextStream, OpenAiChatError } from "@/lib/ia/openai-chat-stream";
import { resolveIaProvider } from "@/lib/ia/provider-config";
import { buildDiagnosticUserContent, buildQuestionUserContent, SYSTEM_PROMPT_DIAGNOSTIC, SYSTEM_PROMPT_QUESTION } from "@/lib/ia/ia-prompts";
import { AiPatientContextError, buildAuthorizedAiContext } from "@/lib/ia/authorized-patient-context";
import { clinicalAnalysisToText, parseClinicalAiAnalysis } from "@/lib/ia/clinical-analysis-schema";
import { formatRagEvidence, retrieveRagEvidence, type RagHit } from "@/lib/rag/rag-engine";
import { parseAiRequest, boundedNumber } from "@/lib/ia/request-schema";
import { clinicalOutputFormat } from "@/lib/ia/structured-output";
import { PROMPT_VERSION, KNOWLEDGE_VERSION, ASSIST_VERSION, AI_CACHE_VERSION } from "@/lib/ia/versions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
  if (session.role === "secretary") return NextResponse.json({ error: "Accès réservé au médecin" }, { status: 403 });
  const rl = rateLimitMemory(`ia:${session.sub}`, 24, 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Trop de requêtes. Réessayez dans ${rl.retryAfterSec}s.` }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });

  let body: ReturnType<typeof parseAiRequest>;
  try {
    const raw = await req.text();
    if (raw.length > 16_000) throw new Error("Requête trop volumineuse");
    body = parseAiRequest(JSON.parse(raw));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Requête invalide" }, { status: 400 });
  }
  const provider = resolveIaProvider();
  if (!provider) return NextResponse.json({ error: "Fournisseur IA non configuré. Les évaluations cliniques locales restent disponibles." }, { status: 503 });

  try {
    let context = "";
    let revision: string | undefined;
    let evidence: RagHit[];
    if (body.patientId) {
      const authorized = await buildAuthorizedAiContext({ doctorId: session.doctorId, patientId: body.patientId, question: body.question, expectedRevision: body.expectedRevision });
      context = authorized.context;
      revision = authorized.revision;
      evidence = authorized.evidence;
    } else evidence = retrieveRagEvidence(body.question);

    const evidenceBlock = formatRagEvidence(evidence);
    const diagnostic = body.mode === "diagnostic";
    const messages = [
      { role: "system" as const, content: diagnostic ? SYSTEM_PROMPT_DIAGNOSTIC : SYSTEM_PROMPT_QUESTION },
      { role: "user" as const, content: diagnostic ? buildDiagnosticUserContent(context, evidenceBlock) : buildQuestionUserContent(context, body.question, evidenceBlock) },
    ];
    const meta = { provider: provider.label, model: provider.model, promptVersion: PROMPT_VERSION, knowledgeVersion: KNOWLEDGE_VERSION, engineVersion: ASSIST_VERSION, cacheVersion: AI_CACHE_VERSION, patientId: body.patientId, revision, evidenceIds: evidence.map((hit) => hit.chunk.id) };
    const params = {
      url: provider.chatCompletionsUrl, headers: provider.headers, model: provider.model,
      temperature: boundedNumber(process.env.IA_TEMPERATURE ?? process.env.OPENROUTER_TEMPERATURE ?? process.env.OPENAI_TEMPERATURE, 0.2, 0, 2),
      maxTokens: Math.floor(boundedNumber(process.env.IA_MAX_TOKENS ?? process.env.OPENROUTER_MAX_TOKENS ?? process.env.OPENAI_MAX_TOKENS, 4096, 256, 8192)),
      messages, signal: req.signal,
      ...(diagnostic && process.env.IA_STRUCTURED_OUTPUTS === "true" ? { responseFormat: clinicalOutputFormat(meta.evidenceIds), requireParameters: provider.label === "openrouter" } : {}),
    };
    if (!diagnostic && body.stream) {
      const stream = await createChatCompletionsTextStream(params);
      return new Response(stream, { headers: {
        "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no",
        "X-Hawae-AI-Provider": provider.label, "X-Hawae-AI-Model": provider.model,
        "X-Hawae-Prompt-Version": PROMPT_VERSION, "X-Hawae-Knowledge-Version": KNOWLEDGE_VERSION,
        "X-Hawae-Patient-Revision": revision ?? "", "X-Hawae-Cache-Version": AI_CACHE_VERSION,
      } });
    }
    const rawReply = await createChatCompletion(params);
    if (diagnostic) {
      const analysis = parseClinicalAiAnalysis(rawReply, evidence.map((hit) => hit.chunk));
      return NextResponse.json({ reply: clinicalAnalysisToText(analysis), analysis, meta }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ reply: rawReply, meta }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiPatientContextError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof OpenAiChatError) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ error: error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name) ? "Génération interrompue ou délai dépassé" : "Analyse IA indisponible ou réponse clinique invalide" }, { status: 502 });
  }
}
