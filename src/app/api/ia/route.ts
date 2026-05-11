import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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

export const runtime = "nodejs";

const MAX_QUESTION = 4_000;
const MAX_CONTEXT = 20_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 24;

type Body = {
  question?: string;
  dossierSummary?: string;
  /** diagnostic = analyse structurée du dossier ; question = échange ciblé (défaut). */
  mode?: "diagnostic" | "question";
  /** Si false, réponse JSON { reply } au lieu du flux texte (défaut: true avec clé API). */
  stream?: boolean;
};

function clampContext(raw: string): string {
  return raw.trim().slice(0, MAX_CONTEXT);
}

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
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

  const context = clampContext(body.dossierSummary ?? "");
  const wantStream = body.stream !== false;

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
      return NextResponse.json({
        reply:
          `[Mode hors-clé API — analyse diagnostique]\n\n` +
          `Dossier reçu (${context.length} caractères).\n\n` +
          `Pour une analyse générée par modèle, définissez OPENROUTER_API_KEY (ou OPENAI_API_KEY) ` +
          `dans .env et redémarrez le serveur.\n` +
          `Rappel : sortie informative seulement ; décision médicale sous votre responsabilité.`,
      });
    }
    return NextResponse.json({
      reply:
        `[Mode hors-clé API] Dossier : ${context || "—"}\n\n` +
        `Question : ${question}\n\n` +
        `Pour des réponses générées par modèle, définissez OPENROUTER_API_KEY (ou OPENAI_API_KEY) dans .env.\n` +
        `Rappel : sortie informative seulement, décision médicale sous votre responsabilité.`,
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
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Réponse modèle vide" },
        { status: 502 },
      );
    }
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur réseau" },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";
