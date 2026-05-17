import type { IvfAnalysis, IvfPatientProfile } from "./ivf-types";

const PROFILE_KEY = "hawae_ivf_profile_v1";
const ANALYSIS_KEY = "hawae_ivf_analysis_v1";

function profileKey(patientId: string) {
  return PROFILE_KEY + "_" + patientId;
}

function analysisKey(patientId: string) {
  return ANALYSIS_KEY + "_" + patientId;
}

export function saveIvfProfile(
  patientId: string,
  profile: IvfPatientProfile,
): void {
  try {
    localStorage.setItem(profileKey(patientId), JSON.stringify(profile));
  } catch {
    /* ignore quota */
  }
}

export function loadIvfProfile(
  patientId: string,
): IvfPatientProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(patientId));
    return raw ? (JSON.parse(raw) as IvfPatientProfile) : null;
  } catch {
    return null;
  }
}

export function saveIvfAnalysis(
  patientId: string,
  analysis: IvfAnalysis,
): void {
  try {
    localStorage.setItem(analysisKey(patientId), JSON.stringify(analysis));
  } catch {
    /* ignore */
  }
}

export function loadIvfAnalysis(patientId: string): IvfAnalysis | null {
  try {
    const raw = localStorage.getItem(analysisKey(patientId));
    return raw ? (JSON.parse(raw) as IvfAnalysis) : null;
  } catch {
    return null;
  }
}

export function clearIvfPatientData(patientId: string): void {
  try {
    localStorage.removeItem(profileKey(patientId));
    localStorage.removeItem(analysisKey(patientId));
  } catch {
    /* ignore */
  }
}
