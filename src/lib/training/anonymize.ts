import { createHash } from "crypto";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";
import type { AgeBand, AnonymizedClinicalRecord } from "@/types/training";
import { PII_PATIENT_FIELDS } from "@/lib/training/pii-fields";

const NUMERIC_STRING = /^-?\d+([.,]\d+)?$/;

function ageToBand(age: number | null): AgeBand {
  if (age == null || !Number.isFinite(age)) return "unknown";
  if (age < 18) return "<18";
  if (age < 25) return "18-24";
  if (age < 30) return "25-29";
  if (age < 35) return "30-34";
  if (age < 40) return "35-39";
  if (age < 45) return "40-44";
  if (age < 50) return "45-49";
  return "50+";
}

function patientRef(doctorId: string, patientId: string): string {
  return createHash("sha256")
    .update(doctorId + ":" + patientId)
    .digest("hex")
    .slice(0, 32);
}

function parseNumeric(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Extrait champs structurés utiles au ML (sans PII). */
function extractClinicalFields(
  d: PatientSnapshot,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {
    specialite: d.specialite || null,
  };

  for (const [key, raw] of Object.entries(d)) {
    if (PII_PATIENT_FIELDS.has(key)) continue;
    if (key === "id" || key === "specialite") continue;
    if (key === "hawaeIaHistory" || key === "hawaeAssistResultJson") continue;
    if (key.startsWith("ordonnance")) continue;
    if (raw == null || raw === "") continue;
    if (typeof raw === "string") {
      if (NUMERIC_STRING.test(raw.trim())) {
        out[key] = parseNumeric(raw);
      } else if (raw === "oui" || raw === "non") {
        out[key] = raw === "oui";
      } else if (raw.length <= 120) {
        out[key] = raw;
      }
    }
  }

  const age = patientAgeYears(d.ddn);
  out.ageYears = age;
  out.ageBand = ageToBand(age);

  return out;
}

export function anonymizePatient(
  doctorId: string,
  workspaceUserId: string,
  patient: PatientSnapshot,
  historyCount: number,
): AnonymizedClinicalRecord {
  const age = patientAgeYears(patient.ddn);
  return {
    patientRef: patientRef(doctorId, patient.id),
    workspaceUserId,
    specialty: patient.specialite || "",
    ageBand: ageToBand(age),
    ageYears: age,
    clinical: extractClinicalFields(patient),
    clinicalText: {
      motif: patient.motif?.trim() || undefined,
      symptomes: patient.symptomes?.trim() || undefined,
      atcdMed: patient.atcdMed?.trim() || undefined,
      traitements: patient.traitements?.trim() || undefined,
    },
    historyConsultationCount: historyCount,
  };
}

export function contentHash(record: AnonymizedClinicalRecord): string {
  const payload = JSON.stringify({
    patientRef: record.patientRef,
    specialty: record.specialty,
    clinical: record.clinical,
    clinicalText: record.clinicalText,
    historyConsultationCount: record.historyConsultationCount,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function anonymizeConsultation(
  entry: ConsultationEntry,
): Pick<ConsultationEntry, "date" | "specialite" | "motif" | "symptomes" | "terme"> {
  return {
    date: entry.date,
    specialite: entry.specialite,
    motif: entry.motif,
    symptomes: entry.symptomes,
    terme: entry.terme,
  };
}
