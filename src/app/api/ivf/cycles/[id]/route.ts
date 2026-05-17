import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import { getIvfRecord, upsertIvfRecord } from "@/lib/db/ivf-repository";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** DELETE /api/ivf/cycles/:id?patientId= */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  const { id } = await ctx.params;
  const patientId = new URL(req.url).searchParams.get("patientId")?.trim();
  if (!patientId) {
    return withCors(jsonError("patient_id_required", 400), req);
  }

  try {
    const record = await getIvfRecord(auth.doctor.sub, patientId);
    if (record) {
      const cycles = record.cycles.filter((c) => c.id !== id);
      await upsertIvfRecord(auth.doctor.sub, patientId, { cycles });
    }
    return withCors(NextResponse.json({ ok: true }), req);
  } catch (e) {
    return withCors(dbError("ivf.cycles.DELETE", e), req);
  }
}
