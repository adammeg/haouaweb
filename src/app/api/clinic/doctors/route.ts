import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createDoctor, listDoctorsByClinicId } from "@/lib/auth/doctor-store";
import { hashPassword } from "@/lib/auth/password";
import { isDoctorActive } from "@/lib/auth/require-active";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role === "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (session.role !== "clinic_admin" || !session.clinicId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const doctors = await listDoctorsByClinicId(session.clinicId);
    return NextResponse.json({ doctors });
  } catch (e) {
    return dbError("clinic.doctors.GET", e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role === "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (session.role !== "clinic_admin" || !session.clinicId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  if (password.length > 256) {
    return NextResponse.json({ error: "password_too_long" }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  try {
    const passwordHash = hashPassword(password);
    const result = await createDoctor({
      email,
      passwordHash,
      name,
      clinicId: session.clinicId,
      role: "doctor",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      doctor: {
        id: result.doctor.id,
        email: result.doctor.email,
        name: result.doctor.name,
        role: result.doctor.role ?? "doctor",
        createdAt: result.doctor.createdAt,
      },
    });
  } catch (e) {
    return dbError("clinic.doctors.POST", e);
  }
}

