import type { WorkspacePersisted } from "@/lib/db/workspace-repository";
import { getDoctorAiTrainingSettings } from "@/lib/db/doctor-settings-repository";
import { upsertTrainingSample } from "@/lib/db/training-repository";
import { AI_TRAINING_CONSENT_VERSION } from "@/types/training";
import type { TrainingIngestStats } from "@/types/training";
import {
  anonymizePatient,
  contentHash,
} from "@/lib/training/anonymize";
import type { PatientSnapshot } from "@/types/domain";

/**
 * Ingère les dossiers patientes (anonymisés) pour le futur entraînement IA.
 * Appelé après chaque synchro workspace si le médecin a donné son consentement.
 */
export async function ingestWorkspaceForTraining(
  doctorId: string,
  workspace: WorkspacePersisted,
  sourceUpdatedAt: string,
): Promise<TrainingIngestStats> {
  const settings = await getDoctorAiTrainingSettings(doctorId);
  if (!settings.enabled) {
    return {
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      skippedNoConsent: true,
    };
  }

  const consentVersion =
    settings.consentVersion ?? AI_TRAINING_CONSENT_VERSION;

  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [workspaceUserId, patientsMap] of Object.entries(
    workspace.patientsByUser,
  )) {
    if (!patientsMap || typeof patientsMap !== "object") continue;

    const historyMap =
      workspace.historyByUser[workspaceUserId] ?? {};

    for (const patient of Object.values(
      patientsMap as Record<string, PatientSnapshot>,
    )) {
      if (!patient?.id) continue;
      processed++;

      const historyCount = historyMap[patient.id]?.length ?? 0;
      const record = anonymizePatient(
        doctorId,
        workspaceUserId,
        patient,
        historyCount,
      );
      const hash = contentHash(record);

      const result = await upsertTrainingSample({
        doctorId,
        record,
        contentHash: hash,
        consentVersion,
        sourceUpdatedAt,
      });

      if (result === "inserted") inserted++;
      else if (result === "updated") updated++;
      else skipped++;
    }
  }

  return {
    processed,
    inserted,
    updated,
    skipped,
    skippedNoConsent: false,
  };
}
