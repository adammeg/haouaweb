import type { PatientSnapshot } from "@/types/domain";
import { SPECIALTY_LABELS, type Specialty } from "@/types/domain";
import { getPatientDisplayName, patientAgeYears } from "@/lib/patient-utils";

export function dossierDisplayName(p: PatientSnapshot): string {
  const n = getPatientDisplayName(p);
  return n === "Patiente" && !p.nom && !p.prenom ? "Patiente" : n;
}

export function buildPatientSubtitle(p: PatientSnapshot): string {
  const age = patientAgeYears(p.ddn);
  const parts: string[] = [];
  if (age != null) parts.push(`${age} ans`);
  const spec = p.specialite as Specialty | undefined;
  if (spec === "obst") {
    parts.push(`G${p.o_gest ?? "0"}P${p.o_par ?? "0"}`);
    if (p.o_abort) parts.push(`A${p.o_abort}`);
    parts.push("Suivi de grossesse");
  } else if (spec === "gyn") {
    parts.push(SPECIALTY_LABELS.gyn);
  } else if (spec === "inf") {
    parts.push(SPECIALTY_LABELS.inf);
  } else {
    parts.push("Consultation");
  }
  parts.push("دوسيه المريضة");
  return parts.join(" · ");
}

export function patientInitials(p: PatientSnapshot): string {
  const a = (p.prenom?.[0] ?? p.nom?.[0] ?? "P").toUpperCase();
  const b = (p.nom?.[1] ?? p.prenom?.[1] ?? "").toUpperCase();
  return a + b;
}

export const SPEC_AVATAR_COLORS: Record<string, string> = {
  gyn: "#0d6e6e",
  obst: "#1a5c8c",
  inf: "#8b6914",
};
