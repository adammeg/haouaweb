/**
 * Types partagés pour le moteur de scores cliniques.
 * Toutes les fonctions de `src/lib/scores/*` sont pures, sans accès au DOM,
 * et retournent un objet `ScoreResult` consommé par les composants React.
 *
 * Port fidèle des fonctions `calc*` et `score*` du fichier hawaemd_v50.html
 * (sections ~13199–13369 et ~22240–24500).
 */

export type ScoreLevel = "ok" | "low" | "medium" | "high" | "critical";

export interface ScoreResult {
  /** Valeur principale (ex: "7", "10/10", "85 %"). */
  value: string;
  /** Score numérique brut (pour barres de progression / persistance). */
  raw: number;
  /** Valeur maximale théorique (pour barre %). 0 si n/a. */
  max: number;
  /** Niveau clinique pour code couleur. */
  level: ScoreLevel;
  /** Étiquette courte (ex: "Risque élevé"). */
  label: string;
  /** Interprétation détaillée — peut contenir <strong> et <br>. */
  interpretation: string;
  /** Métriques secondaires (pour Greene, Apgar, etc.). */
  details?: { label: string; value: string }[];
}

export interface ScoreEntry {
  nom: string;
  valeur: string;
  niveau: ScoreLevel;
  date: string;
}

export const SCORE_LEVEL_COLORS: Record<ScoreLevel, string> = {
  ok: "#16a34a",
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
  critical: "#7f1d1d",
};

export const SCORE_LEVEL_BG: Record<ScoreLevel, string> = {
  ok: "rgba(22,163,74,0.10)",
  low: "rgba(22,163,74,0.10)",
  medium: "rgba(217,119,6,0.10)",
  high: "rgba(220,38,38,0.10)",
  critical: "rgba(127,29,29,0.12)",
};
