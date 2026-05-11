import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDoctorScopedStorage } from "@/lib/storage/doctor-scoped-storage";
import { nanoid } from "nanoid";
import type {
  ConsultationEntry,
  PatientSnapshot,
  Specialty,
  UserProfile,
  UserRole,
} from "@/types/domain";
import {
  emptyConsultFields,
  extractIdentitySnapshot,
} from "@/lib/patient-utils";

const AVATAR_COLORS = [
  "#0d6e6e",
  "#7c3aed",
  "#0369a1",
  "#b45309",
  "#be185d",
  "#065f46",
  "#1e3a5f",
  "#7f1d1d",
];

function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !/^dr\.?$/i.test(p));
  if (parts.length >= 2) {
    return (
      parts[0]![0]! + parts[parts.length - 1]![0]!
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "??";
}

type PatientsMap = Record<string, PatientSnapshot>;
type HistoryMap = Record<string, ConsultationEntry[]>;

export interface HawaeState {
  users: UserProfile[];
  currentUserId: string | null;
  patientsByUser: Record<string, PatientsMap>;
  historyByUser: Record<string, HistoryMap>;
  currentPatientId: string | null;
  draft: PatientSnapshot | null;
  sidebarSpecFilter: "all" | Specialty;
  setupDone: boolean;
  workspaceSavedAt: string | null;

  ensureDefaultUser: () => void;
  setCurrentUser: (id: string) => void;
  addUser: (name: string, role: UserRole) => void;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  setSidebarSpecFilter: (f: "all" | Specialty) => void;
  markSetupDone: () => void;

  openPatient: (id: string) => void;
  closePatient: () => void;
  createNewPatient: () => string;
  deletePatient: (id: string) => void;

  patchDraft: (patch: Partial<PatientSnapshot>) => void;
  saveDraft: () => void;

  startNewConsultation: () => void;
  pushConsultationSnapshot: () => void;
  loadConsultation: (consultId: string) => void;
  deleteConsultation: (consultId: string) => void;
}

function newPatientId(): string {
  return `p_${nanoid(12)}`;
}

function newUserId(): string {
  return `user_${Date.now()}`;
}

function emptyDraft(id: string): PatientSnapshot {
  return {
    id,
    specialite: "",
    eva: "0",
  };
}

export const useHawaeStore = create<HawaeState>()(
  persist(
    (set, get) => ({
      users: [
        {
          id: "user_default",
          name: "Médecin",
          role: "chef",
          color: "#0d6e6e",
          initials: "MD",
        },
      ],
      currentUserId: "user_default",
      patientsByUser: {},
      historyByUser: {},
      currentPatientId: null,
      draft: null,
      sidebarSpecFilter: "all",
      setupDone: false,
      workspaceSavedAt: null,

      ensureDefaultUser: () => {
        const { users, currentUserId } = get();
        if (users.length === 0) {
          set({
            users: [
              {
                id: "user_default",
                name: "Médecin",
                role: "chef",
                color: "#0d6e6e",
                initials: "MD",
              },
            ],
            currentUserId: "user_default",
          });
          return;
        }
        if (!currentUserId || !users.some((u) => u.id === currentUserId)) {
          set({ currentUserId: users[0]!.id });
        }
      },

      setCurrentUser: (id) => {
        if (!get().users.some((u) => u.id === id)) return;
        set({ currentUserId: id });
      },

      addUser: (name, role) => {
        const id = newUserId();
        const color = AVATAR_COLORS[get().users.length % AVATAR_COLORS.length]!;
        const u: UserProfile = {
          id,
          name: name.trim() || "Utilisateur",
          role,
          color,
          initials: initialsFromName(name),
        };
        set({ users: [...get().users, u], currentUserId: id });
      },

      updateUser: (id, patch) => {
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, ...patch } : u,
          ),
        });
      },

      deleteUser: (id) => {
        const users = get().users.filter((u) => u.id !== id);
        const next = users[0]?.id ?? null;
        const { currentUserId, patientsByUser, historyByUser } = get();
        const nextPatients = { ...patientsByUser };
        const nextHist = { ...historyByUser };
        delete nextPatients[id];
        delete nextHist[id];
        set({
          users,
          patientsByUser: nextPatients,
          historyByUser: nextHist,
          currentUserId: currentUserId === id ? next : currentUserId,
          currentPatientId: currentUserId === id ? null : get().currentPatientId,
          draft: currentUserId === id ? null : get().draft,
        });
      },

      setSidebarSpecFilter: (f) => set({ sidebarSpecFilter: f }),
      markSetupDone: () => set({ setupDone: true }),

      openPatient: (id) => {
        const uid = get().currentUserId;
        if (!uid) return;
        const p = get().patientsByUser[uid]?.[id];
        if (!p) return;
        set({
          currentPatientId: id,
          draft: { ...p },
        });
      },

      closePatient: () => set({ currentPatientId: null, draft: null }),

      createNewPatient: () => {
        const uid = get().currentUserId;
        if (!uid) return "";
        const id = newPatientId();
        const patients = { ...(get().patientsByUser[uid] ?? {}) };
        const snap = emptyDraft(id);
        patients[id] = snap;
        set({
          patientsByUser: {
            ...get().patientsByUser,
            [uid]: patients,
          },
          currentPatientId: id,
          draft: snap,
        });
        return id;
      },

      deletePatient: (id) => {
        const uid = get().currentUserId;
        if (!uid) return;
        const patients = { ...(get().patientsByUser[uid] ?? {}) };
        delete patients[id];
        const hist = { ...(get().historyByUser[uid] ?? {}) };
        delete hist[id];
        set({
          patientsByUser: { ...get().patientsByUser, [uid]: patients },
          historyByUser: { ...get().historyByUser, [uid]: hist },
          currentPatientId:
            get().currentPatientId === id ? null : get().currentPatientId,
          draft: get().currentPatientId === id ? null : get().draft,
        });
      },

      patchDraft: (patch) => {
        const d = get().draft;
        if (!d) return;
        set({
          draft: {
            ...d,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      saveDraft: () => {
        const uid = get().currentUserId;
        const id = get().currentPatientId;
        const draft = get().draft;
        if (!uid || !id || !draft) return;
        const patients = { ...(get().patientsByUser[uid] ?? {}) };
        const merged: PatientSnapshot = {
          ...draft,
          id,
          lastSaved: new Date().toISOString(),
        };
        patients[id] = merged;
        set({
          patientsByUser: { ...get().patientsByUser, [uid]: patients },
          draft: merged,
        });
      },

      startNewConsultation: () => {
        const uid = get().currentUserId;
        const id = get().currentPatientId;
        const draft = get().draft;
        if (!uid || !id || !draft) return;

        const hasContent =
          Boolean(draft.motif?.trim()) ||
          Boolean(draft.symptomes?.trim()) ||
          Boolean(draft.o_terme?.trim()) ||
          Boolean(draft.o_gest?.trim());

        if (hasContent) {
          const hist = { ...(get().historyByUser[uid] ?? {}) };
          const list = [...(hist[id] ?? [])];
          list.unshift({
            id: `c_${Date.now()}`,
            date: new Date().toISOString(),
            specialite: (draft.specialite as Specialty) || "",
            motif: draft.motif?.trim() || "Consultation",
            symptomes: draft.symptomes?.trim() || "",
            terme: draft.o_terme,
            data: { ...draft },
          });
          hist[id] = list;
          set({ historyByUser: { ...get().historyByUser, [uid]: hist } });
        }

        const identity = extractIdentitySnapshot(draft);
        set({
          draft: {
            ...emptyDraft(id),
            ...identity,
            id,
            specialite: (draft.specialite as Specialty) || "",
            ...emptyConsultFields(),
            hawaeIaHistory: draft.hawaeIaHistory,
            ordonnanceLines: draft.ordonnanceLines,
            ordonnanceNote: draft.ordonnanceNote,
            ordonnanceValidite: draft.ordonnanceValidite,
          } as PatientSnapshot,
        });
      },

      pushConsultationSnapshot: () => {
        const uid = get().currentUserId;
        const id = get().currentPatientId;
        const draft = get().draft;
        if (!uid || !id || !draft) return;

        const hist = { ...(get().historyByUser[uid] ?? {}) };
        const list = [...(hist[id] ?? [])];
        list.unshift({
          id: `c_${Date.now()}`,
          date: new Date().toISOString(),
          specialite: (draft.specialite as Specialty) || "",
          motif: draft.motif?.trim() || "Consultation",
          symptomes: draft.symptomes?.trim() || "",
          terme: draft.o_terme,
          data: { ...draft },
        });
        hist[id] = list;
        set({ historyByUser: { ...get().historyByUser, [uid]: hist } });
      },

      loadConsultation: (consultId) => {
        const uid = get().currentUserId;
        const id = get().currentPatientId;
        if (!uid || !id) return;
        const list = get().historyByUser[uid]?.[id] ?? [];
        const c = list.find((x) => x.id === consultId);
        if (!c) return;
        set({ draft: { ...c.data, id } });
      },

      deleteConsultation: (consultId) => {
        const uid = get().currentUserId;
        const id = get().currentPatientId;
        if (!uid || !id) return;
        const hist = { ...(get().historyByUser[uid] ?? {}) };
        hist[id] = (hist[id] ?? []).filter((c) => c.id !== consultId);
        set({ historyByUser: { ...get().historyByUser, [uid]: hist } });
      },
    }),
    {
      name: "hawae-md-v1",
      storage: createJSONStorage(() => createDoctorScopedStorage()),
      partialize: (s) => ({
        users: s.users,
        currentUserId: s.currentUserId,
        patientsByUser: s.patientsByUser,
        historyByUser: s.historyByUser,
        setupDone: s.setupDone,
        workspaceSavedAt: s.workspaceSavedAt,
      }),
    },
  ),
);
