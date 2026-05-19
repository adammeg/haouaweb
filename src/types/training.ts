import type {
  ConsultationEntry,
  PatientSnapshot,
  Specialty,
} from "@/types/domain";

/** Version du texte de consentement affiché au médecin. */
export const AI_TRAINING_CONSENT_VERSION = "2026-05-v2-full";
import type { IvfAnalysis, IvfPatientProfile } from "@/lib/pma/ivf-types";
import type {
  CertificateDraft,
  DocumentItem,
  IvfProfile,
  PartogramSession,
  WaitingEntry,
} from "@/types/modules";

export interface DoctorAiTrainingSettings {
  enabled: boolean;
  consentedAt: string | null;
  consentVersion: string | null;
}

export type AgeBand =
  | "<18"
  | "18-24"
  | "25-29"
  | "30-34"
  | "35-39"
  | "40-44"
  | "45-49"
  | "50+"
  | "unknown";

/** Dossier dé-identifié — jamais de nom, téléphone, CIN, date de naissance exacte. */
export interface AnonymizedClinicalRecord {
  patientRef: string;
  workspaceUserId: string;
  specialty: Specialty | "";
  ageBand: AgeBand;
  ageYears: number | null;
  clinical: Record<string, string | number | boolean | null>;
  /** Texte clinique libre (motif, symptômes, ATCD) — sans identifiants directs. */
  clinicalText: {
    motif?: string;
    symptomes?: string;
    atcdMed?: string;
    traitements?: string;
  };
  historyConsultationCount: number;
}

export interface ClinicalTrainingSample {
  id: string;
  doctorId: string;
  patientRef: string;
  workspaceUserId: string;
  specialty: Specialty | "";
  ageBand: AgeBand;
  ageYears: number | null;
  contentHash: string;
  clinical: Record<string, string | number | boolean | null>;
  clinicalText: AnonymizedClinicalRecord["clinicalText"];
  historyConsultationCount: number;
  consentVersion: string;
  sourceUpdatedAt: string;
  ingestedAt: string;
}

export interface TrainingIngestStats {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  skippedNoConsent: boolean;
}

export interface TrainingDatasetStats {
  totalSamples: number;
  totalDoctors: number;
  bySpecialty: Record<string, number>;
  lastIngestedAt: string | null;
}

/** Dossier patient complet pour entraînement IA (données intégrales, avec identifiants). */
export interface FullPatientTrainingRecord {
  id: string;
  doctorId: string;
  patientId: string;
  workspaceUserId: string;
  contentHash: string;
  consentVersion: string;
  sourceUpdatedAt: string;
  ingestedAt: string;
  patient: PatientSnapshot;
  consultationHistory: ConsultationEntry[];
  ivf: {
    profile: IvfPatientProfile | null;
    analysis: IvfAnalysis | null;
    cycles: IvfProfile[];
  } | null;
  modulesForPatient: {
    certificates: CertificateDraft[];
    partograms: PartogramSession[];
    documents: DocumentItem[];
    waitingQueue: WaitingEntry[];
    ivfProfiles: IvfProfile[];
  };
}
