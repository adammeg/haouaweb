/** FMF MoM converter — Spencer 2003 + Kagan 2008 (interpolation linéaire). */

export type FmfMarker = "papp_a" | "bhcg" | "plgf";

const PAPP_MEDIAN_MIU: Record<number, number> = {
  11: 0.5,
  11.5: 0.62,
  12: 0.9,
  12.5: 1.12,
  13: 1.5,
  13.5: 1.92,
  14: 2.3,
};

const BHCG_MEDIAN_NG: Record<number, number> = {
  11: 46.0,
  11.5: 41.5,
  12: 36.0,
  12.5: 31.5,
  13: 26.5,
  13.5: 23.0,
  14: 19.5,
};

const PLGF_MEDIAN_PG: Record<number, number> = {
  11: 30.5,
  11.5: 35.0,
  12: 43.0,
  12.5: 51.0,
  13: 55.0,
  13.5: 63.0,
  14: 70.0,
};

const PAPP_ETHNICITY_FACTOR: Record<string, number> = {
  caucasian: 1,
  afrocaribbean: 1.5,
  south_asian: 1.12,
  east_asian: 1,
  mixed: 1.08,
};

const PLGF_ETHNICITY_FACTOR: Record<string, number> = {
  caucasian: 1,
  afrocaribbean: 2.7,
  south_asian: 0.97,
  east_asian: 0.95,
  mixed: 1.3,
};

function interp(table: Record<number, number>, ga: number): number {
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  if (ga <= keys[0]) return table[keys[0]];
  if (ga >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= ga && ga <= keys[i + 1]) {
      const t = (ga - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
    }
  }
  return table[keys[0]];
}

export interface FmfMomInput {
  gaWeeks: number;
  rawValue: number;
  marker: FmfMarker;
  unit?: string;
  ethnicity?: string;
  weightKg?: number;
  smoking?: boolean;
  nulliparous?: boolean;
}

export interface FmfMomResult {
  mom: number;
  label: string;
  level: "low" | "normal" | "high";
}

function toBaseUnit(
  marker: FmfMarker,
  value: number,
  unit?: string,
): number {
  if (marker === "papp_a") {
    const u = (unit || "mIU/mL").toLowerCase();
    if (u.includes("ng")) return value * 1.18;
    if (u.includes("iu/l") && !u.includes("miu")) return value;
    return value;
  }
  if (marker === "bhcg") {
    const u = (unit || "ng/mL").toLowerCase();
    if (u.includes("mui") || u.includes("iu/l")) return value / 5;
    return value;
  }
  return value;
}

export function convertFmfMoM(input: FmfMomInput): FmfMomResult | null {
  const { gaWeeks, rawValue, marker } = input;
  if (!Number.isFinite(gaWeeks) || gaWeeks < 11 || gaWeeks >= 14 || !Number.isFinite(rawValue) || rawValue <= 0) return null;

  const val = toBaseUnit(marker, rawValue, input.unit);
  let median: number;
  if (marker === "papp_a") median = interp(PAPP_MEDIAN_MIU, gaWeeks);
  else if (marker === "bhcg") median = interp(BHCG_MEDIAN_NG, gaWeeks);
  else median = interp(PLGF_MEDIAN_PG, gaWeeks);

  let mom = val / median;

  const eth = (input.ethnicity || "caucasian").toLowerCase();
  if (marker === "papp_a") {
    mom /= PAPP_ETHNICITY_FACTOR[eth] || 1;
    if (input.weightKg) {
      mom /= Math.exp(0.00318 * (input.weightKg - 69));
    }
    if (input.smoking) mom /= 0.87;
    if (input.nulliparous) mom /= 1.09;
  }
  if (marker === "bhcg" && input.weightKg) {
    mom /= Math.exp(-0.00148 * (input.weightKg - 69));
  }
  if (marker === "plgf") {
    mom /= PLGF_ETHNICITY_FACTOR[eth] || 1;
    if (input.smoking) mom /= 0.68;
  }

  mom = +mom.toFixed(2);
  let level: FmfMomResult["level"] = "normal";
  if (mom < 0.4) level = "low";
  else if (mom > 2.0) level = "high";

  const names = { papp_a: "PAPP-A", bhcg: "βhCG", plgf: "PlGF" };
  const levelFr = { low: "bas", normal: "normal", high: "élevé" };
  return {
    mom,
    label: `${names[marker]} = ${mom} MoM — ${levelFr[level]}`,
    level,
  };
}
