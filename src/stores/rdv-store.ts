"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createDoctorScopedStorage } from "@/lib/storage/doctor-scoped-storage";

/**
 * Port fidèle du module Agenda v48 :
 *   - RDV_KEY = 'gynecoSmart_rdv_v1' (persistance localStorage)
 *   - getRdvList / saveRdvList / rdvGenId / saveRdv (add+update) / deleteRdv
 *   - _agendaWeekOffset / agendaNav / agendaGetWeekDates / agendaRender
 * Ici, la persistance est isolée par médecin connecté via
 * `createDoctorScopedStorage` (deux comptes sur le même navigateur
 * n'ont jamais les mêmes RDV).
 */

export type RdvType =
  | "consultation"
  | "grossesse"
  | "echo"
  | "chirurgie"
  | "bilan"
  | "urgence";

/**
 * Statuts RDV — port fidèle v48.
 * Le module Rappels y ajoute `non_joint` et `a_rappeler` qui sont stockés
 * dans le même champ `statut` (cf. fonction v48 `rappelsSetStatut`).
 */
export type RdvStatut =
  | "confirme"
  | "attente"
  | "annule"
  | "non_joint"
  | "a_rappeler";

export interface Rdv {
  id: string;
  patient: string;
  tel: string;
  date: string;
  heure: string;
  duree: number;
  type: RdvType;
  statut: RdvStatut;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  /** Dernier contact tenté pour ce RDV (port v48 : `rdv.rappelAt`). */
  rappelAt?: string;
  /** Note libre laissée lors du dernier contact (port v48 : `rdv.rappelNote`). */
  rappelNote?: string;
}

export const RDV_COLORS: Record<RdvType, string> = {
  consultation: "#3b82f6",
  grossesse: "#10b981",
  echo: "#f59e0b",
  chirurgie: "#ec4899",
  bilan: "#8b5cf6",
  urgence: "#ef4444",
};

export const RDV_LABELS: Record<RdvType, string> = {
  consultation: "Consultation",
  grossesse: "Suivi grossesse",
  echo: "Échographie",
  chirurgie: "Chirurgie",
  bilan: "Bilan",
  urgence: "Urgence",
};

export const RDV_TYPE_ICONS: Record<RdvType, string> = {
  consultation: "🩺",
  grossesse: "🤰",
  echo: "🔊",
  chirurgie: "⚕️",
  bilan: "🧪",
  urgence: "🚨",
};

export const RDV_STATUTS: Record<RdvStatut, string> = {
  confirme: "Confirmé",
  attente: "En attente",
  annule: "Annulé",
  non_joint: "Non joint",
  a_rappeler: "À rappeler",
};

export const RDV_STATUT_COLORS: Record<RdvStatut, string> = {
  confirme: "#10b981",
  attente: "#3b82f6",
  annule: "#ef4444",
  non_joint: "#6b7280",
  a_rappeler: "#f59e0b",
};

export type RdvDraft = {
  id?: string;
  patient: string;
  tel: string;
  date: string;
  heure: string;
  duree: number;
  type: RdvType;
  statut: RdvStatut;
  notes: string;
};

export interface RdvState {
  list: Rdv[];
  weekOffset: number;

  saveRdv: (draft: RdvDraft) => string;
  deleteRdv: (id: string) => void;
  updateRdv: (id: string, patch: Partial<Rdv>) => void;

  setWeekOffset: (n: number) => void;
  navWeek: (dir: 1 | -1 | 0) => void;

  reset: () => void;
}

function rdvGenId(): string {
  return `rdv_${Date.now()}_${nanoid(6)}`;
}

function clampDuree(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 30;
  return Math.min(480, Math.max(5, Math.round(v)));
}

function isRdvType(t: unknown): t is RdvType {
  return (
    t === "consultation" ||
    t === "grossesse" ||
    t === "echo" ||
    t === "chirurgie" ||
    t === "bilan" ||
    t === "urgence"
  );
}

function isRdvStatut(s: unknown): s is RdvStatut {
  return (
    s === "confirme" ||
    s === "attente" ||
    s === "annule" ||
    s === "non_joint" ||
    s === "a_rappeler"
  );
}

