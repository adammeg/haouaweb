/**
 * Références ILA — Moore 1990 (amniotic fluid index).
 * Semaines 16–42 SA — percentiles dérivés des médianes publiées.
 */

import type { IgPercentiles } from "./types";

function r(
  wk: number,
  p3: number,
  p10: number,
  p50: number,
  p90: number,
  p97: number,
): [number, IgPercentiles] {
  return [wk, { p3, p10, p50, p90, p97 }];
}

/** ILA — index de liquide amniotique (cm) — Moore 1990 */
export const MOORE_ILA: Record<number, IgPercentiles> = Object.fromEntries([
  r(16, 4.5, 6.5, 10.0, 14.0, 17.0),
  r(18, 5.0, 7.0, 10.5, 14.5, 17.5),
  r(20, 5.5, 7.5, 11.0, 15.0, 18.0),
  r(22, 6.0, 8.0, 12.0, 16.0, 19.0),
  r(24, 6.5, 8.5, 12.5, 16.5, 19.5),
  r(26, 6.5, 9.0, 13.0, 17.0, 20.5),
  r(28, 6.0, 9.0, 14.0, 19.0, 23.0),
  r(30, 6.0, 8.5, 13.5, 18.5, 22.0),
  r(32, 5.5, 8.0, 13.0, 18.0, 22.0),
  r(34, 5.0, 7.5, 12.5, 17.0, 21.0),
  r(36, 4.5, 7.0, 12.0, 16.0, 20.0),
  r(38, 4.0, 6.5, 11.0, 15.0, 18.5),
  r(40, 3.5, 6.0, 10.0, 14.0, 17.0),
  r(42, 3.0, 5.5, 9.0, 13.0, 16.0),
]);
