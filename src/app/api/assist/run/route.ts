import { NextResponse } from "next/server";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import { runAssist } from "@/lib/assist";
import type { AssistProfile } from "@/lib/assist/types";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/**
 * POST /api/assist/run
 * Body: { profile: AssistProfile }
 * → scores exécutés (POSEIDON, OHSS, FMF, etc.) + alertes + questions.
 */
export async function POST(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let body: { profile?: AssistProfile };
  try {
    body = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  if (!body.profile || typeof body.profile !== "object") {
    return withCors(jsonError("invalid_body", 400), req);
  }

  const result = runAssist(body.profile);
  return withCors(NextResponse.json({ ok: true, result }), req);
}
