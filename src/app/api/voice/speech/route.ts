import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { speechConfig, SPEECH_SAMPLE_RATE } from "@/lib/voice/speech-config";
import { heygenSpokenText } from "@/lib/voice/spoken-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

async function authorize(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers });
  if (session.role === "secretary" || !(await isDoctorActive(session.sub))) return NextResponse.json({ error: "Accès réservé au médecin actif" }, { status: 403, headers });
  return session;
}

export async function GET(req: Request) {
  const auth = await authorize(req); if (auth instanceof NextResponse) return auth;
  const config = speechConfig();
  return NextResponse.json({ available: config.enabled, provider: config.enabled ? "openrouter" : "browser", model: config.enabled ? config.model : null }, { headers });
}

/** Proxy raw PCM; credentials, the model and the voice are never chosen by the client. */
export async function POST(req: Request) {
  const auth = await authorize(req); if (auth instanceof NextResponse) return auth;
  if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403, headers });
  const config = speechConfig();
  if (!config.enabled) return NextResponse.json({ error: "La voix OpenRouter n’est pas configurée." }, { status: 503, headers });
  if (!req.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Texte JSON attendu" }, { status: 415, headers });
  const reader = req.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Texte vide" }, { status: 400, headers });
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 24_000) { await reader.cancel(); return NextResponse.json({ error: "Texte trop volumineux" }, { status: 413, headers }); }
      chunks.push(value);
    }
  } catch { return NextResponse.json({ error: "Lecture du texte interrompue" }, { status: 400, headers }); }
  finally { reader.releaseLock(); }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))); }
  catch { return NextResponse.json({ error: "Texte invalide" }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "text")) return NextResponse.json({ error: "Texte attendu" }, { status: 400, headers });
  const text = (body as { text?: unknown }).text;
  if (typeof text !== "string" || !text.trim() || text.length > 5000) return NextResponse.json({ error: "Le texte doit contenir entre 1 et 5000 caractères." }, { status: 400, headers });
  const limit = rateLimitMemory(`voice-speech:${auth.sub}`, 30, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de demandes vocales. Réessayez dans un instant." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSec) } });
  const upstreamAbort = new AbortController();
  const signal = AbortSignal.any([req.signal, upstreamAbort.signal, AbortSignal.timeout(30_000)]);
  try {
    const response = await fetch(config.url, { method: "POST", signal, headers: {
      Authorization: `Bearer ${config.key}`, "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || new URL(req.url).origin,
      "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "HawaeMD",
    }, body: JSON.stringify({ model: config.model, input: heygenSpokenText(text), voice: config.voice, response_format: "pcm" }) });
    if (!response.ok) {
      await response.body?.cancel();
      const message = response.status === 429 ? "La voix OpenRouter a atteint sa limite. Réessayez plus tard ou choisissez la voix de l’appareil." : "La voix OpenRouter est indisponible. Vérifiez la clé et la disponibilité du modèle, ou choisissez la voix de l’appareil.";
      return NextResponse.json({ error: message }, { status: response.status === 429 ? 429 : 502, headers });
    }
    const contentType = response.headers.get("content-type") ?? "";
    const rate = /\brate\s*=\s*(\d+)/i.exec(contentType)?.[1];
    const channels = /\bchannels\s*=\s*(\d+)/i.exec(contentType)?.[1];
    if (!response.body || !/^audio\/pcm(?:;|$)/i.test(contentType) || (rate && Number(rate) !== SPEECH_SAMPLE_RATE) || (channels && channels !== "1")) {
      await response.body?.cancel();
      return NextResponse.json({ error: "Format audio du fournisseur incompatible." }, { status: 502, headers });
    }
    const audioReader = response.body.getReader(); let audioSize = 0;
    const audio = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await audioReader.read();
          if (done) { audioReader.releaseLock(); controller.close(); return; }
          audioSize += value.byteLength;
          if (audioSize > SPEECH_SAMPLE_RATE * 2 * 180) throw new Error("Audio trop long");
          controller.enqueue(value);
        } catch {
          upstreamAbort.abort(); await audioReader.cancel().catch(() => {}); audioReader.releaseLock();
          controller.error(new Error("Flux audio interrompu"));
        }
      },
      async cancel() { upstreamAbort.abort(); await audioReader.cancel().catch(() => {}); audioReader.releaseLock(); },
    });
    return new Response(audio, { headers: { ...headers, "Content-Type": `audio/pcm; rate=${SPEECH_SAMPLE_RATE}; channels=1`, "X-Accel-Buffering": "no", "X-Hawae-Audio-Sample-Rate": String(SPEECH_SAMPLE_RATE) } });
  } catch { return NextResponse.json({ error: "La génération vocale a été interrompue ou a dépassé le délai." }, { status: 502, headers }); }
}
