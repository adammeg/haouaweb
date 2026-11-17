import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { realtimeConfig, realtimeSessionConfig } from "@/lib/voice/realtime-config";

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
  const config = realtimeConfig();
  return NextResponse.json({ available: config.enabled, model: config.enabled ? config.model : null }, { headers });
}

/** Unified WebRTC handshake: permanent credentials and trusted instructions stay on the server. */
export async function POST(req: Request) {
  const auth = await authorize(req); if (auth instanceof NextResponse) return auth;
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) return NextResponse.json({ error: "Origine non autorisée" }, { status: 403, headers });
  const config = realtimeConfig();
  if (!config.enabled) return NextResponse.json({ error: "Audio temps réel non configuré. Activez VOICE_REALTIME_ENABLED et une clé OpenAI directe." }, { status: 503, headers });
  const limit = rateLimitMemory(`voice-realtime:${auth.sub}`, 4, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Trop de connexions audio. Réessayez dans un instant." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSec) } });
  if (!req.headers.get("content-type")?.startsWith("application/sdp")) return NextResponse.json({ error: "Offre audio attendue" }, { status: 415, headers });
  const reader = req.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Offre audio vide" }, { status: 400, headers });
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 64_000) { await reader.cancel(); return NextResponse.json({ error: "Offre audio trop volumineuse" }, { status: 413, headers }); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const offer = new TextDecoder().decode(Buffer.concat(chunks));
  if (!offer.startsWith("v=0") || !offer.includes("m=audio")) return NextResponse.json({ error: "Offre audio invalide" }, { status: 400, headers });
  const form = new FormData(); form.set("sdp", offer); form.set("session", JSON.stringify(realtimeSessionConfig(config.model)));
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", { method: "POST", headers: { Authorization: `Bearer ${config.key}` }, body: form,
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(15_000)]) });
    if (!response.ok) return NextResponse.json({ error: "Connexion audio temps réel refusée par le fournisseur. Vérifiez la clé et le modèle." }, { status: 502, headers });
    const answer = await response.text();
    if (!answer.startsWith("v=0")) return NextResponse.json({ error: "Réponse audio invalide" }, { status: 502, headers });
    return new Response(answer, { headers: { ...headers, "Content-Type": "application/sdp" } });
  } catch { return NextResponse.json({ error: "Connexion audio interrompue ou délai dépassé" }, { status: 502, headers }); }
}
