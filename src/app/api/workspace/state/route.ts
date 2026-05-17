import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { isDoctorActive } from "@/lib/auth/require-active";
import {
  getWorkspaceByDoctorId,
  upsertWorkspace,
  type WorkspacePersisted,
} from "@/lib/db/workspace-repository";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseWorkspaceBody(raw: unknown): WorkspacePersisted | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.users)) return null;
  const currentUserId =
    raw.currentUserId === null || typeof raw.currentUserId === "string"
      ? raw.currentUserId
      : null;
  const patientsByUser = isRecord(raw.patientsByUser) ? raw.patientsByUser : {};
  const historyByUser = isRecord(raw.historyByUser) ? raw.historyByUser : {};
  const setupDone = Boolean(raw.setupDone);
  const workspaceSavedAt =
    raw.workspaceSavedAt === null || typeof raw.workspaceSavedAt === "string"
      ? raw.workspaceSavedAt
      : null;
  return {
    users: raw.users as WorkspacePersisted["users"],
    currentUserId,
    patientsByUser: patientsByUser as WorkspacePersisted["patientsByUser"],
    historyByUser: historyByUser as WorkspacePersisted["historyByUser"],
    setupDone,
    workspaceSavedAt,
  };
}

export async function GET(req: Request) {
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
      return withCors(NextResponse.json({ empty: true }), req);
    }
    return withCors(
      NextResponse.json({
        empty: false,
        updatedAt: row.updatedAt,
        workspace: row.workspace,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("workspace.state.GET", e), req);
  }
}

export async function PUT(req: Request) {
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
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return withCors(
        NextResponse.json({ error: "bad_json" }, { status: 400 }),
        req,
      );
    }
    const workspace = parseWorkspaceBody(raw);
    if (!workspace) {
      return withCors(
        NextResponse.json({ error: "invalid_body" }, { status: 400 }),
        req,
      );
    }
    const updatedAt = await upsertWorkspace(session.sub, workspace);
    return withCors(NextResponse.json({ ok: true, updatedAt }), req);
  } catch (e) {
    return withCors(dbError("workspace.state.PUT", e), req);
  }
}
