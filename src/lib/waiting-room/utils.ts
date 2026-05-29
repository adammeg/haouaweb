import type { PatientSnapshot, Specialty } from "@/types/domain";
import type { WaitingStatus } from "@/types/modules";

export const WR_MOTIFS = [
  "Consultation",
  "Suivi de grossesse",
  "Échographie",
  "Urgence",
  "Post-opératoire",
  "Bilan",
] as const;

export const NEW_PATIENT_MOTIFS = [
  "Suivi de grossesse",
  "Douleur pelvienne",
  "Métrorragies",
  "Infertilité",
  "Contraception",
  "Bilan gynécologique",
] as const;

export function specialtyFromMotif(motif: string): Specialty {
  const m = motif.toLowerCase();
  if (
    m.includes("grossesse") ||
    m.includes("obstét") ||
    m.includes("obst")
  ) {
    return "obst";
  }
  if (m.includes("infertil") || m.includes("fiv") || m.includes("amp")) {
    return "inf";
  }
  return "gyn";
}

export function findPatientByIdentity(
  patients: Record<string, PatientSnapshot>,
  nom: string,
  prenom: string,
): PatientSnapshot | undefined {
  const n = nom.trim().toLowerCase();
  const pr = prenom.trim().toLowerCase();
  if (!n || !pr) return undefined;
  return Object.values(patients).find(
    (p) =>
      (p.nom ?? "").trim().toLowerCase() === n &&
      (p.prenom ?? "").trim().toLowerCase() === pr,
  );
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentTimeHm(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function minutesWaitingLabel(arrivalIso: string): string {
  const m = Math.floor((Date.now() - new Date(arrivalIso).getTime()) / 60000);
  if (m < 1) return "<1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h${String(r).padStart(2, "0")}`;
}

export function arrivalIso(date: string, arrivalTime: string): string {
  return new Date(`${date}T${arrivalTime}:00`).toISOString();
}

export const STATUS_SORT: Record<WaitingStatus, number> = {
  in_consult: 0,
  waiting: 1,
  done: 2,
  cancelled: 3,
};

export function formatWrDateFr(d = new Date()): {
  title: string;
  sub: string;
} {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return {
    title: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
    sub: `${d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} — Votre Établissement`,
  };
}
