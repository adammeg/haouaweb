/** L2 — Normalisation (MoM, Hadlock, Nicolaides, etc.). */

const ETHNICITY_FACTORS: Record<
  string,
  { papp_a: number; free_bhcg: number; plgf: number }
> = {
  caucasian: { papp_a: 1.0, free_bhcg: 1.0, plgf: 1.0 },
  afrocaribbean: { papp_a: 1.35, free_bhcg: 1.08, plgf: 0.79 },
  south_asian: { papp_a: 0.98, free_bhcg: 1.03, plgf: 0.94 },
  east_asian: { papp_a: 0.87, free_bhcg: 1.06, plgf: 1.0 },
  other: { papp_a: 1.0, free_bhcg: 1.0, plgf: 1.0 },
};

const NT_MEDIANS: Record<number, number> = {
  11: 1.2,
  11.2: 1.22,
  11.4: 1.25,
  11.6: 1.27,
  11.8: 1.3,
  12: 1.33,
  12.2: 1.36,
  12.4: 1.4,
  12.6: 1.43,
  12.8: 1.47,
  13: 1.51,
  13.2: 1.55,
  13.4: 1.59,
  13.6: 1.63,
  13.8: 1.67,
  14: 1.71,
};

const EFW_P50: Record<number, number> = {
  20: 316,
  21: 380,
  22: 458,
  23: 547,
  24: 650,
  25: 767,
  26: 899,
  27: 1046,
  28: 1210,
  29: 1388,
  30: 1560,
  31: 1743,
  32: 1918,
  33: 2104,
  34: 2290,
  35: 2476,
  36: 2662,
  37: 2859,
  38: 3049,
  39: 3270,
  40: 3462,
  41: 3597,
  42: 3685,
};

const EFW_SD_PCT: Record<number, number> = {
  20: 19,
  21: 19,
  22: 19,
  23: 18,
  24: 18,
  25: 18,
  26: 17,
  27: 17,
  28: 17,
  29: 16,
  30: 16,
  31: 16,
  32: 15,
  33: 15,
  34: 15,
  35: 15,
  36: 15,
  37: 15,
  38: 15,
  39: 15,
  40: 15,
  41: 16,
  42: 16,
};

const T21_BG_TABLE: Record<number, number> = {
  20: 1527,
  21: 1200,
  22: 946,
  23: 747,
  24: 591,
  25: 467,
  26: 369,
  27: 292,
  28: 231,
  29: 183,
  30: 145,
  31: 115,
  32: 91,
  33: 72,
  34: 57,
  35: 45,
  36: 36,
  37: 28,
  38: 22,
  39: 17,
  40: 14,
  41: 11,
  42: 8,
  43: 7,
  44: 5,
  45: 4,
};

export const UA_P95: Record<number, number> = {
  24: 1.45,
  26: 1.4,
  28: 1.35,
  30: 1.3,
  32: 1.25,
  34: 1.18,
  36: 1.13,
  38: 1.08,
  40: 1.03,
};

export const CPR_P5: Record<number, number> = {
  24: 1.18,
  26: 1.16,
  28: 1.15,
  30: 1.14,
  32: 1.13,
  34: 1.12,
  36: 1.1,
  38: 1.07,
  40: 1.04,
};

function interp(table: Record<number, number>, key: number): number | null {
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  if (key <= keys[0]) return table[keys[0]];
  if (key >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= key && key <= keys[i + 1]) {
      const t = (key - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
    }
  }
  return null;
}

