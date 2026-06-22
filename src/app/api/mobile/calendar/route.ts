import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { requireDoctor } from "@/lib/api/require-doctor";
import { loadDoctorWorkspaceData } from "@/lib/mobile/load-doctor-data";
import { buildCalendarWeek } from "@/lib/mobile/calendar-utils";

export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** GET /api/mobile/calendar?weekOffset=0 */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  const url = new URL(req.url);
  const weekOffset = Number(url.searchParams.get("weekOffset") ?? "0");

  try {
    const { rdvList } = await loadDoctorWorkspaceData(auth.doctor.sub);
    const calendar = buildCalendarWeek(
      rdvList,
      Number.isFinite(weekOffset) ? weekOffset : 0,
    );
    return withCors(NextResponse.json({ ok: true, ...calendar }), req);
  } catch (e) {
    return withCors(dbError("mobile.calendar.GET", e), req);
  }
}
