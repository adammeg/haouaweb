import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { buildDossierContextForIa } from "@/lib/ia/build-dossier-context";
import { buildRagBlock } from "@/lib/rag/rag-engine";
import type { PatientSnapshot } from "@/types/domain";

export class AiPatientContextError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404,
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
    const patient = patients?.[patientId];
    if (patient) return patient;
  }
  return null;
}

function ragQueryFor(patient: PatientSnapshot, question: string): string {
  return [
    patient.specialite,
    patient.motif,
    patient.symptomes,
    patient.o_terme && `grossesse ${patient.o_terme} SA`,
    patient.g_patho,
    patient.o_complic,
    patient.ec_conclusion,
    question,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1_500);
}

export async function buildAuthorizedAiContext(input: {
  doctorId: string;
  patientId: string;
  question?: string;
}): Promise<{ patient: PatientSnapshot; context: string }> {
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

  const clinicalContext = buildDossierContextForIa(patient);
  const ragBlock = buildRagBlock(ragQueryFor(patient, input.question ?? ""));
  return {
    patient,
    context: [clinicalContext, ragBlock].filter(Boolean).join("\n\n"),
  };
}
