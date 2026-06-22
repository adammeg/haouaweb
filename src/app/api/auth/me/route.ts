import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { withCors, optionsResponse } from "@/lib/api/cors";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return withCors(NextResponse.json({ doctor: null }, { status: 401 }), req);
  }
  return withCors(
    NextResponse.json({
      doctor: {
        id: session.sub,
        email: session.email,
        name: session.name,
        clinicId: session.clinicId,
        role: session.role,
      },
    }),
    req,
  );
}
