import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import {
  deleteIvfRecord,
  getIvfRecord,
  listIvfCyclesForDoctor,
  upsertIvfRecord,
} from "@/lib/db/ivf-repository";
import { analyzeIVF, selectProtocol } from "@/lib/pma/ivf-engine";
import { ivfProfileFromPatient } from "@/lib/pma/ivf-profile-mapper";
import type { IvfAnalysis, IvfPatientProfile } from "@/lib/pma/ivf-types";
import type { PatientSnapshot } from "@/types/domain";
import type { IvfProfile } from "@/types/modules";
import { ingestPatientById } from "@/lib/training/ingest-full";

function findPatient(
  workspace: Awaited<ReturnType<typeof getWorkspaceByDoctorId>>,
  patientId: string,
): PatientSnapshot | null {
  if (!workspace) return null;
  for (const map of Object.values(workspace.workspace.patientsByUser)) {
    if (map[patientId]) return map[patientId];
  }
  return null;
}

export async function loadIvfBundle(doctorId: string, patientId: string) {
  const [record, workspace] = await Promise.all([
    getIvfRecord(doctorId, patientId),
    getWorkspaceByDoctorId(doctorId),
  ]);
  const patient = findPatient(workspace, patientId);
  const profileFromDossier = patient
    ? ivfProfileFromPatient(patient)
    : null;

  return {
    patient,
    profile: record?.profile ?? profileFromDossier,
    analysis: record?.analysis ?? null,
    cycles: record?.cycles ?? [],
    updatedAt: record?.updatedAt.toISOString() ?? null,
  };
}

export async function saveIvfProfile(
  doctorId: string,
  patientId: string,
  profile: IvfPatientProfile,
) {
  const updatedAt = await upsertIvfRecord(doctorId, patientId, { profile });
  void ingestPatientById(doctorId, patientId).catch((err) =>
    console.error("[training] ivf profile ingest", err),
  );
  return { updatedAt };
}

export async function runIvfAnalysis(
  doctorId: string,
  patientId: string,
  profile: IvfPatientProfile,
) {
  if (profile.age == null) {
    throw new Error("age_required");
  }
  const analysis = analyzeIVF(profile, patientId);
  const updatedAt = await upsertIvfRecord(doctorId, patientId, {
    profile,
    analysis,
  });
  void ingestPatientById(doctorId, patientId).catch((err) =>
    console.error("[training] ivf analyze ingest", err),
  );
  return { analysis, updatedAt };
}

export async function runIvfProtocolSelect(
  doctorId: string,
  patientId: string,
  protocolId: string,
) {
  const record = await getIvfRecord(doctorId, patientId);
  if (!record?.analysis) throw new Error("analysis_required");
  const analysis = selectProtocol(record.analysis, protocolId, record.profile);
  const updatedAt = await upsertIvfRecord(doctorId, patientId, { analysis });
  void ingestPatientById(doctorId, patientId).catch((err) =>
    console.error("[training] ivf protocol ingest", err),
  );
  return { analysis, updatedAt };
}

export async function resetIvfPatient(doctorId: string, patientId: string) {
  await deleteIvfRecord(doctorId, patientId);
}

export async function listDoctorCycles(doctorId: string) {
  return listIvfCyclesForDoctor(doctorId);
}

export async function appendIvfCycle(
  doctorId: string,
  patientId: string,
  cycle: IvfProfile,
) {
  const record = await getIvfRecord(doctorId, patientId);
  const cycles = record?.cycles ?? [];
  const rest = cycles.filter((c) => c.id !== cycle.id);
  const updatedAt = await upsertIvfRecord(doctorId, patientId, {
    cycles: [cycle, ...rest],
  });
  return { cycles: [cycle, ...rest], updatedAt };
}

export async function removeIvfCycle(
  doctorId: string,
  patientId: string,
  cycleId: string,
) {
  const record = await getIvfRecord(doctorId, patientId);
  if (!record) return;
  const cycles = record.cycles.filter((c) => c.id !== cycleId);
  await upsertIvfRecord(doctorId, patientId, { cycles });
}

export type { IvfAnalysis, IvfPatientProfile };
