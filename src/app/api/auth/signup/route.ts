import { NextResponse } from "next/server";
import { createDoctor } from "@/lib/auth/doctor-store";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { clientIpFromRequest, rateLimitMemory } from "@/lib/rate-limit-memory";
import { serverError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LEN = 256;
const MAX_NAME_LEN = 120;

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = rateLimitMemory(`signup:${ip}`, 8, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";
  if (!email || !password || !name) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: "password_too_long" }, { status: 400 });
  }

  try {
    const passwordHash = hashPassword(password);
    const result = await createDoctor({ email, passwordHash, name });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const { doctor } = result;
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
      doctor: { id: doctor.id, email: doctor.email, name: doctor.name },
    });
  } catch (e) {
    return serverError("auth.signup", e);
  }
}