function zToPct(z: number): number {
  const zc = Math.max(-4, Math.min(4, z));
  const t = 1 / (1 + 0.2316419 * Math.abs(zc));
  const d = 0.3989423 * Math.exp((-zc * zc) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return +((zc > 0 ? 1 - p : p) * 100).toFixed(1);
}

function gaussian(x: number, mu: number, sigma: number): number {
  return (
    Math.exp((-((x - mu) ** 2)) / (2 * sigma * sigma)) /
    (sigma * Math.sqrt(2 * Math.PI))
  );
}

export const Norm = {
  bmiPappaFactor(bmi: number | null | undefined): number {
    if (!bmi) return 1.0;
    if (bmi < 18.5) return 0.85;
    if (bmi < 25.0) return 1.0;
    if (bmi < 30.0) return 1.12;
    if (bmi < 35.0) return 1.28;
    return 1.44;
  },

  correctMoM(
    rawMom: number,
    marker: "papp_a" | "free_bhcg" | "plgf",
    ethnicity = "caucasian",
    bmi: number | null = null,
  ): number {
    const eth = (ethnicity || "caucasian").toLowerCase();
    const factors = ETHNICITY_FACTORS[eth] ?? ETHNICITY_FACTORS.caucasian;
    let corrected = rawMom / (factors[marker] || 1.0);
    if (marker === "papp_a" && bmi) corrected /= Norm.bmiPappaFactor(bmi);
    return Math.max(0.001, +corrected.toFixed(4));
  },

  ntMom(ntMm: number, gaWeeks: number): number | null {
    const median = interp(NT_MEDIANS, gaWeeks);
    return median && median > 0 ? +(ntMm / median).toFixed(3) : null;
  },

  efwPercentile(efwGrams: number, gaWeeks: number): number | null {
    const gar = Math.max(20, Math.min(42, Math.round(gaWeeks)));
    const p50 = EFW_P50[gar];
    const sdp = EFW_SD_PCT[gar];
    if (!p50 || !sdp) return null;
    const sd = (p50 * sdp) / 100;
    return zToPct((efwGrams - p50) / sd);
  },

  hadlockEfw(
    bpdMm: number,
    hcMm: number,
    acMm: number,
    flMm: number,
  ): number | null {
    const b = bpdMm / 10;
    const h = hcMm / 10;
    const a = acMm / 10;
    const f = flMm / 10;
    const logEfw =
      1.3596 - 0.00386 * a * f + 0.0064 * h + 0.00061 * b * a + 0.0424 * a + 0.174 * f;
    return Math.round(10 ** logEfw);
  },

  amhNgmlToPmol: (ng: number) => +(ng * 7.14).toFixed(2),
  amhPmolToNgml: (pm: number) => +(pm / 7.14).toFixed(3),
  bmi: (wt: number, ht: number) => +(wt / (ht / 100) ** 2).toFixed(1),
  map: (sbp: number, dbp: number) => +(dbp + (sbp - dbp) / 3).toFixed(1),

  ci95(p: number, n = 5000): [number, number] {
    if (p <= 0 || p >= 1) return [p, p];
    const z = 1.96;
    const d = 1 + (z * z) / n;
    const c = (p + (z * z) / (2 * n)) / d;
    const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
    return [Math.max(0, +(c - half).toFixed(6)), Math.min(1, +(c + half).toFixed(6))];
  },

  t21BackgroundRisk(age: number): number {
    const probTable: Record<number, number> = {};
    Object.keys(T21_BG_TABLE).forEach((k) => {
      probTable[Number(k)] = 1 / T21_BG_TABLE[Number(k)];
    });
    const p = interp(probTable, Math.max(20, Math.min(45, age)));
    return p != null
      ? Math.max(0.0001, p)
      : 1 / T21_BG_TABLE[Math.min(45, Math.max(20, Math.round(age)))];
  },

  gaussLR(mom: number | null, t21m: number, t21s: number, nrmM: number, nrmS: number): number {
    if (mom == null) return 1.0;
    const pt = gaussian(mom, t21m, t21s);
    const pn = gaussian(mom, nrmM, nrmS);
    return pn > 0 ? Math.max(0.001, pt / pn) : 1.0;
  },

  log10LR(mom: number | null, t21m: number, t21s: number, nrmM: number, nrmS: number): number {
    if (!mom || mom <= 0) return 1.0;
    return Norm.gaussLR(Math.log10(mom), t21m, t21s, nrmM, nrmS);
  },

  _interp: interp,
};
