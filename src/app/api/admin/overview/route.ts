import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { listClinics } from "@/lib/db/clinics-repository";
import { listDoctorsAll, setDoctorActiveById } from "@/lib/auth/doctor-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role !== "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const [clinics, doctors] = await Promise.all([listClinics(), listDoctorsAll()]);
    return NextResponse.json({ clinics, doctors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role !== "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { doctorId?: string; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const doctorId = body.doctorId?.trim() ?? "";
  const active = body.active;
  if (!doctorId || typeof active !== "boolean") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (doctorId === session.sub && active === false) {
    return NextResponse.json({ error: "cannot_disable_self" }, { status: 400 });
  }

  try {
    const ok = await setDoctorActiveById({ id: doctorId, active });
    if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

