import { NextResponse } from "next/server";
import { findDoctorByEmail } from "@/lib/auth/doctor-store";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIpFromRequest, rateLimitMemory } from "@/lib/rate-limit-memory";
import { serverError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

const MAX_PASSWORD_LEN = 256;

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = rateLimitMemory(`admin_login:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  try {
    const doctor = await findDoctorByEmail(email);
    if (!doctor || !verifyPassword(password, doctor.passwordHash)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    if (doctor.active === false) {
      return NextResponse.json({ error: "account_disabled" }, { status: 403 });
    }
    if (doctor.role !== "app_admin") {
      return NextResponse.json({ error: "not_app_admin" }, { status: 403 });
    }

    const token = await createSessionToken({
      id: doctor.id,
      email: doctor.email,
      name: doctor.name,
      clinicId: doctor.clinicId ?? null,
      role: doctor.role ?? "doctor",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      admin: { id: doctor.id, email: doctor.email, name: doctor.name },
    });
  } catch (e) {
    return serverError("admin.login", e);
  }
}

