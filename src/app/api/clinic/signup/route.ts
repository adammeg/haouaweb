import { NextResponse } from "next/server";
import { createClinic } from "@/lib/db/clinics-repository";
import { createDoctor } from "@/lib/auth/doctor-store";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIpFromRequest, rateLimitMemory } from "@/lib/rate-limit-memory";
import { serverError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LEN = 256;
const MAX_NAME_LEN = 120;
const MAX_CLINIC_LEN = 120;

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = rateLimitMemory(`clinic_signup:${ip}`, 4, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: {
    clinicName?: string;
    adminName?: string;
    email?: string;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const clinicName = body.clinicName?.trim() ?? "";
  const adminName = body.adminName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!clinicName || !adminName || !email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (clinicName.length > MAX_CLINIC_LEN) {
    return NextResponse.json({ error: "invalid_clinic_name" }, { status: 400 });
  }
  if (adminName.length > MAX_NAME_LEN) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: "password_too_long" }, { status: 400 });
  }

  try {
    const clinicRes = await createClinic({ name: clinicName });
    if (!clinicRes.ok) {
      return NextResponse.json({ error: clinicRes.error }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const doctorRes = await createDoctor({
      email,
      passwordHash,
      name: adminName,
      clinicId: clinicRes.clinic.id,
      role: "clinic_admin",
    });
    if (!doctorRes.ok) {
      return NextResponse.json({ error: doctorRes.error }, { status: 409 });
    }

    const token = await createSessionToken({
      id: doctorRes.doctor.id,
      email: doctorRes.doctor.email,
      name: doctorRes.doctor.name,
      clinicId: doctorRes.doctor.clinicId ?? null,
      role: doctorRes.doctor.role ?? "clinic_admin",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      clinic: {
        id: clinicRes.clinic.id,
        name: clinicRes.clinic.name,
        slug: clinicRes.clinic.slug,
      },
      admin: {
        id: doctorRes.doctor.id,
        email: doctorRes.doctor.email,
        name: doctorRes.doctor.name,
      },
    });
  } catch (e) {
    return serverError("clinic.signup", e);
  }
}

