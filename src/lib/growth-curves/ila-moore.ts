/**
 * Index de liquide amniotique (ILA, cm) — Moore & Cayle, Am J Obstet Gynecol 1990.
 * La publication donne les 2,5e, 5e, 50e, 95e et 97,5e percentiles (pas les 3e/10e/90e/97e) :
 * ils occupent ici les emplacements p3, p10, p50, p90, p97 de la structure commune,
 * et MOORE_ILA_PERCENTILES indique leur rang réel.
 * Valeurs à contrôler contre la publication d'origine avant usage clinique.
 */

import type { IgPercentiles } from "./types";

/** Rang réel des cinq courbes ILA, dans l'ordre p3, p10, p50, p90, p97. */
export const MOORE_ILA_PERCENTILES = [2.5, 5, 50, 95, 97.5] as const;

// [SA, 2,5e, 5e, 50e, 95e, 97,5e] en millimètres, comme dans la table d'origine.
const MOORE_MM: [number, number, number, number, number, number][] = [
  [16, 73, 79, 121, 185, 201],
  [17, 77, 83, 127, 194, 211],
  [18, 80, 87, 133, 202, 220],
  [19, 83, 90, 137, 207, 225],
  [20, 86, 93, 141, 212, 230],
  [21, 88, 95, 143, 214, 233],
  [22, 89, 97, 145, 216, 235],
  [23, 90, 98, 146, 218, 237],
  [24, 90, 98, 147, 219, 238],
  [25, 89, 97, 147, 221, 240],
  [26, 89, 97, 147, 223, 242],
  [27, 85, 95, 146, 226, 245],
  [28, 86, 94, 146, 228, 249],
  [29, 84, 92, 145, 231, 254],
  [30, 82, 90, 145, 234, 258],
  [31, 79, 88, 144, 238, 263],
  [32, 77, 86, 144, 242, 269],
  [33, 74, 83, 143, 245, 274],
  [34, 72, 81, 142, 248, 278],
  [35, 70, 79, 140, 249, 279],
  [36, 68, 77, 138, 249, 279],
  [37, 66, 75, 135, 244, 275],
  [38, 65, 73, 132, 239, 269],
  [39, 64, 72, 127, 226, 255],
  [40, 63, 71, 123, 214, 240],
  [41, 63, 70, 116, 194, 216],
  [42, 63, 69, 110, 175, 192],
];

export const MOORE_ILA: Record<number, IgPercentiles> = Object.fromEntries(
  MOORE_MM.map(([wk, p025, p05, p50, p95, p975]) => [
    wk,
    { p3: p025 / 10, p10: p05 / 10, p50: p50 / 10, p90: p95 / 10, p97: p975 / 10 },
  ]),
);
