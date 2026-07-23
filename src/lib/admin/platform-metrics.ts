import { getDb } from "@/lib/db/mongo";
import type { WorkspacePersisted } from "@/lib/db/workspace-repository";
import type { ModulesWorkspace } from "@/types/modules";

export type PlatformMetrics = {
  doctors: { total: number; active: number; disabled: number; independent: number };
  clinics: number;
  patients: number;
  consultations: number;
  documents: number;
  partograms: number;
  ivfRecords: number;
  trainingSamples: number;
  storageProfiles: number;
};

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const db = await getDb();
  const [doctors, clinics, workspaces, moduleRows, ivfRecords, trainingSamples] = await Promise.all([
    db.collection("doctors").find({}, { projection: { active: 1, clinicId: 1 } }).toArray(),
    db.collection("clinics").countDocuments(),
    db.collection("workspaces").find({}, { projection: { patientsByUser: 1, historyByUser: 1 } }).toArray(),
    db.collection("doctor_modules").find({}, { projection: { workspaceByUser: 1 } }).toArray(),
    db.collection("ivf_records").countDocuments(),
    db.collection("ai_training_full_records").countDocuments(),
  ]);

  let patients = 0;
  let consultations = 0;
  for (const row of workspaces) {
    const workspace = row as unknown as Pick<WorkspacePersisted, "patientsByUser" | "historyByUser">;
    for (const map of Object.values(workspace.patientsByUser ?? {})) patients += Object.keys(map ?? {}).length;
    for (const userHistory of Object.values(workspace.historyByUser ?? {})) {
      for (const entries of Object.values(userHistory ?? {})) consultations += Array.isArray(entries) ? entries.length : 0;
    }
  }

  let documents = 0;
  let partograms = 0;
  let storageProfiles = 0;
  for (const row of moduleRows) {
    const byUser = row.workspaceByUser as Record<string, ModulesWorkspace> | undefined;
    for (const workspace of Object.values(byUser ?? {})) {
      storageProfiles++;
      documents += (workspace.documents?.length ?? 0) + (workspace.generatedDocuments?.length ?? 0);
      partograms += workspace.partograms?.length ?? 0;
    }
  }

  return {
    doctors: {
      total: doctors.length,
      active: doctors.filter((d) => d.active !== false).length,
      disabled: doctors.filter((d) => d.active === false).length,
      independent: doctors.filter((d) => !d.clinicId).length,
    },
    clinics,
    patients,
    consultations,
    documents,
    partograms,
    ivfRecords,
    trainingSamples,
    storageProfiles,
  };
}