/** Sécurise les entrées rechargées depuis localStorage (anciennes versions / données corrompues). */
export function normalizeRdv(raw: unknown): Rdv {
  const o = raw as Partial<Rdv>;
  const id =
    typeof o.id === "string" && o.id.length > 0 ? o.id : rdvGenId();
  return {
    id,
    patient: typeof o.patient === "string" ? o.patient : "",
    tel: typeof o.tel === "string" ? o.tel : "",
    date: typeof o.date === "string" ? o.date : "",
    heure: typeof o.heure === "string" ? o.heure : "09:00",
    duree: clampDuree(o.duree),
    type: isRdvType(o.type) ? o.type : "consultation",
    statut: isRdvStatut(o.statut) ? o.statut : "confirme",
    notes: typeof o.notes === "string" ? o.notes : "",
    createdAt:
      typeof o.createdAt === "string" && o.createdAt.length > 0
        ? o.createdAt
        : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    rappelAt: typeof o.rappelAt === "string" ? o.rappelAt : undefined,
    rappelNote: typeof o.rappelNote === "string" ? o.rappelNote : undefined,
  };
}

export const useRdvStore = create<RdvState>()(
  persist(
    (set) => ({
      list: [],
      weekOffset: 0,

      saveRdv: (draft) => {
        const now = new Date().toISOString();
        let savedId = draft.id ?? "";
        const duree = clampDuree(draft.duree);
        set((s) => {
          const list = [...s.list];
          if (draft.id) {
            const idx = list.findIndex((r) => r.id === draft.id);
            if (idx >= 0) {
              list[idx] = {
                ...list[idx]!,
                patient: draft.patient,
                tel: draft.tel,
                date: draft.date,
                heure: draft.heure,
                duree,
                type: isRdvType(draft.type) ? draft.type : "consultation",
                statut: isRdvStatut(draft.statut) ? draft.statut : "confirme",
                notes: draft.notes,
                updatedAt: now,
              };
              savedId = draft.id;
            } else {
              /* Id d’édition absent (liste réinitialisée, autre onglet, etc.) : créer un nouveau RDV. */
              const id = rdvGenId();
              savedId = id;
              list.push({
                id,
                patient: draft.patient,
                tel: draft.tel,
                date: draft.date,
                heure: draft.heure,
                duree,
                type: isRdvType(draft.type) ? draft.type : "consultation",
                statut: isRdvStatut(draft.statut) ? draft.statut : "confirme",
                notes: draft.notes,
                createdAt: now,
              });
            }
          } else {
            const id = rdvGenId();
            savedId = id;
            list.push({
              id,
              patient: draft.patient,
              tel: draft.tel,
              date: draft.date,
              heure: draft.heure,
              duree,
              type: isRdvType(draft.type) ? draft.type : "consultation",
              statut: isRdvStatut(draft.statut) ? draft.statut : "confirme",
              notes: draft.notes,
              createdAt: now,
            });
          }
          return { list };
        });
        return savedId;
      },

      deleteRdv: (id) => {
        set((s) => ({ list: s.list.filter((r) => r.id !== id) }));
      },

      updateRdv: (id, patch) => {
        set((s) => ({
          list: s.list.map((r) =>
            r.id === id
              ? { ...r, ...patch, updatedAt: new Date().toISOString() }
              : r,
          ),
        }));
      },

      setWeekOffset: (n) => set({ weekOffset: n }),

      navWeek: (dir) => {
        if (dir === 0) set({ weekOffset: 0 });
        else set((s) => ({ weekOffset: s.weekOffset + dir }));
      },

      reset: () => set({ list: [], weekOffset: 0 }),
    }),
    {
      name: "hawae-rdv-v1",
      storage: createJSONStorage(() => createDoctorScopedStorage()),
      partialize: (s) => ({ list: s.list }),
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<RdvState> | undefined;
        const rawList = Array.isArray(p?.list) ? p.list : current.list;
        return {
          ...current,
          ...(p && typeof p === "object" ? p : {}),
          list: rawList.map(normalizeRdv),
        };
      },
    },
  ),
);

// ── Helpers dates (port fidèle agendaGetWeekDates + DAYS_FR/MONTHS_FR) ──

export const AGENDA_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;
export const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
export const MONTHS_FR = [
  "jan",
  "fév",
  "mar",
  "avr",
  "mai",
  "jun",
  "jul",
  "aoû",
  "sep",
  "oct",
  "nov",
  "déc",
] as const;

export function agendaGetWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay() || 7; // 0 dimanche → 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rdvFmtDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
