import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { requireDoctor } from "@/lib/api/require-doctor";
import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { getPatientDisplayName } from "@/lib/patient-utils";
import type { PatientSnapshot } from "@/types/domain";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/**
 * GET /api/patients
 * Liste aplatie des patientes du médecin (tous profils workspace).
 */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  try {
    const row = await getWorkspaceByDoctorId(auth.doctor.sub);
    const patients: Array<{
      id: string;
      displayName: string;
      specialite?: string;
      motif?: string;
      workspaceUserId: string;
    }> = [];

    if (row) {
      for (const [userId, map] of Object.entries(
        row.workspace.patientsByUser,
      )) {
        for (const p of Object.values(map as Record<string, PatientSnapshot>)) {
          patients.push({
            id: p.id,
            displayName: getPatientDisplayName(p),
            specialite: p.specialite,
            motif: p.motif,
            workspaceUserId: userId,
          });
        }
      }
    }

    patients.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
    return withCors(NextResponse.json({ patients }), req);
  } catch (e) {
    return withCors(dbError("patients.GET", e), req);
  }
}
