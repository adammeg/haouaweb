/**
 * Constantes et métadonnées — courbes de croissance fœtale HawaeMD
 */

import type { GrowthParamKey } from "./types";

export const GA_MIN = 14;
export const GA_MAX = 42;
export const GA_STEP_LABEL = 2;

/** Charte graphique HawaeMD */
export const COLORS = {
  teal: "#007070",
  tealDeep: "#0a5c5c",
  tealLight: "#4a9090",
  gold: "#c9a84c",
  blush: "#f4d6da",
  blushDeep: "#e8b4bc",
  bg: "#fafaf8",
  normal: "#007070",
  surveillance: "#c9a84c",
  pathologique: "#c0392b",
  zoneNormal: "#00707015",
  zoneAttention: "#c9a84c18",
} as const;

export type ParamMeta = {
  key: GrowthParamKey;
  label: string;
  unit: string;
  shortLabel: string;
  gaMin: number;
  gaMax: number;
  source: string;
};

export const PARAM_META: Record<GrowthParamKey, ParamMeta> = {
  bip: {
    key: "bip",
    label: "BIP — Diamètre bipariétal",
    shortLabel: "BIP",
    unit: "mm",
    gaMin: 14,
    gaMax: 40,
    source: "INTERGROWTH-21st 2016",
  },
  pc: {
    key: "pc",
    label: "PC — Périmètre crânien",
    shortLabel: "PC",
    unit: "mm",
    gaMin: 14,
    gaMax: 40,
    source: "INTERGROWTH-21st 2016",
  },
  pa: {
    key: "pa",
    label: "PA — Périmètre abdominal",
    shortLabel: "PA",
    unit: "mm",
    gaMin: 14,
    gaMax: 40,
    source: "INTERGROWTH-21st 2016",
  },
  lf: {
    key: "lf",
    label: "LF — Longueur fémorale",
    shortLabel: "LF",
    unit: "mm",
    gaMin: 14,
    gaMax: 40,
    source: "INTERGROWTH-21st 2016",
  },
  pfe: {
    key: "pfe",
    label: "PFE — Poids fœtal estimé",
    shortLabel: "PFE",
    unit: "g",
    gaMin: 14,
    gaMax: 40,
    source: "INTERGROWTH-21st / Hadlock 1985",
  },
  ila: {
    key: "ila",
    label: "ILA — Index de liquide amniotique",
    shortLabel: "ILA",
    unit: "cm",
    gaMin: 16,
    gaMax: 42,
    source: "Moore 1990",
  },
};

export const ALL_PARAMS: GrowthParamKey[] = [
  "bip",
  "pc",
  "pa",
  "lf",
  "pfe",
  "ila",
];

/** Génère un numéro de dossier OBS-YYYY-XXXX */
export function genObsDossierId(): string {
  const y = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `OBS-${y}-${n}`;
}

/** Convertit SA + jours en semaines décimales */
export function gaFromWeeksDays(weeks: number, days: number): number {
  return weeks + days / 7;
}

/** Formate l'âge gestationnel */
export function formatGa(gaWeeks: number): string {
  const w = Math.floor(gaWeeks);
  const d = Math.round((gaWeeks - w) * 7);
  return d > 0 ? `${w}+${d} SA` : `${w} SA`;
}
