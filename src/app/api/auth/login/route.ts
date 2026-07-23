import { NextResponse } from "next/server";
import { findDoctorByEmail } from "@/lib/auth/doctor-store";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIpFromRequest, rateLimitMemory } from "@/lib/rate-limit-memory";
import { serverError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";

export const dynamic = "force-dynamic";

const MAX_PASSWORD_LEN = 256;

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = rateLimitMemory(`login:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return withCors(
      NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      ),
      req,
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: "bad_json" }, { status: 400 }), req);
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return withCors(
      NextResponse.json({ error: "missing_fields" }, { status: 400 }),
      req,
    );
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return withCors(
      NextResponse.json({ error: "invalid_credentials" }, { status: 401 }),
      req,
    );
  }

  try {
    const doctor = await findDoctorByEmail(email);
    if (!doctor || !verifyPassword(password, doctor.passwordHash)) {
      return withCors(
        NextResponse.json({ error: "invalid_credentials" }, { status: 401 }),
        req,
      );
    }
    if (doctor.active === false) {
      return withCors(
        NextResponse.json({ error: "account_disabled" }, { status: 403 }),
        req,
      );
    }

    const token = await createSessionToken({
      id: doctor.id,
      email: doctor.email,
      name: doctor.name,
      clinicId: doctor.clinicId ?? null,
      role: doctor.role ?? "doctor",
      doctorId: doctor.doctorId ?? doctor.id,
    });
    await setSessionCookie(token);

    return withCors(
      NextResponse.json({
        ok: true,
        /** JWT pour apps mobiles (Authorization: Bearer). */
        accessToken: token,
        expiresIn: 60 * 60 * 24 * 7,
        doctor: { id: doctor.id, email: doctor.email, name: doctor.name, role: doctor.role ?? "doctor" },
      }),
      req,
    );
  } catch (e) {
    return withCors(serverError("auth.login", e), req);
  }
}
