import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import {
  getWorkspaceByDoctorId,
  upsertWorkspace,
  type WorkspacePersisted,
} from "@/lib/db/workspace-repository";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!(await isDoctorActive(session.sub))) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }
    const row = await getWorkspaceByDoctorId(session.sub);
    if (!row) {
      return NextResponse.json({ empty: true });
    }
    return NextResponse.json({
      empty: false,
      updatedAt: row.updatedAt,
      workspace: row.workspace,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!(await isDoctorActive(session.sub))) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "bad_json" }, { status: 400 });
    }
    const workspace = parseWorkspaceBody(raw);
    if (!workspace) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const updatedAt = await upsertWorkspace(session.sub, workspace);
    return NextResponse.json({ ok: true, updatedAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
