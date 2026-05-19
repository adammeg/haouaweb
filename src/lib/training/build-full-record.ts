import { createHash } from "crypto";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import type { DoctorClinicalBundle } from "@/types/clinical-bundle";
import type { ModulesWorkspace } from "@/types/modules";
import type { IvfPatientRecord } from "@/lib/db/ivf-repository";
import type { FullPatientTrainingRecord } from "@/types/training";

function matchesPatientId(
  rowPatientId: string | undefined,
  patientId: string,
): boolean {
  return Boolean(rowPatientId && rowPatientId === patientId);
}

function filterModulesForPatient(
  modules: ModulesWorkspace,
  patientId: string,
  patientName: string,
): FullPatientTrainingRecord["modulesForPatient"] {
  const nameLower = patientName.trim().toLowerCase();
  const byName = (name?: string) =>
    nameLower.length > 0 && name?.trim().toLowerCase() === nameLower;

  return {
    certificates: modules.certificates.filter(
      (c) =>
        matchesPatientId(c.patientId, patientId) ||
        byName(c.patientName),
    ),
    partograms: modules.partograms.filter(
      (p) =>
        matchesPatientId(p.patientId, patientId) ||
        byName(p.patientName),
    ),
    documents: modules.documents.filter((d) =>
      matchesPatientId(d.patientId, patientId),
    ),
    waitingQueue: modules.waitingQueue.filter((w) =>
      matchesPatientId(w.patientId, patientId),
    ),
    ivfProfiles: modules.ivfProfiles.filter(
      (p) =>
        matchesPatientId(p.patientId, patientId) ||
        byName(p.patientName),
    ),
  };
}

export function buildFullPatientTrainingPayload(input: {
  patient: PatientSnapshot;
  workspaceUserId: string;
  consultationHistory: ConsultationEntry[];
  ivf: IvfPatientRecord | null;
  modules: ModulesWorkspace;
}): Omit<
  FullPatientTrainingRecord,
  | "id"
  | "doctorId"
  | "patientId"
  | "workspaceUserId"
  | "contentHash"
  | "consentVersion"
  | "sourceUpdatedAt"
  | "ingestedAt"
> {
  const displayName = [input.patient.prenom, input.patient.nom]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    patient: input.patient,
    consultationHistory: input.consultationHistory,
    ivf: input.ivf
      ? {
          profile: input.ivf.profile,
          analysis: input.ivf.analysis,
          cycles: input.ivf.cycles,
        }
      : null,
    modulesForPatient: filterModulesForPatient(
      input.modules,
      input.patient.id,
      displayName,
    ),
  };
}

export function fullTrainingContentHash(
  payload: ReturnType<typeof buildFullPatientTrainingPayload>,
): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function mergeModulesForUser(
  bundle: DoctorClinicalBundle | null,
  modulesFromDb: Record<string, ModulesWorkspace> | undefined,
  workspaceUserId: string,
): ModulesWorkspace {
  const fromBundle =
    bundle?.modulesByUser?.[workspaceUserId] ?? null;
  const fromLegacy = modulesFromDb?.[workspaceUserId] ?? null;
  if (fromBundle && fromLegacy) {
    return {
      ...fromLegacy,
      ...fromBundle,
      waitingQueue: fromBundle.waitingQueue.length
        ? fromBundle.waitingQueue
        : fromLegacy.waitingQueue,
      partograms: fromBundle.partograms.length
        ? fromBundle.partograms
        : fromLegacy.partograms,
      certificates: fromBundle.certificates.length
        ? fromBundle.certificates
        : fromLegacy.certificates,
      documents: fromBundle.documents.length
        ? fromBundle.documents
        : fromLegacy.documents,
      ivfProfiles: fromBundle.ivfProfiles.length
        ? fromBundle.ivfProfiles
        : fromLegacy.ivfProfiles,
    };
  }
  return fromBundle ?? fromLegacy ?? {
    waitingQueue: [],
    partograms: [],
    certificates: [],
    documents: [],
    ivfProfiles: [],
    teachMode: false,
    lastBackupAt: null,
  };
}
