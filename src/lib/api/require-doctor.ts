import { NextResponse } from "next/server";
import { isDoctorActive } from "@/lib/auth/require-active";
import {
  getSessionFromRequest,
  type SessionDoctor,
} from "@/lib/auth/session";

export type DoctorContext = SessionDoctor;

/**
 * Authentification API : cookie session (web) ou Authorization: Bearer (mobile).
 */
export async function requireDoctor(
  req: Request,
): Promise<{ doctor: DoctorContext } | NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  return { doctor: session };
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status });
}
