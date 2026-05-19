import { getClinicalBundleByDoctorId } from "@/lib/db/clinical-bundle-repository";
import { getModulesByDoctorId } from "@/lib/db/modules-repository";
import {
  getIvfRecord,
  listIvfRecordsByDoctor,
} from "@/lib/db/ivf-repository";
import { upsertFullTrainingRecord } from "@/lib/db/full-training-repository";
import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { getDoctorAiTrainingSettings } from "@/lib/db/doctor-settings-repository";
import { AI_TRAINING_CONSENT_VERSION } from "@/types/training";
import type { TrainingIngestStats } from "@/types/training";
import type { PatientSnapshot } from "@/types/domain";
import {
  buildFullPatientTrainingPayload,
  fullTrainingContentHash,
  mergeModulesForUser,
} from "@/lib/training/build-full-record";

/**
 * Ingère tous les dossiers (données complètes) pour l'entraînement IA.
 * Sources MongoDB : workspaces, doctor_clinical_bundles, doctor_modules, ivf_records.
 */
export async function ingestAllFullTrainingData(
  doctorId: string,
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

  const [workspaceRow, bundleRow, modulesRow, ivfMap] = await Promise.all([
    getWorkspaceByDoctorId(doctorId),
    getClinicalBundleByDoctorId(doctorId),
    getModulesByDoctorId(doctorId),
    listIvfRecordsByDoctor(doctorId),
  ]);

  if (!workspaceRow) {
    return {
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      skippedNoConsent: false,
    };
  }

  const sourceUpdatedAt = workspaceRow.updatedAt;
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [workspaceUserId, patientsMap] of Object.entries(
    workspaceRow.workspace.patientsByUser,
  )) {
    if (!patientsMap || typeof patientsMap !== "object") continue;

    const historyMap =
      workspaceRow.workspace.historyByUser[workspaceUserId] ?? {};
    const modules = mergeModulesForUser(
      bundleRow?.bundle ?? null,
      modulesRow?.workspaceByUser,
      workspaceUserId,
    );

    for (const patient of Object.values(
      patientsMap as Record<string, PatientSnapshot>,
    )) {
      if (!patient?.id) continue;
      processed++;

      const payload = buildFullPatientTrainingPayload({
        patient,
        workspaceUserId,
        consultationHistory: historyMap[patient.id] ?? [],
        ivf: ivfMap.get(patient.id) ?? null,
        modules,
      });
      const hash = fullTrainingContentHash(payload);

      const result = await upsertFullTrainingRecord({
        doctorId,
        patientId: patient.id,
        workspaceUserId,
        record: payload,
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

/** Ingère un dossier par identifiant patient (ex. après sauvegarde FIV). */
export async function ingestPatientById(
  doctorId: string,
  patientId: string,
): Promise<void> {
  const workspaceRow = await getWorkspaceByDoctorId(doctorId);
  if (!workspaceRow) return;
  for (const [workspaceUserId, patientsMap] of Object.entries(
    workspaceRow.workspace.patientsByUser,
  )) {
    const patient = (patientsMap as Record<string, PatientSnapshot>)[patientId];
    if (patient) {
      await ingestSinglePatientFullTraining(
        doctorId,
        workspaceUserId,
        patient,
      );
      return;
    }
  }
}

/** Ingère un seul dossier (après mise à jour FIV ou dossier). */
export async function ingestSinglePatientFullTraining(
  doctorId: string,
  workspaceUserId: string,
  patient: PatientSnapshot,
): Promise<"skipped" | "inserted" | "updated" | "unchanged" | "no_consent"> {
  const settings = await getDoctorAiTrainingSettings(doctorId);
  if (!settings.enabled) return "no_consent";

  const [workspaceRow, bundleRow, modulesRow, ivf] = await Promise.all([
    getWorkspaceByDoctorId(doctorId),
    getClinicalBundleByDoctorId(doctorId),
    getModulesByDoctorId(doctorId),
    getIvfRecord(doctorId, patient.id),
  ]);

  if (!workspaceRow) return "skipped";

  const historyMap =
    workspaceRow.workspace.historyByUser[workspaceUserId] ?? {};
  const modules = mergeModulesForUser(
    bundleRow?.bundle ?? null,
    modulesRow?.workspaceByUser,
    workspaceUserId,
  );

  const payload = buildFullPatientTrainingPayload({
    patient,
    workspaceUserId,
    consultationHistory: historyMap[patient.id] ?? [],
    ivf,
    modules,
  });

  return upsertFullTrainingRecord({
    doctorId,
    patientId: patient.id,
    workspaceUserId,
    record: payload,
    contentHash: fullTrainingContentHash(payload),
    consentVersion: settings.consentVersion ?? AI_TRAINING_CONSENT_VERSION,
    sourceUpdatedAt: workspaceRow.updatedAt,
  });
}
