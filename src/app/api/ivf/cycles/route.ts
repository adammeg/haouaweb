import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import {
  appendIvfCycle,
  listDoctorCycles,
} from "@/lib/pma/ivf-api-service";
import type { IvfProfile } from "@/types/modules";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** GET /api/ivf/cycles — tous les cycles FIV du médecin */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  try {
    const cycles = await listDoctorCycles(auth.doctor.sub);
    return withCors(NextResponse.json({ cycles }), req);
  } catch (e) {
    return withCors(dbError("ivf.cycles.GET", e), req);
  }
}

/** POST /api/ivf/cycles — body: { patientId, cycle: IvfProfile } */
export async function POST(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let body: { patientId?: string; cycle?: IvfProfile };
  try {
    body = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  const patientId = body.patientId?.trim();
  if (!patientId || !body.cycle?.id) {
    return withCors(jsonError("invalid_body", 400), req);
  }

  try {
    const { cycles, updatedAt } = await appendIvfCycle(
      auth.doctor.sub,
      patientId,
      body.cycle,
    );
    return withCors(
      NextResponse.json({ ok: true, cycles, updatedAt }),
      req,
    );
  } catch (e) {
    return withCors(dbError("ivf.cycles.POST", e), req);
  }
}
