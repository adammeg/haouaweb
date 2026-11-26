import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { isDoctorActive } from "@/lib/auth/require-active";
import { resolveIaProvider } from "@/lib/ia/provider-config";
import { catalogForPrompt, validateExtraction } from "@/lib/dossier/exam-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const MAX_TEXT = 12_000;

type Body = { text?: string; specialite?: string; terme?: string };

const SYSTEM = `Tu lis le texte d'un compte rendu de biologie ou d'échographie gynéco-obstétricale et tu en extrais
les résultats dans un JSON strict. Règles :
- n'utilise que les identifiants du catalogue ; si une valeur ne correspond à aucun identifiant, mets-la dans "notes" ;
- recopie la valeur mesurée, convertie dans l'unité du catalogue ; pour les choix, utilise exactement une des valeurs permises ;
- n'invente jamais une valeur absente du texte ; en cas de doute, omets-la et explique-le dans "notes" ;
- "date" : date du prélèvement ou de l'examen au format AAAA-MM-JJ, ou null ;
- "panel" : l'identifiant du bilan ou du type d'échographie qui correspond le mieux.
Format : {"kind":"bio"|"echo","panel":"…","date":"AAAA-MM-JJ"|null,"values":{"id":"valeur"},"notes":["…"]}`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "Compte desactive" }, { status: 403 });
  }
  const rl = rateLimitMemory(`extract-exam:${session.sub}`, RATE_MAX, RATE_WINDOW_MS);
  if (!rl.ok) return NextResponse.json({ error: "Trop de requetes." }, { status: 429 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const text = (body.text ?? "").slice(0, MAX_TEXT).trim();
  if (text.length < 20) return NextResponse.json({ error: "Texte illisible" }, { status: 422 });

  const provider = resolveIaProvider();
  // Pas de fournisseur configuré : le poste utilise sa lecture locale.
  if (!provider) return NextResponse.json({ error: "IA non configuree" }, { status: 501 });

  const context = [
    body.specialite ? `Spécialité du dossier : ${body.specialite}.` : "",
    body.terme ? `Terme actuel : ${body.terme}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const res = await fetch(provider.chatCompletionsUrl, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM}\n\n${catalogForPrompt()}` },
          { role: "user", content: `${context}\n\nTEXTE DU DOCUMENT (identité masquée) :\n${text}` },
        ],
      }),
    });
    const raw = await res.text();
    if (!res.ok) return NextResponse.json({ error: "Fournisseur IA indisponible" }, { status: 502 });
    const content = (JSON.parse(raw) as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message
      ?.content;
    const json = JSON.parse((content ?? "{}").replace(/^```(?:json)?|```$/g, "").trim()) as unknown;
    return NextResponse.json({ extraction: validateExtraction(json), source: "ia" });
  } catch {
    return NextResponse.json({ error: "Reponse IA illisible" }, { status: 502 });
  }
}
