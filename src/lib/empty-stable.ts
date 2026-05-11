import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";

/** Références stables pour sélecteurs Zustand (évite boucles useSyncExternalStore). */
export const EMPTY_PATIENTS_MAP: Record<string, PatientSnapshot> =
  Object.freeze({}) as Record<string, PatientSnapshot>;

export const EMPTY_HISTORY_MAP: Record<string, ConsultationEntry[]> =
  Object.freeze({}) as Record<string, ConsultationEntry[]>;

export const EMPTY_CONSULT_LIST = Object.freeze(
  [],
) as unknown as ConsultationEntry[];
