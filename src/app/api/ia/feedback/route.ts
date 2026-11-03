import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/api/require-doctor";
import { rateLimitMemory } from "@/lib/rate-limit-memory";
import { AiPatientContextError, loadAuthorizedAiPatient } from "@/lib/ia/authorized-patient-context";
import { getLearningGeneration, updateLearningReview } from "@/lib/db/ai-learning-repository";
import { parseLearningFeedback } from "@/lib/training/learning-review";
import { learningPatientRef, scrubLearningText } from "@/lib/training/learning-features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.doctor.role === "secretary") return NextResponse.json({ error: "Accès réservé au médecin" }, { status: 403 });
  if (!rateLimitMemory(`ia-feedback:${auth.doctor.sub}`, 30, 60_000).ok) return NextResponse.json({ error: "Trop de retours" }, { status: 429 });
  let input: ReturnType<typeof parseLearningFeedback>;
  try {
    const raw = await req.text();
    if (raw.length > 12_000) throw new Error("Retour trop long");
    input = parseLearningFeedback(JSON.parse(raw));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Retour invalide" }, { status: 400 }); }
  try {
    const doctorId = auth.doctor.doctorId;
    const patient = await loadAuthorizedAiPatient(doctorId, input.patientId);
    const generation = await getLearningGeneration(doctorId, input.generationId);
    if (!generation || generation.patientRef !== learningPatientRef(doctorId, patient.id)) return NextResponse.json({ error: "Cette réponse n'est pas disponible pour l'apprentissage. Vérifiez la contribution dans les paramètres." }, { status: 404 });
    if (generation.revision !== input.revision) return NextResponse.json({ error: "Le retour ne correspond pas à la réponse sélectionnée" }, { status: 409 });
    const saved = await updateLearningReview(generation, {
      verdict: input.verdict, outcome: input.outcome, confirmedByClinician: input.confirmedByClinician,
      confirmedDiagnosis: scrubLearningText(input.confirmedDiagnosis, patient), correctedResponse: scrubLearningText(input.correctedResponse, patient), rationale: scrubLearningText(input.rationale, patient),
      reviewedAt: new Date().toISOString(), reviewerId: auth.doctor.sub,
    });
    if (!saved) return NextResponse.json({ error: "Contribution désactivée ou génération retirée" }, { status: 409 });
    return NextResponse.json({ saved: true, use: input.verdict === "corrected" && input.outcome === "confirmed" ? generation.split === "train" ? "reviewed_memory" : "evaluation_holdout" : "feedback_only" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiPatientContextError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Impossible d'enregistrer ce retour" }, { status: 500 });
  }
}
