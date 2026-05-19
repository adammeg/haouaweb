import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDoctorActive } from "@/lib/auth/require-active";
import { exportTrainingSamplesForMl } from "@/lib/db/training-repository";
import { dbError } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    50_000,
    Math.max(1, parseInt(limitRaw ?? "5000", 10) || 5000),
  );
  const format = url.searchParams.get("format") ?? "ndjson";

  try {
    const samples = await exportTrainingSamplesForMl(limit);

    if (format === "json") {
      return NextResponse.json({ samples, count: samples.length });
    }

    const ndjson =
      samples.map((row) => JSON.stringify(row)).join("\n") + "\n";
    return new NextResponse(ndjson, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="hawae-training-' +
          new Date().toISOString().slice(0, 10) +
          '.ndjson"',
      },
    });
  } catch (e) {
    return dbError("admin.training.export.GET", e);
  }
}
