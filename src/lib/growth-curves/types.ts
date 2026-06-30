/** Types partagés — courbes de croissance fœtale HawaeMD */

/** Percentiles INTERGROWTH-21st (3e, 10e, 50e, 90e, 97e) */
export type IgPercentiles = {
  p3: number;
  p10: number;
  p50: number;
  p90: number;
  p97: number;
};

export type GrowthParamKey = "bip" | "pc" | "pa" | "lf" | "pfe" | "ila";

export type GrowthMeasure = {
  id: string;
  /** Âge gestationnel en semaines décimales (SA + jours/7) */
  gaWeeks: number;
  dateEcho: string;
  bip?: number;
  pc?: number;
  pa?: number;
  lf?: number;
  pfe?: number;
  ila?: number;
};

export type PercentileStatus = "normal" | "surveillance" | "pathologique";

export type PercentileEstimate = {
  percentile: number;
  status: PercentileStatus;
  color: string;
  label: string;
  icon: string;
};

export type ChartPoint = {
  ga: number;
  value: number;
};

export type CurveSeries = {
  ga: number;
} & IgPercentiles;
