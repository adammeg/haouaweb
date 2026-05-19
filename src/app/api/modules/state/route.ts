import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { jsonError, requireDoctor } from "@/lib/api/require-doctor";
import {
  getModulesByDoctorId,
  upsertModules,
} from "@/lib/db/modules-repository";
import type { ModulesWorkspace } from "@/types/modules";
import { ingestAllFullTrainingData } from "@/lib/training/ingest-full";

export const dynamic = "force-dynamic";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** GET /api/modules/state — partogrammes, certificats, cycles FIV locaux, etc. */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  try {
    const row = await getModulesByDoctorId(auth.doctor.sub);
    if (!row) {
      return withCors(NextResponse.json({ empty: true }), req);
    }
    return withCors(
      NextResponse.json({
        empty: false,
        updatedAt: row.updatedAt,
        workspaceByUser: row.workspaceByUser,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("modules.state.GET", e), req);
  }
}

/** PUT /api/modules/state — body: { workspaceByUser } */
export async function PUT(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return withCors(jsonError("bad_json", 400), req);
  }

  if (!isRecord(raw) || !isRecord(raw.workspaceByUser)) {
    return withCors(jsonError("invalid_body", 400), req);
  }

  try {
    const updatedAt = await upsertModules(
      auth.doctor.sub,
      raw.workspaceByUser as Record<string, ModulesWorkspace>,
    );
    void ingestAllFullTrainingData(auth.doctor.sub).catch((err) =>
      console.error("[training] modules ingest failed", err),
    );
    return withCors(NextResponse.json({ ok: true, updatedAt }), req);
  } catch (e) {
    return withCors(dbError("modules.state.PUT", e), req);
  }
}
