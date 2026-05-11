"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createDoctorScopedStorage } from "@/lib/storage/doctor-scoped-storage";

/**
 * Port fidèle du module Rappels v48 :
 *   - RAPPELS_KEY         = 'gynecoSmart_rappels_v1'           → rappels manuels
 *   - RAPPELS_CONTACT_KEY = 'gynecoSmart_rappels_contacts_v1'  → journal des contacts
 *   - Fonctions : addRappel, doneRappel, deleteRappel,
 *                 rappelsSaveContact, rappelsSetStatut (côté RDV store),
 *                 catIcon, computeAutoNotifs
 *
 * Persistance isolée par médecin connecté via `createDoctorScopedStorage`.
 */

export type RappelUrgence = "low" | "medium" | "high";
export type RappelCat = "rdv" | "bilan" | "terme" | "traitement" | "autre";

export interface Rappel {
  id: string;
  desc: string;
  date: string;
  urgence: RappelUrgence;
  cat: RappelCat;
  patient: string;
  done: boolean;
  createdAt: string;
}

export type RappelContactAction =
  | "confirme"
  | "non_joint"
  | "annule"
  | "a_rappeler";

export interface RappelContact {
  rdvId: string;
  action: RappelContactAction;
  note: string;
  time: string;
}

export interface RappelsState {
  list: Rappel[];
  contacts: RappelContact[];
  readNotifs: string[];

  addRappel: (input: {
    desc: string;
    date: string;
    urgence: RappelUrgence;
    cat: RappelCat;
    patient: string;
  }) => string;
  doneRappel: (id: string) => void;
  deleteRappel: (id: string) => void;

  pushContact: (rdvId: string, action: RappelContactAction, note?: string) => void;
  markNotifRead: (id: string) => void;
  markManyNotifsRead: (ids: string[]) => void;
}

function rappelGenId(): string {
  return `rap_${Date.now()}_${nanoid(6)}`;
}

function isCat(v: unknown): v is RappelCat {
  return (
    v === "rdv" ||
    v === "bilan" ||
    v === "terme" ||
    v === "traitement" ||
    v === "autre"
  );
}

function isUrgence(v: unknown): v is RappelUrgence {
  return v === "low" || v === "medium" || v === "high";
}

function isContactAction(v: unknown): v is RappelContactAction {
  return (
    v === "confirme" ||
    v === "non_joint" ||
    v === "annule" ||
    v === "a_rappeler"
  );
}

function normalizeRappel(raw: unknown): Rappel {
  const o = raw as Partial<Rappel>;
  return {
    id: typeof o.id === "string" && o.id.length > 0 ? o.id : rappelGenId(),
    desc: typeof o.desc === "string" ? o.desc : "",
    date: typeof o.date === "string" ? o.date : "",
    urgence: isUrgence(o.urgence) ? o.urgence : "medium",
    cat: isCat(o.cat) ? o.cat : "autre",
    patient: typeof o.patient === "string" ? o.patient : "",
    done: o.done === true,
    createdAt:
      typeof o.createdAt === "string" && o.createdAt.length > 0
        ? o.createdAt
        : new Date().toISOString(),
  };
}

function normalizeContact(raw: unknown): RappelContact | null {
  const o = raw as Partial<RappelContact>;
  if (!o || typeof o.rdvId !== "string" || !o.rdvId) return null;
  if (!isContactAction(o.action)) return null;
  return {
    rdvId: o.rdvId,
    action: o.action,
    note: typeof o.note === "string" ? o.note : "",
    time:
      typeof o.time === "string" && o.time.length > 0
        ? o.time
        : new Date().toISOString(),
  };
}

export const useRappelsStore = create<RappelsState>()(
  persist(
    (set) => ({
      list: [],
      contacts: [],
      readNotifs: [],

      addRappel: ({ desc, date, urgence, cat, patient }) => {
        const id = rappelGenId();
        const entry: Rappel = {
          id,
          desc: desc.trim(),
          date: date || "",
          urgence: isUrgence(urgence) ? urgence : "medium",
          cat: isCat(cat) ? cat : "autre",
          patient: patient.trim(),
          done: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ list: [...s.list, entry] }));
        return id;
      },

      doneRappel: (id) => {
        set((s) => ({
          list: s.list.map((r) => (r.id === id ? { ...r, done: true } : r)),
        }));
      },

      deleteRappel: (id) => {
        set((s) => ({ list: s.list.filter((r) => r.id !== id) }));
      },

      pushContact: (rdvId, action, note = "") => {
        if (!isContactAction(action)) return;
        const entry: RappelContact = {
          rdvId,
          action,
          note,
          time: new Date().toISOString(),
        };
        set((s) => ({
          /* v48 garde 200 entrées max (unshift + splice 200). */
          contacts: [entry, ...s.contacts].slice(0, 200),
        }));
      },

      markNotifRead: (id) => {
        set((s) =>
          s.readNotifs.includes(id)
            ? s
            : { readNotifs: [...s.readNotifs, id] },
        );
      },

      markManyNotifsRead: (ids) => {
        if (!ids.length) return;
        set((s) => {
          const next = new Set(s.readNotifs);
          ids.forEach((i) => next.add(i));
          return { readNotifs: Array.from(next) };
        });
      },
    }),
    {
      name: "hawae-rappels-v1",
      storage: createJSONStorage(() => createDoctorScopedStorage()),
      partialize: (s) => ({
        list: s.list,
        contacts: s.contacts,
        readNotifs: s.readNotifs,
      }),
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<RappelsState> | undefined;
        const rawList = Array.isArray(p?.list) ? p.list : [];
        const rawContacts = Array.isArray(p?.contacts) ? p.contacts : [];
        const rawRead = Array.isArray(p?.readNotifs) ? p.readNotifs : [];
        return {
          ...current,
          ...(p && typeof p === "object" ? p : {}),
          list: rawList.map(normalizeRappel),
          contacts: rawContacts
            .map(normalizeContact)
            .filter((c): c is RappelContact => c !== null),
          readNotifs: rawRead.filter((x): x is string => typeof x === "string"),
        };
      },
    },
  ),
);

// ── Helpers d'affichage (port fidèle v48 catIcon + libellés) ──────────────

export const RAPPEL_CAT_ICON: Record<RappelCat, string> = {
  rdv: "📅",
  bilan: "🔬",
  terme: "🤰",
  traitement: "💊",
  autre: "📌",
};

export const RAPPEL_CAT_LABEL: Record<RappelCat, string> = {
  rdv: "Rendez-vous",
  bilan: "Bilan",
  terme: "Terme",
  traitement: "Traitement",
  autre: "Autre",
};

export const RAPPEL_URGENCE_LABEL: Record<RappelUrgence, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
};

export function catIcon(cat: RappelCat): string {
  return RAPPEL_CAT_ICON[cat] ?? RAPPEL_CAT_ICON.autre;
}

// ── Helpers dates (port v48 rappelsToday / rappelsTomorrow / …) ───────────

export function rappelsToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function rappelsTomorrow(): Date {
  const d = rappelsToday();
  d.setDate(d.getDate() + 1);
  return d;
}

export function rappelsIsSameDay(dateStr: string, ref: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(0, 0, 0, 0);
  return d.getTime() === ref.getTime();
}

export function rappelsFmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
