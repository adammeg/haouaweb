import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { PROTOCOL_CATALOG } from "@/lib/protocols/catalog";
import { listManagedProtocols } from "@/lib/db/admin-protocols-repository";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isDoctorActive(session.sub))) return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  try {
    const managed = await listManagedProtocols(false);
    return NextResponse.json({ protocols: [...PROTOCOL_CATALOG, ...managed] });
  } catch (e) {
    return dbError("protocols.GET", e);
  }
}
