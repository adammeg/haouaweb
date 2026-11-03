import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { buildDossierContextForIa } from "@/lib/ia/build-dossier-context";
import { retrieveRagEvidence, type RagHit } from "@/lib/rag/rag-engine";
import { clinicalRevision } from "./clinical-revision";
import type { PatientSnapshot } from "@/types/domain";

export class AiPatientContextError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
  ) {
    super(message);
    this.name = "AiPatientContextError";
  }
}

function findPatient(
  patientsByUser: Record<string, Record<string, PatientSnapshot>>,
  patientId: string,
): PatientSnapshot | null {
  for (const patients of Object.values(patientsByUser)) {
    const patient = patients && Object.prototype.hasOwnProperty.call(patients, patientId) ? patients[patientId] : null;
    if (patient) return patient;
  }
  return null;
}

function ragQueryFor(patient: PatientSnapshot, question: string): string {
  return [
    patient.specialite,
    patient.motif?.slice(0, 300),
    patient.symptomes?.slice(0, 300),
    patient.o_terme && `grossesse ${patient.o_terme} SA`,
    patient.g_patho,
    patient.o_complic,
    patient.ec_conclusion,
    patient.i_cause_inf,
    patient.o_atcd_pe === "oui" && "prééclampsie",
    patient.o_atcd_vte === "oui" && "thrombose VTE",
    patient.i_atcd_ohss && patient.i_atcd_ohss !== "non" && "OHSS",
    question.slice(0, 400),
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1_500);
}

export async function buildAuthorizedAiContext(input: {
  doctorId: string;
  patientId: string;
  question?: string;
  expectedRevision?: string;
}): Promise<{ patient: PatientSnapshot; context: string; evidence: RagHit[]; revision: string }> {
  const patientId = input.patientId.trim();
  if (!patientId) throw new AiPatientContextError("Dossier manquant", 400);

  const workspace = await getWorkspaceByDoctorId(input.doctorId);
  const patient = workspace
    ? findPatient(workspace.workspace.patientsByUser, patientId)
    : null;
  if (!patient) {
    throw new AiPatientContextError(
      "Dossier introuvable ou non autorisé. Sauvegardez-le avant l'analyse IA.",
      404,
    );
  }

  const revision = await clinicalRevision(patient);
  if (!input.expectedRevision || input.expectedRevision !== revision) {
    throw new AiPatientContextError("Le dossier enregistré a changé. Sauvegardez et relancez l'analyse.", 409);
  }
  const clinicalContext = buildDossierContextForIa(patient);
  const evidence = retrieveRagEvidence(input.question ?? "", ragQueryFor(patient, ""));
  return {
    patient,
    context: clinicalContext,
    evidence,
    revision,
  };
}
