import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { isDoctorActive } from "@/lib/auth/require-active";
import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { ingestWorkspaceForTraining } from "@/lib/training/sync-from-workspace";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** Ré-ingère tous les dossiers du workspace (après activation du consentement). */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return withCors(
        NextResponse.json({ error: "unauthorized" }, { status: 401 }),
        req,
      );
    }
    if (!(await isDoctorActive(session.sub))) {
      return withCors(
        NextResponse.json({ error: "account_disabled" }, { status: 403 }),
        req,
      );
    }
    const row = await getWorkspaceByDoctorId(session.sub);
    if (!row) {
      return withCors(
        NextResponse.json({
          ok: true,
          stats: {
            processed: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            skippedNoConsent: false,
          },
        }),
        req,
      );
    }
    const stats = await ingestWorkspaceForTraining(
      session.sub,
      row.workspace,
      row.updatedAt,
    );
    return withCors(NextResponse.json({ ok: true, stats }), req);
  } catch (e) {
    return withCors(dbError("training.sync.POST", e), req);
  }
}
