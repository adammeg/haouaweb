import { getClinicalBundleByDoctorId } from "@/lib/db/clinical-bundle-repository";
import { getWorkspaceByDoctorId } from "@/lib/db/workspace-repository";
import { EMPTY_CLINICAL_BUNDLE } from "@/types/clinical-bundle";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import type { Rdv } from "@/stores/rdv-store";

export type DoctorWorkspaceData = {
  patients: PatientSnapshot[];
  historyByPatient: Record<string, ConsultationEntry[]>;
  rdvList: Rdv[];
  rappelsPending: number;
};

/** Agrège patients + historique (tous profils cabinet) et agenda depuis MongoDB. */
export async function loadDoctorWorkspaceData(
  doctorId: string,
): Promise<DoctorWorkspaceData> {
  const [workspaceRow, bundleRow] = await Promise.all([
    getWorkspaceByDoctorId(doctorId),
    getClinicalBundleByDoctorId(doctorId),
  ]);

  const bundle = bundleRow?.bundle ?? EMPTY_CLINICAL_BUNDLE;
  const rdvList = bundle.agenda?.rdvList ?? [];

  const patients: PatientSnapshot[] = [];
  const historyByPatient: Record<string, ConsultationEntry[]> = {};

  if (workspaceRow?.workspace) {
    const { patientsByUser, historyByUser } = workspaceRow.workspace;
    for (const userPatients of Object.values(patientsByUser)) {
      for (const p of Object.values(userPatients)) {
        patients.push(p);
      }
    }
    for (const userHistory of Object.values(historyByUser)) {
      for (const [pid, entries] of Object.entries(userHistory)) {
        historyByPatient[pid] = [
          ...(historyByPatient[pid] ?? []),
          ...entries,
        ];
      }
    }
  }

  const rappelsPending =
    (bundle.rappels?.list ?? []).filter((r) => !r.done).length +
    rdvList.filter((r) => r.statut === "a_rappeler").length;

  return { patients, historyByPatient, rdvList, rappelsPending };
}
