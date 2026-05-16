/** État des modules hors dossier patient (partogramme, file, PMA…). */

export type WaitingStatus =
  | "waiting"
  | "in_consult"
  | "done"
  | "cancelled";

export interface WaitingEntry {
  id: string;
  patientId: string;
  date: string;
  arrivalTime: string;
  status: WaitingStatus;
  motif?: string;
  notes?: string;
}

export interface PartogramPoint {
  recordedAt: string;
  hoursFromAdmission: number;
  dilatationCm?: number;
  descent?: number;
  fcf?: number;
  la?: string;
  cx?: number;
  taSys?: number;
  taDia?: number;
  pulse?: number;
  temp?: number;
  diuresis?: number;
  oxytocine?: number;
  analg?: string;
}

export interface PartogramSession {
  id: string;
  patientId?: string;
  patientName: string;
  admissionAt: string;
  ddr?: string;
  termeSa?: string;
  points: PartogramPoint[];
  events: { at: string; label: string }[];
  updatedAt: string;
}

export type CertificateType =
  | "arret_travail"
  | "aptitude_sport"
  | "certificat_medical"
  | "accouchement_prevu";

export interface CertificateDraft {
  id: string;
  type: CertificateType;
  patientName: string;
  patientId?: string;
  body: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  patientId?: string;
  name: string;
  category: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface IvfCycleDay {
  day: number;
  label: string;
  meds?: string;
  e2?: string;
  follicles?: string;
  notes?: string;
}

export interface IvfProfile {
  id: string;
  patientId?: string;
  patientName: string;
  protocol: string;
  startDate: string;
  poseidonGroup?: string;
  days: IvfCycleDay[];
  updatedAt: string;
}

export interface ModulesWorkspace {
  waitingQueue: WaitingEntry[];
  partograms: PartogramSession[];
  certificates: CertificateDraft[];
  documents: DocumentItem[];
  ivfProfiles: IvfProfile[];
  teachMode: boolean;
  lastBackupAt: string | null;
}

export const EMPTY_MODULES: ModulesWorkspace = {
  waitingQueue: [],
  partograms: [],
  certificates: [],
  documents: [],
  ivfProfiles: [],
  teachMode: false,
  lastBackupAt: null,
};
