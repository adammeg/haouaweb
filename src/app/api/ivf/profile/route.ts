import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import {
  loadIvfBundle,
  saveIvfProfile,
} from "@/lib/pma/ivf-api-service";
import type { IvfPatientProfile } from "@/lib/pma/ivf-types";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** GET /api/ivf/profile?patientId= — profil PMA + analyse + cycles patiente */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  const patientId = new URL(req.url).searchParams.get("patientId")?.trim();
  if (!patientId) {
    return withCors(jsonError("patient_id_required", 400), req);
  }

  try {
    const bundle = await loadIvfBundle(auth.doctor.sub, patientId);
    return withCors(
      NextResponse.json({
        patientId,
        profile: bundle.profile,
        analysis: bundle.analysis,
        cycles: bundle.cycles,
        updatedAt: bundle.updatedAt,
        hasDossier: Boolean(bundle.patient),
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("ivf.profile.GET", e), req);
  }
}

/** PUT /api/ivf/profile — body: { patientId, profile } */
export async function PUT(req: Request) {
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
    const { updatedAt } = await saveIvfProfile(
      auth.doctor.sub,
      patientId,
      body.profile,
    );
    return withCors(NextResponse.json({ ok: true, updatedAt }), req);
  } catch (e) {
    return withCors(dbError("ivf.profile.PUT", e), req);
  }
}
