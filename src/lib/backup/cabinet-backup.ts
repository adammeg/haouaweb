import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore } from "@/stores/modules-store";
import { useRdvStore, type Rdv } from "@/stores/rdv-store";
import {
  useRappelsStore,
  type Rappel,
  type RappelContact,
} from "@/stores/rappels-store";
import { usePractitionerStore } from "@/stores/practitioner-store";
import type { ConsultationEntry, PatientSnapshot, UserProfile } from "@/types/domain";
import type { ModulesWorkspace } from "@/types/modules";
import type { PractitionerProfile } from "@/types/practitioner";
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
  appointments: Rdv[];
  reminders: Rappel[];
  reminderContacts: RappelContact[];
  readNotifications: string[];
  practitioner: PractitionerProfile;
  preferences?: Record<string, unknown>;
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
    appointments: useRdvStore.getState().list,
    reminders: useRappelsStore.getState().list,
    reminderContacts: useRappelsStore.getState().contacts,
    readNotifications: useRappelsStore.getState().readNotifs,
    practitioner: usePractitionerStore.getState().profile,
    preferences: readPreferences(),
  };
}

function readPreferences(): Record<string, unknown> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = JSON.parse(localStorage.getItem("hawae-prefs-v1") || "{}");
    return value && typeof value === "object" ? value : undefined;
  } catch {
    return undefined;
  }
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

  if (Array.isArray(data.appointments)) {
    useRdvStore.setState({ list: data.appointments });
  }
  if (Array.isArray(data.reminders)) {
    useRappelsStore.setState({
      list: data.reminders,
      contacts: Array.isArray(data.reminderContacts)
        ? data.reminderContacts
        : [],
      readNotifs: Array.isArray(data.readNotifications)
        ? data.readNotifications
        : [],
    });
  }
  if (data.practitioner && typeof data.practitioner === "object") {
    usePractitionerStore.setState({ profile: data.practitioner });
  }
  if (
    typeof window !== "undefined" &&
    data.preferences &&
    typeof data.preferences === "object"
  ) {
    localStorage.setItem("hawae-prefs-v1", JSON.stringify(data.preferences));
  }

  onDone?.(`${count} dossier${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""}. Rechargez la page pour appliquer toutes les préférences.`);
  return true;
}
