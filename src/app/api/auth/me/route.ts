import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ doctor: null }, { status: 401 });
  }
  return NextResponse.json({
    doctor: {
      id: session.sub,
      email: session.email,
      name: session.name,
      clinicId: session.clinicId,
      role: session.role,
    },
  });
}
