/**
 * Estimation de percentile et statut clinique à partir des références.
 */

import { COLORS } from "./constants";
import { interpPercentiles } from "./interpolate";
import { INTERGROWTH_TABLES } from "./intergrowth-data";
import { MOORE_ILA } from "./ila-moore";
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

  const anchors: Array<{ p: number; v: number }> = [
    { p: 3, v: ref.p3 },
    { p: 10, v: ref.p10 },
    { p: 50, v: ref.p50 },
    { p: 90, v: ref.p90 },
    { p: 97, v: ref.p97 },
  ];

  let percentile: number;
  if (value <= anchors[0]!.v) {
    percentile = value < ref.p3 * 0.92 ? 1 : 3;
  } else if (value >= anchors[4]!.v) {
    percentile = value > ref.p97 * 1.08 ? 99 : 97;
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

  if (percentile < 3 || percentile > 97) {
    status = "pathologique";
    color = COLORS.pathologique;
    icon = "⚠";
    label =
      percentile < 3
        ? `Hypotrophie sévère (P${percentile})`
        : `Macrosomie (P${percentile})`;
  } else if (percentile < 10 || percentile > 90) {
    status = "surveillance";
    color = COLORS.surveillance;
    icon = "⚠";
    label =
      percentile < 10
        ? `Hypotrophie suspectée (P${percentile})`
        : `Croissance accélérée (P${percentile})`;
  } else {
    status = "normal";
    color = COLORS.normal;
    icon = "✓";
    label = `Normal (P${percentile})`;
  }

  if (key === "ila") {
    if (percentile < 3) label = `Oligoamnios sévère (P${percentile})`;
    else if (percentile < 10) label = `Oligoamnios (P${percentile})`;
    else if (percentile > 97) label = `Hydramnios sévère (P${percentile})`;
    else if (percentile > 90) label = `Hydramnios (P${percentile})`;
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
