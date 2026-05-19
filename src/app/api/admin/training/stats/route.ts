import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { getTrainingDatasetStats } from "@/lib/db/training-repository";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await isDoctorActive(session.sub))) {
    return NextResponse.json({ error: "account_disabled" }, { status: 403 });
  }
  if (session.role !== "app_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const stats = await getTrainingDatasetStats();
    return NextResponse.json({ stats });
  } catch (e) {
    return dbError("admin.training.stats.GET", e);
  }
}
