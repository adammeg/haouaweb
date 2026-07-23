import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { PROTOCOL_CATALOG, type ProtocolItem } from "@/lib/protocols/catalog";
import { createManagedProtocol, deleteManagedProtocol, listManagedProtocols, updateManagedProtocol } from "@/lib/db/admin-protocols-repository";
import { dbError } from "@/lib/api/error-response";

async function admin(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!(await isDoctorActive(session.sub)) || session.role !== "app_admin") return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { session };
}

function validCategory(v: unknown): v is ProtocolItem["category"] {
  return v === "obst" || v === "gyn" || v === "pma" || v === "urgence";
}

function parseProtocol(raw: unknown): Omit<ProtocolItem, "id"> | null {
  const o = raw as Partial<ProtocolItem>;
  if (!o || typeof o.title !== "string" || !o.title.trim() || !validCategory(o.category) || typeof o.summary !== "string" || !Array.isArray(o.steps)) return null;
  const steps = o.steps.filter((x): x is string => typeof x === "string" && Boolean(x.trim())).map((x) => x.trim()).slice(0, 30);
  if (!steps.length) return null;
  return { title: o.title.trim().slice(0, 180), category: o.category, summary: o.summary.trim().slice(0, 1_000), steps, references: typeof o.references === "string" ? o.references.trim().slice(0, 500) : undefined };
}

export async function GET(req: Request) {
  const auth = await admin(req); if (auth.error) return auth.error;
  try { return NextResponse.json({ builtIn: PROTOCOL_CATALOG, managed: await listManagedProtocols(true) }); }
  catch (e) { return dbError("admin.protocols.GET", e); }
}

export async function POST(req: Request) {
  const auth = await admin(req); if (auth.error) return auth.error;
  const parsed = parseProtocol(await req.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "invalid_protocol" }, { status: 400 });
  try { return NextResponse.json({ protocol: await createManagedProtocol(parsed) }, { status: 201 }); }
  catch (e) { return dbError("admin.protocols.POST", e); }
}

export async function PATCH(req: Request) {
  const auth = await admin(req); if (auth.error) return auth.error;
  const body = await req.json().catch(() => null) as ({ id?: string; active?: boolean } & Partial<ProtocolItem>) | null;
  const id = body?.id?.trim(); if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof body?.active === "boolean") patch.active = body.active;
  if (body?.title != null) patch.title = String(body.title).trim().slice(0, 180);
  if (body?.summary != null) patch.summary = String(body.summary).trim().slice(0, 1_000);
  if (body?.references != null) patch.references = String(body.references).trim().slice(0, 500);
  if (body?.category != null && validCategory(body.category)) patch.category = body.category;
  if (body?.steps != null && Array.isArray(body.steps)) patch.steps = body.steps.filter((x): x is string => typeof x === "string" && Boolean(x.trim())).map((x) => x.trim()).slice(0, 30);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  try { const ok = await updateManagedProtocol(id, patch); return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 }); }
  catch (e) { return dbError("admin.protocols.PATCH", e); }
}

export async function DELETE(req: Request) {
  const auth = await admin(req); if (auth.error) return auth.error;
  const body = await req.json().catch(() => null) as { id?: string; confirm?: string } | null;
  const id = body?.id?.trim(); if (!id || body?.confirm !== id) return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  try { const ok = await deleteManagedProtocol(id); return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found_or_builtin" }, { status: 404 }); }
  catch (e) { return dbError("admin.protocols.DELETE", e); }
}
