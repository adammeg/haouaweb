import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";

export type SessionDoctor = {
  sub: string;
  email: string;
  name: string;
  clinicId: string | null;
  role: "doctor" | "clinic_admin" | "app_admin";
};

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters).");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(doctor: {
  id: string;
  email: string;
  name: string;
  clinicId?: string | null;
  role?: "doctor" | "clinic_admin" | "app_admin";
}) {
  return new SignJWT({
    email: doctor.email,
    name: doctor.name,
    clinicId: doctor.clinicId ?? null,
    role: doctor.role ?? "doctor",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(doctor.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionDoctor> {
  const { payload } = await jwtVerify(token, secretKey());
  const sub = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const clinicId = payload.clinicId;
  const role = payload.role;
  if (
    typeof sub !== "string" ||
    typeof email !== "string" ||
    typeof name !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  const parsedClinicId =
    clinicId === null || typeof clinicId === "string" ? clinicId : null;
  const parsedRole =
    role === "clinic_admin" || role === "doctor" || role === "app_admin"
      ? role
      : "doctor";
  return { sub, email, name, clinicId: parsedClinicId, role: parsedRole };
}

export async function getSession(): Promise<SessionDoctor | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
