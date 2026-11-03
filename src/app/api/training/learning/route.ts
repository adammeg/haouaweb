import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/api/require-doctor";
import { getLearningStatus, listLearningRecords } from "@/lib/db/ai-learning-repository";
import { buildReviewedDataset, learningGate } from "@/lib/training/learning-dataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.doctor.role === "secretary") return NextResponse.json({ error: "Accès réservé au médecin" }, { status: 403 });
  try {
    const status = await getLearningStatus(auth.doctor.doctorId);
    if (new URL(req.url).searchParams.get("format") === "dataset") {
      const dataset = buildReviewedDataset(await listLearningRecords(auth.doctor.doctorId, { confirmedOnly: true, limit: 5000 }));
      return new Response(dataset.map((row) => JSON.stringify(row)).join("\n") + (dataset.length ? "\n" : ""), { headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8", "Content-Disposition": 'attachment; filename="hawae-reviewed-cases.ndjson"', "Cache-Control": "no-store",
      } });
    }
    return NextResponse.json({ status, gate: learningGate(status), mechanism: "clinician_reviewed_case_retrieval", weightsTraining: "not_started" }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Apprentissage temporairement indisponible" }, { status: 500 }); }
}
