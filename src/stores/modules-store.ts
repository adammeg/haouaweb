import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDoctorScopedStorage } from "@/lib/storage/doctor-scoped-storage";
import { nanoid } from "nanoid";
import { useHawaeStore } from "@/stores/hawae-store";
import type {
  CertificateDraft,
  CertificateType,
  DocumentItem,
  IvfProfile,
  ModulesWorkspace,
  PartogramSession,
  WaitingEntry,
  WaitingStatus,
} from "@/types/modules";
import { EMPTY_MODULES } from "@/types/modules";

type ByUser<T> = Record<string, T>;

function uid(): string {
  return useHawaeStore.getState().currentUserId ?? "user_default";
}

export interface ModulesState {
  workspaceByUser: ByUser<ModulesWorkspace>;

  setTeachMode: (on: boolean) => void;

  addWaiting: (entry: Omit<WaitingEntry, "id">) => string;
  updateWaitingStatus: (id: string, status: WaitingStatus) => void;
  removeWaiting: (id: string) => void;

  savePartogram: (session: PartogramSession) => void;
  deletePartogram: (id: string) => void;

  saveCertificate: (cert: CertificateDraft) => void;
  deleteCertificate: (id: string) => void;

  addDocument: (doc: Omit<DocumentItem, "id" | "createdAt">) => string;
  deleteDocument: (id: string) => void;

  saveIvfProfile: (profile: IvfProfile) => void;
  deleteIvfProfile: (id: string) => void;

  markBackup: () => void;
  importWorkspace: (data: ModulesWorkspace) => void;
}

function patchUser(
  state: ModulesState,
  userId: string,
  fn: (w: ModulesWorkspace) => ModulesWorkspace,
): Partial<ModulesState> {
  const cur = state.workspaceByUser[userId] ?? EMPTY_MODULES;
  return {
    workspaceByUser: {
      ...state.workspaceByUser,
      [userId]: fn({ ...cur }),
    },
  };
}

export const useModulesStore = create<ModulesState>()(
  persist(
    (set) => ({
      workspaceByUser: {},

      setTeachMode: (on) =>
        set((s) => patchUser(s, uid(), (w) => ({ ...w, teachMode: on }))),

      addWaiting: (entry) => {
        const id = "wr_" + nanoid(10);
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            waitingQueue: [...w.waitingQueue, { ...entry, id }],
          })),
        );
        return id;
      },

      updateWaitingStatus: (id, status) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            waitingQueue: w.waitingQueue.map((e) =>
              e.id === id ? { ...e, status } : e,
            ),
          })),
        ),

      removeWaiting: (id) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            waitingQueue: w.waitingQueue.filter((e) => e.id !== id),
          })),
        ),

      savePartogram: (session) =>
        set((s) =>
          patchUser(s, uid(), (w) => {
            const rest = w.partograms.filter((p) => p.id !== session.id);
            return { ...w, partograms: [session, ...rest] };
          }),
        ),

      deletePartogram: (id) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            partograms: w.partograms.filter((p) => p.id !== id),
          })),
        ),

      saveCertificate: (cert) =>
        set((s) =>
          patchUser(s, uid(), (w) => {
            const rest = w.certificates.filter((c) => c.id !== cert.id);
            return { ...w, certificates: [cert, ...rest] };
          }),
        ),

      deleteCertificate: (id) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            certificates: w.certificates.filter((c) => c.id !== id),
          })),
        ),

      addDocument: (doc) => {
        const id = "doc_" + nanoid(10);
        const item: DocumentItem = {
          ...doc,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            documents: [item, ...w.documents],
          })),
        );
        return id;
      },

      deleteDocument: (id) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            documents: w.documents.filter((d) => d.id !== id),
          })),
        ),

      saveIvfProfile: (profile) =>
        set((s) =>
          patchUser(s, uid(), (w) => {
            const rest = w.ivfProfiles.filter((p) => p.id !== profile.id);
            return { ...w, ivfProfiles: [profile, ...rest] };
          }),
        ),

      deleteIvfProfile: (id) =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            ivfProfiles: w.ivfProfiles.filter((p) => p.id !== id),
          })),
        ),

      markBackup: () =>
        set((s) =>
          patchUser(s, uid(), (w) => ({
            ...w,
            lastBackupAt: new Date().toISOString(),
          })),
        ),

      importWorkspace: (data) =>
        set((s) =>
          patchUser(s, uid(), () => ({
            ...EMPTY_MODULES,
            ...data,
          })),
        ),
    }),
    {
      name: "hawae-modules-v1",
      storage: createJSONStorage(() => createDoctorScopedStorage()),
      partialize: (s) => ({ workspaceByUser: s.workspaceByUser }),
    },
  ),
);

export function useModulesWorkspace(): ModulesWorkspace {
  const userId = useHawaeStore((s) => s.currentUserId) ?? "user_default";
  const ws = useModulesStore((s) => s.workspaceByUser[userId]);
  return ws ?? EMPTY_MODULES;
}

export function certTypeLabel(t: CertificateType): string {
  const map: Record<CertificateType, string> = {
    arret_travail: "Arrêt de travail",
    aptitude_sport: "Aptitude sportive",
    certificat_medical: "Certificat médical",
    accouchement_prevu: "Accouchement prévu",
  };
  return map[t];
}
