/** Tables percentiles Salomon 2011 (port v49 HTML). */

export type PercentileRef = { p5: number; p50: number; p95: number };

export type SalomonKey = "bip" | "pc" | "ca" | "lf" | "pfe";

export const SALOMON_TABLES: Record<
  SalomonKey,
  Record<number, PercentileRef>
> = {
  bip: {
    18: { p5: 38, p50: 43, p95: 48 },
    19: { p5: 41, p50: 46, p95: 51 },
    20: { p5: 44, p50: 49, p95: 54 },
    21: { p5: 47, p50: 52, p95: 58 },
    22: { p5: 50, p50: 55, p95: 61 },
    23: { p5: 53, p50: 59, p95: 65 },
    24: { p5: 56, p50: 62, p95: 68 },
    25: { p5: 59, p50: 65, p95: 72 },
    26: { p5: 62, p50: 68, p95: 75 },
    28: { p5: 67, p50: 74, p95: 81 },
    30: { p5: 73, p50: 80, p95: 88 },
    32: { p5: 79, p50: 86, p95: 94 },
    34: { p5: 84, p50: 91, p95: 99 },
    36: { p5: 88, p50: 96, p95: 104 },
    38: { p5: 92, p50: 100, p95: 108 },
    40: { p5: 95, p50: 103, p95: 112 },
  },
  pc: {
    18: { p5: 135, p50: 153, p95: 171 },
    19: { p5: 148, p50: 166, p95: 184 },
    20: { p5: 160, p50: 179, p95: 198 },
    21: { p5: 172, p50: 192, p95: 212 },
    22: { p5: 183, p50: 203, p95: 224 },
    23: { p5: 194, p50: 215, p95: 236 },
    24: { p5: 204, p50: 226, p95: 248 },
    25: { p5: 213, p50: 236, p95: 259 },
    26: { p5: 222, p50: 246, p95: 270 },
    28: { p5: 239, p50: 264, p95: 289 },
    30: { p5: 255, p50: 281, p95: 307 },
    32: { p5: 269, p50: 296, p95: 323 },
    34: { p5: 281, p50: 308, p95: 336 },
    36: { p5: 291, p50: 319, p95: 347 },
    38: { p5: 299, p50: 328, p95: 357 },
    40: { p5: 305, p50: 335, p95: 364 },
  },
  ca: {
    18: { p5: 111, p50: 127, p95: 143 },
    19: { p5: 123, p50: 140, p95: 157 },
    20: { p5: 135, p50: 153, p95: 171 },
    21: { p5: 147, p50: 165, p95: 184 },
    22: { p5: 158, p50: 177, p95: 197 },
    23: { p5: 169, p50: 189, p95: 210 },
    24: { p5: 179, p50: 200, p95: 222 },
    25: { p5: 189, p50: 211, p95: 233 },
    26: { p5: 199, p50: 222, p95: 245 },
    28: { p5: 218, p50: 242, p95: 266 },
    30: { p5: 236, p50: 261, p95: 286 },
    32: { p5: 252, p50: 279, p95: 305 },
    34: { p5: 267, p50: 295, p95: 322 },
    36: { p5: 280, p50: 309, p95: 337 },
    38: { p5: 291, p50: 321, p95: 350 },
    40: { p5: 300, p50: 330, p95: 360 },
  },
  lf: {
    18: { p5: 24, p50: 29, p95: 34 },
    19: { p5: 27, p50: 32, p95: 37 },
    20: { p5: 30, p50: 35, p95: 41 },
    21: { p5: 33, p50: 38, p95: 44 },
    22: { p5: 35, p50: 41, p95: 47 },
    23: { p5: 38, p50: 44, p95: 50 },
    24: { p5: 40, p50: 46, p95: 53 },
    25: { p5: 42, p50: 49, p95: 56 },
    26: { p5: 45, p50: 51, p95: 58 },
    28: { p5: 49, p50: 56, p95: 63 },
    30: { p5: 53, p50: 60, p95: 67 },
    32: { p5: 57, p50: 64, p95: 71 },
    34: { p5: 60, p50: 67, p95: 74 },
    36: { p5: 62, p50: 70, p95: 77 },
    38: { p5: 65, p50: 72, p95: 79 },
    40: { p5: 67, p50: 74, p95: 82 },
  },
  pfe: {
    18: { p5: 150, p50: 190, p95: 240 },
    19: { p5: 185, p50: 235, p95: 295 },
    20: { p5: 225, p50: 290, p95: 365 },
    21: { p5: 275, p50: 350, p95: 440 },
    22: { p5: 330, p50: 420, p95: 530 },
    23: { p5: 395, p50: 500, p95: 630 },
    24: { p5: 465, p50: 590, p95: 745 },
    25: { p5: 550, p50: 695, p95: 875 },
    26: { p5: 645, p50: 815, p95: 1025 },
    28: { p5: 870, p50: 1090, p95: 1370 },
    30: { p5: 1130, p50: 1420, p95: 1780 },
    32: { p5: 1420, p50: 1780, p95: 2230 },
    34: { p5: 1740, p50: 2170, p95: 2720 },
    36: { p5: 2060, p50: 2580, p95: 3225 },
    38: { p5: 2380, p50: 2980, p95: 3730 },
    40: { p5: 2680, p50: 3350, p95: 4190 },
  },
};

export function interpSalomon(
  tbl: Record<number, PercentileRef>,
  ag: number,
): PercentileRef | null {
  const wks = Object.keys(tbl)
    .map(Number)
    .sort((a, b) => a - b);
  if (wks.length === 0) return null;
  if (ag <= wks[0]!) return tbl[wks[0]!]!;
  const last = wks[wks.length - 1]!;
  if (ag >= last) return tbl[last]!;
  for (let i = 0; i < wks.length - 1; i++) {
    const w0 = wks[i]!;
    const w1 = wks[i + 1]!;
    if (ag >= w0 && ag <= w1) {
      const t = (ag - w0) / (w1 - w0);
      const a = tbl[w0]!;
      const b = tbl[w1]!;
      return {
        p5: Math.round(a.p5 + t * (b.p5 - a.p5)),
        p50: Math.round(a.p50 + t * (b.p50 - a.p50)),
        p95: Math.round(a.p95 + t * (b.p95 - a.p95)),
      };
    }
  }
  return null;
}

export type PercentileResult = {
  txt: string;
  col: "#dc2626" | "#d97706" | "#16a34a";
  percentile?: number;
};

export function getPercentile(val: number, ref: PercentileRef): PercentileResult {
  if (val < ref.p5) return { txt: "< 5e", col: "#dc2626", percentile: 3 };
  if (val > ref.p95) return { txt: "> 95e", col: "#dc2626", percentile: 97 };
  const p =
    val <= ref.p50
      ? 5 + (45 * (val - ref.p5)) / (ref.p50 - ref.p5)
      : 50 + (45 * (val - ref.p50)) / (ref.p95 - ref.p50);
  const rounded = Math.round(p);
  return {
    txt: rounded + "e",
    col: rounded < 10 || rounded > 90 ? "#d97706" : "#16a34a",
    percentile: rounded,
  };
}

export function computeBiometryPercentile(
  key: SalomonKey,
  agWeeks: number,
  value: number,
): { ref: PercentileRef; result: PercentileResult } | null {
  if (!agWeeks || agWeeks < 16 || agWeeks > 42) return null;
  const ref = interpSalomon(SALOMON_TABLES[key], agWeeks);
  if (!ref || !value) return null;
  return { ref, result: getPercentile(value, ref) };
}
