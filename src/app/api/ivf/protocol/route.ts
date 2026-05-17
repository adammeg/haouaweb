import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import { runIvfProtocolSelect } from "@/lib/pma/ivf-api-service";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/**
 * POST /api/ivf/protocol
 * Body: { patientId, protocolId }
 * Régénère le calendrier pour le protocole choisi par le médecin.
 */
export async function POST(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let body: { patientId?: string; protocolId?: string };
  try {
    body = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  const patientId = body.patientId?.trim();
  const protocolId = body.protocolId?.trim();
  if (!patientId || !protocolId) {
    return withCors(jsonError("invalid_body", 400), req);
  }

  try {
    const { analysis, updatedAt } = await runIvfProtocolSelect(
      auth.doctor.sub,
      patientId,
      protocolId,
    );
    return withCors(
      NextResponse.json({ ok: true, analysis, updatedAt }),
      req,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "analysis_required") {
      return withCors(jsonError("analysis_required", 400), req);
    }
    return withCors(dbError("ivf.protocol.POST", e), req);
  }
}
