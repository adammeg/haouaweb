import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { isDoctorActive } from "@/lib/auth/require-active";
import { createDoctor, deleteSecretary, listSecretariesByDoctorId, setSecretaryActive } from "@/lib/auth/doctor-store";

async function requireOwner() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!(await isDoctorActive(session.sub))) return { error: NextResponse.json({ error: "account_disabled" }, { status: 403 }) };
  if (session.role !== "doctor" && session.role !== "clinic_admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  return NextResponse.json({ secretaries: await listSecretariesByDoctorId(auth.session.sub) });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null) as { name?: string; email?: string; password?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }
  const result = await createDoctor({
    name, email, passwordHash: hashPassword(password), role: "secretary",
    doctorId: auth.session.sub, clinicId: auth.session.clinicId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  const { id, active, createdAt } = result.doctor;
  return NextResponse.json({ secretary: { id, name, email, active, createdAt } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null) as { id?: string; active?: boolean } | null;
  if (!body?.id || typeof body.active !== "boolean") return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  const ok = await setSecretaryActive(auth.session.sub, body.id, body.active);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const ok = await deleteSecretary(auth.session.sub, id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}
