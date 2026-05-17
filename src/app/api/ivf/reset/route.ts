import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import { resetIvfPatient } from "@/lib/pma/ivf-api-service";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** DELETE /api/ivf/reset?patientId= */
export async function DELETE(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  const patientId = new URL(req.url).searchParams.get("patientId")?.trim();
  if (!patientId) {
    return withCors(jsonError("patient_id_required", 400), req);
  }

  try {
    await resetIvfPatient(auth.doctor.sub, patientId);
    return withCors(NextResponse.json({ ok: true }), req);
  } catch (e) {
    return withCors(dbError("ivf.reset.DELETE", e), req);
  }
}
