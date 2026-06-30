/**
 * Courbes de croissance fœtale — façade de compatibilité.
 * Les nouvelles tables INTERGROWTH-21st sont dans intergrowth-data.ts.
 */

import {
  interpSalomon,
  SALOMON_TABLES,
  type SalomonKey,
} from "@/lib/t2-echo/salomon";

export type { SalomonKey };

export type CurvePoint = { ga: number; p5: number; p50: number; p95: number };

export function buildGrowthCurve(
  key: SalomonKey,
  fromGa = 18,
  toGa = 40,
  step = 1,
): CurvePoint[] {
  const tbl = SALOMON_TABLES[key];
  const pts: CurvePoint[] = [];
  for (let ga = fromGa; ga <= toGa; ga += step) {
    const ref = interpSalomon(tbl, ga);
    if (ref) pts.push({ ga, ...ref });
  }
  return pts;
}

export const CURVE_META: Record<
  SalomonKey,
  { label: string; unit: string; color: string }
> = {
  bip: { label: "BIP", unit: "mm", color: "#007070" },
  pc: { label: "PC / HC", unit: "mm", color: "#007070" },
  ca: { label: "PA / AC", unit: "mm", color: "#0a5c5c" },
  lf: { label: "LF / FL", unit: "mm", color: "#4a9090" },
  pfe: { label: "PFE / EFW", unit: "g", color: "#c9a84c" },
};
