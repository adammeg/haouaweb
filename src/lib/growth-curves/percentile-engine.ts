/**
 * Estimation de percentile et statut clinique à partir des références.
 */

import { COLORS } from "./constants";
import { interpPercentiles } from "./interpolate";
import { INTERGROWTH_TABLES } from "./intergrowth-data";
import { MOORE_ILA, MOORE_ILA_PERCENTILES } from "./ila-moore";
import type {
  GrowthParamKey,
  IgPercentiles,
  PercentileEstimate,
} from "./types";

function getTable(key: GrowthParamKey): Record<number, IgPercentiles> {
  if (key === "ila") return MOORE_ILA;
  return INTERGROWTH_TABLES[key];
}

/** Estime le percentile (3–97) par interpolation inverse entre courbes */
export function estimatePercentile(
  key: GrowthParamKey,
  gaWeeks: number,
  value: number,
): PercentileEstimate | null {
  const meta = { gaMin: key === "ila" ? 16 : 14, gaMax: key === "ila" ? 42 : 40 };
  if (!value || gaWeeks < meta.gaMin || gaWeeks > meta.gaMax) return null;

  const ref = interpPercentiles(getTable(key), gaWeeks);
  if (!ref) return null;

  // L'ILA (Moore 1990) est tabulé aux 2,5e, 5e, 50e, 95e et 97,5e percentiles.
  const ranks: readonly number[] = key === "ila" ? MOORE_ILA_PERCENTILES : [3, 10, 50, 90, 97];
  const anchors: Array<{ p: number; v: number }> = [
    { p: ranks[0]!, v: ref.p3 },
    { p: ranks[1]!, v: ref.p10 },
    { p: ranks[2]!, v: ref.p50 },
    { p: ranks[3]!, v: ref.p90 },
    { p: ranks[4]!, v: ref.p97 },
  ];

  let percentile: number;
  if (value <= anchors[0]!.v) {
    percentile = value < ref.p3 ? 1 : 3;
  } else if (value >= anchors[4]!.v) {
    percentile = value > ref.p97 ? 99 : 97;
  } else {
    percentile = piecewisePercentile(value, anchors);
  }

  return buildEstimate(Math.round(percentile), key);
}

function piecewisePercentile(
  val: number,
  anchors: Array<{ p: number; v: number }>,
): number {
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!;
    const b = anchors[i + 1]!;
    if (val >= a.v && val <= b.v) {
      const t = (val - a.v) / (b.v - a.v || 1);
      return a.p + t * (b.p - a.p);
    }
  }
  return 50;
}

function buildEstimate(
  percentile: number,
  key: GrowthParamKey,
): PercentileEstimate {
  let status: "normal" | "surveillance" | "pathologique";
  let color: string;
  let icon: string;
  let label: string;

  // « Petit / gros poids » ne s'applique qu'au poids estimé et au périmètre abdominal.
  const weightLike = key === "pfe" || key === "pa";
  if (percentile < 3 || percentile > 97) {
    status = "pathologique";
    color = COLORS.pathologique;
    icon = "⚠";
    label =
      percentile < 3
        ? weightLike
          ? "< P3 — restriction de croissance à évaluer (Doppler)"
          : "< P3 — mesure basse, à contrôler"
        : weightLike
          ? "> P97 — gros pour l'âge gestationnel"
          : "> P97 — mesure élevée, à contrôler";
  } else if (percentile < 10 || percentile > 90) {
    status = "surveillance";
    color = COLORS.surveillance;
    icon = "⚠";
    label =
      percentile < 10
        ? weightLike
          ? `Petit pour l'âge gestationnel (P${percentile})`
          : `Mesure basse (P${percentile})`
        : weightLike
          ? `Gros pour l'âge gestationnel (P${percentile})`
          : `Mesure élevée (P${percentile})`;
  } else {
    status = "normal";
    color = COLORS.normal;
    icon = "✓";
    label = `Normal (P${percentile})`;
  }

  if (key === "ila") {
    // Le diagnostic d'oligoamnios / hydramnios repose sur les seuils absolus (ILA ≤ 5 cm / ≥ 25 cm), pas sur ce percentile.
    if (percentile < 3) label = "ILA < 2,5e percentile — vérifier oligoamnios (ILA ≤ 5 cm)";
    else if (percentile < 10) label = `ILA bas (P${percentile})`;
    else if (percentile > 97) label = "ILA > 97,5e percentile — vérifier hydramnios (ILA ≥ 25 cm)";
    else if (percentile > 90) label = `ILA élevé (P${percentile})`;
    else label = `LA normal (P${percentile})`;
  }

  return { percentile, status, color, label, icon };
}

/** Récupère les percentiles de référence à un âge gestationnel */
export function getReferenceAt(
  key: GrowthParamKey,
  gaWeeks: number,
): IgPercentiles | null {
  return interpPercentiles(getTable(key), gaWeeks);
}
