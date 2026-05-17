import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import { runIvfAnalysis } from "@/lib/pma/ivf-api-service";
import type { IvfPatientProfile } from "@/lib/pma/ivf-types";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/**
 * POST /api/ivf/analyze
 * Body: { patientId: string, profile: IvfPatientProfile }
 * → POSEIDON, Bologne, protocoles, calendrier initial (protocole recommandé).
 */
export async function POST(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let body: { patientId?: string; profile?: IvfPatientProfile };
  try {
    body = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  const patientId = body.patientId?.trim();
  if (!patientId || !body.profile) {
    return withCors(jsonError("invalid_body", 400), req);
  }

  try {
    const { analysis, updatedAt } = await runIvfAnalysis(
      auth.doctor.sub,
      patientId,
      body.profile,
    );
    return withCors(
      NextResponse.json({ ok: true, analysis, updatedAt }),
      req,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "age_required") {
      return withCors(jsonError("age_required", 400), req);
    }
    return withCors(dbError("ivf.analyze.POST", e), req);
  }
}
