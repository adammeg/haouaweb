import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore } from "@/stores/modules-store";
import type { ConsultationEntry, PatientSnapshot, UserProfile } from "@/types/domain";
import type { ModulesWorkspace } from "@/types/modules";
import { EMPTY_MODULES } from "@/types/modules";

type PatientsMap = Record<string, PatientSnapshot>;
type HistoryMap = Record<string, ConsultationEntry[]>;

export type CabinetBackup = {
  version: string;
  exportedAt: string;
  doctorId?: string;
  patients: PatientsMap;
  historique: HistoryMap;
  modules: ModulesWorkspace;
  users?: UserProfile[];
  currentUserId?: string | null;
};

export function buildCabinetBackup(doctorId?: string): CabinetBackup {
  const hawae = useHawaeStore.getState();
  const userId = hawae.currentUserId ?? "user_default";

  return {
    version: "HawaeMD-v51",
    exportedAt: new Date().toISOString(),
    doctorId,
    patients: hawae.patientsByUser[userId] ?? {},
    historique: hawae.historyByUser[userId] ?? {},
    modules:
      useModulesStore.getState().workspaceByUser[userId] ?? EMPTY_MODULES,
    users: hawae.users,
    currentUserId: hawae.currentUserId,
  };
}

export function downloadCabinetBackup(doctorId?: string): number {
  const data = buildCabinetBackup(doctorId);
  const count = Object.keys(data.patients).length;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `HawaeMD-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  useModulesStore.getState().markBackup();
  return count;
}

export function importCabinetBackup(
  raw: unknown,
  onDone?: (message: string) => void,
): boolean {
  const data = raw as Partial<CabinetBackup>;
  if (!data.patients || typeof data.patients !== "object") {
    onDone?.("Fichier invalide — patients manquants.");
    return false;
  }

  const hawae = useHawaeStore.getState();
  const userId = hawae.currentUserId ?? "user_default";
  const count = Object.keys(data.patients).length;

  useHawaeStore.setState((s) => ({
    patientsByUser: {
      ...s.patientsByUser,
      [userId]: {
        ...(s.patientsByUser[userId] ?? {}),
        ...data.patients,
      },
    },
    historyByUser: data.historique
      ? {
          ...s.historyByUser,
          [userId]: {
            ...(s.historyByUser[userId] ?? {}),
            ...data.historique,
          },
        }
      : s.historyByUser,
    users: Array.isArray(data.users) ? data.users : s.users,
    currentUserId:
      data.currentUserId && typeof data.currentUserId === "string"
        ? data.currentUserId
        : s.currentUserId,
  }));

  if (data.modules) {
    useModulesStore.getState().importWorkspace(data.modules);
  }

  onDone?.(`${count} dossier${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""}.`);
  return true;
}
