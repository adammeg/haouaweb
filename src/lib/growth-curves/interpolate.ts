/**
 * Interpolation linéaire des tables de percentiles par âge gestationnel.
 */

import type { IgPercentiles } from "./types";

/** Interpole les percentiles entre deux semaines tabulées */
export function interpPercentiles(
  tbl: Record<number, IgPercentiles>,
  ga: number,
): IgPercentiles | null {
  const wks = Object.keys(tbl)
    .map(Number)
    .sort((a, b) => a - b);
  if (wks.length === 0) return null;
  if (ga <= wks[0]!) return tbl[wks[0]!]!;
  const last = wks[wks.length - 1]!;
  if (ga >= last) return tbl[last]!;

  for (let i = 0; i < wks.length - 1; i++) {
    const w0 = wks[i]!;
    const w1 = wks[i + 1]!;
    if (ga >= w0 && ga <= w1) {
      const t = (ga - w0) / (w1 - w0);
      const a = tbl[w0]!;
      const b = tbl[w1]!;
      return {
        p3: lerp(a.p3, b.p3, t),
        p10: lerp(a.p10, b.p10, t),
        p50: lerp(a.p50, b.p50, t),
        p90: lerp(a.p90, b.p90, t),
        p97: lerp(a.p97, b.p97, t),
      };
    }
  }
  return null;
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/** Construit une série de courbes interpolée (pas 0.5 SA) */
export function buildCurveSeries(
  tbl: Record<number, IgPercentiles>,
  fromGa: number,
  toGa: number,
  step = 0.5,
): Array<{ ga: number } & IgPercentiles> {
  const pts: Array<{ ga: number } & IgPercentiles> = [];
  for (let ga = fromGa; ga <= toGa; ga += step) {
    const ref = interpPercentiles(tbl, ga);
    if (ref) pts.push({ ga, ...ref });
  }
  return pts;
}
