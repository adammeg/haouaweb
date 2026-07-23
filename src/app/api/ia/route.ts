import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { isDoctorActive } from "@/lib/auth/require-active";
import {
  createChatCompletionsTextStream,
  OpenAiChatError,
} from "@/lib/ia/openai-chat-stream";
import { resolveIaProvider } from "@/lib/ia/provider-config";
import {
  buildDiagnosticUserContent,
  buildQuestionUserContent,
  SYSTEM_PROMPT_DIAGNOSTIC,
  SYSTEM_PROMPT_QUESTION,
} from "@/lib/ia/ia-prompts";
import {
  AiPatientContextError,
  buildAuthorizedAiContext,
} from "@/lib/ia/authorized-patient-context";
import {
  clinicalAnalysisToText,
  parseClinicalAiAnalysis,
} from "@/lib/ia/clinical-analysis-schema";
import { buildRagBlock } from "@/lib/rag/rag-engine";

export const runtime = "nodejs";

const MAX_QUESTION = 4_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 24;
const PROMPT_VERSION = "clinical-assist-v2";

type Body = {
  question?: string;
  patientId?: string;
  /** diagnostic = analyse structurée du dossier ; question = échange ciblé (défaut). */
  mode?: "diagnostic" | "question";
  /** Si false, réponse JSON { reply } au lieu du flux texte (défaut: true avec clé API). */
  stream?: boolean;
};

function parseMaxTokens(): number {
  const raw =
    process.env.IA_MAX_TOKENS ||
    process.env.OPENROUTER_MAX_TOKENS ||
    process.env.OPENAI_MAX_TOKENS;
  return Math.min(8192, Math.max(256, Number(raw) || 2048));
}

function parseTemperature(): number {
  const raw =
    process.env.IA_TEMPERATURE ||
    process.env.OPENROUTER_TEMPERATURE ||
    process.env.OPENAI_TEMPERATURE;
  return Math.min(2, Math.max(0, Number(raw) || 0.3));
}

function parseChatErrorDetail(raw: string): string {
  let detail = raw;
  try {
    const j = JSON.parse(raw) as {
      error?: { message?: string } | string;
    };
    if (typeof j.error === "object" && j.error?.message) detail = j.error.message;
    else if (typeof j.error === "string") detail = j.error;
  } catch {
    /* keep */
  }
  return detail;
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
  }

  if (session.role === "secretary") {
    return NextResponse.json({ error: "Accès réservé au médecin" }, { status: 403 });
  }

  const rl = rateLimitMemory(`ia:${session.sub}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de requêtes. Réessayez dans ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const mode: "diagnostic" | "question" =
    body.mode === "diagnostic" ? "diagnostic" : "question";
  const question = (body.question ?? "").trim().slice(0, MAX_QUESTION);

  if (mode === "question" && !question) {
    return NextResponse.json({ error: "Question vide" }, { status: 400 });
  }

  let context = "";
  if (body.patientId?.trim() || mode === "diagnostic") {
    try {
      ({ context } = await buildAuthorizedAiContext({
        doctorId: session.doctorId,
        patientId: body.patientId ?? "",
        question,
      }));
    } catch (e) {
      if (e instanceof AiPatientContextError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      throw e;
    }
  } else {
    context = buildRagBlock(question.slice(0, 1_500));
  }
  // Le diagnostic doit être entièrement reçu puis validé avant affichage.
  const wantStream = mode === "question" && body.stream !== false;

  const provider = resolveIaProvider();
  const maxTokens = parseMaxTokens();
  const temperature = parseTemperature();

  const systemContent =
    mode === "diagnostic" ? SYSTEM_PROMPT_DIAGNOSTIC : SYSTEM_PROMPT_QUESTION;
  const userContent =
    mode === "diagnostic"
      ? buildDiagnosticUserContent(context)
      : buildQuestionUserContent(context, question);

  if (!provider) {
    if (mode === "diagnostic") {
      return NextResponse.json(
        { error: "Fournisseur IA non configuré. Les scores cliniques locaux restent disponibles." },
        { status: 503 },
      );
    }
    return NextResponse.json({
      reply:
        `[Mode hors-clé API] Dossier : ${context || "—"}\n\n` +
        `Question : ${question}\n\n` +
        `Pour des réponses générées par modèle, définissez OPENROUTER_API_KEY (ou OPENAI_API_KEY) dans .env.\n` +
        `Rappel : sortie informative seulement, décision médicale sous votre responsabilité.`,
      meta: { provider: "none", model: "none", promptVersion: PROMPT_VERSION },
    });
  }

  const messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[] = [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];

  if (wantStream) {
    try {
      const stream = await createChatCompletionsTextStream({
        url: provider.chatCompletionsUrl,
        headers: provider.headers,
        model: provider.model,
        temperature,
        maxTokens,
        messages,
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Accel-Buffering": "no",
          "X-Hawae-AI-Provider": provider.label,
          "X-Hawae-AI-Model": provider.model,
          "X-Hawae-Prompt-Version": PROMPT_VERSION,
        },
      });
    } catch (e) {
      if (e instanceof OpenAiChatError) {
        return NextResponse.json(
          {
            error: e.message,
            detail: e.detail,
          },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur réseau" },
        { status: 502 },
      );
    }
  }

  try {
    const res = await fetch(provider.chatCompletionsUrl, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        temperature,
        max_tokens: maxTokens,
        messages,
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      const detail = parseChatErrorDetail(raw);
      return NextResponse.json(
        { error: `Fournisseur IA indisponible (${res.status}).`, detail },
        { status: 502 },
      );
    }

    const data = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawReply = data.choices?.[0]?.message?.content?.trim();
    if (!rawReply) {
      return NextResponse.json(
        { error: "Réponse modèle vide" },
        { status: 502 },
      );
    }
    if (mode === "diagnostic") {
      try {
        const analysis = parseClinicalAiAnalysis(rawReply);
        return NextResponse.json({
          reply: clinicalAnalysisToText(analysis),
          analysis,
          meta: {
            provider: provider.label,
            model: provider.model,
            promptVersion: PROMPT_VERSION,
          },
        });
      } catch (e) {
        return NextResponse.json(
          {
            error: "Réponse IA rejetée : format clinique invalide.",
            detail: e instanceof Error ? e.message : "validation_failed",
          },
          { status: 502 },
        );
      }
    }
    return NextResponse.json({
      reply: rawReply,
      meta: {
        provider: provider.label,
        model: provider.model,
        promptVersion: PROMPT_VERSION,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur réseau" },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";
