import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { isDoctorActive } from "@/lib/auth/require-active";
import { resolveIaProvider } from "@/lib/ia/provider-config";
import type { PatientSnapshot } from "@/types/domain";
import { buildT2IaPrompt, collectT2FromSnapshot } from "@/lib/t2-echo/collect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;

type Body = { draft?: PatientSnapshot; doctorName?: string };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "Compte desactive" }, { status: 403 });
  }

  const rl = rateLimitMemory(`t2-ia:${session.sub}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requetes." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const draft = body.draft;
  if (!draft?.id) {
    return NextResponse.json({ error: "Dossier manquant" }, { status: 400 });
  }

  const d = collectT2FromSnapshot(draft, body.doctorName);
  const prompt = buildT2IaPrompt(d);

  const provider = resolveIaProvider();
  if (!provider) {
    const fallback =
      d.check.anomalies.length > 0
        ? "Anomalies detectees : " + d.check.anomalies.join(", ") + "."
        : "Examen morphologique sans anomalie majeure relevee sur les structures explorees.";
    return NextResponse.json({ reply: fallback });
  }

  try {
    const res = await fetch(provider.chatCompletionsUrl, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.25,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "Tu rediges des comptes-rendus d'echographie obstetricale T2 en francais medical. Sortie informative uniquement.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: "Fournisseur IA indisponible", detail: raw.slice(0, 200) },
        { status: 502 },
      );
    }
    const data = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Reponse vide" }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur reseau" },
      { status: 502 },
    );
  }
}
