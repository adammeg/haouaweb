/** FMF MoM converter — Spencer 2003 + Kagan 2008 (interpolation linéaire). */

export type FmfMarker = "papp_a" | "bhcg" | "plgf";

const PAPP_MEDIAN_MIU: Record<number, number> = {
  11: 0.5,
  12: 0.9,
  13: 1.5,
  14: 2.3,
};

const BHCG_MEDIAN_NG: Record<number, number> = {
  11: 46.0,
  12: 36.0,
  13: 26.5,
  14: 19.5,
};

const PLGF_MEDIAN_PG: Record<number, number> = {
  11: 30.5,
  12: 43.0,
  13: 55.0,
  14: 70.0,
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
    if (u.includes("ng")) return value * 1000;
    if (u.includes("iu/l") && !u.includes("miu")) return value;
    return value;
  }
  if (marker === "bhcg") {
    const u = (unit || "ng/mL").toLowerCase();
    if (u.includes("mui") || u.includes("iu/l")) return value / 1000;
    return value;
  }
  return value;
}

export function convertFmfMoM(input: FmfMomInput): FmfMomResult | null {
  const { gaWeeks, rawValue, marker } = input;
  if (!gaWeeks || gaWeeks < 11 || gaWeeks > 14 || !rawValue) return null;

  const val = toBaseUnit(marker, rawValue, input.unit);
  let median: number;
  if (marker === "papp_a") median = interp(PAPP_MEDIAN_MIU, gaWeeks);
  else if (marker === "bhcg") median = interp(BHCG_MEDIAN_NG, gaWeeks);
  else median = interp(PLGF_MEDIAN_PG, gaWeeks);

  let mom = val / median;

  const eth = (input.ethnicity || "caucasian").toLowerCase();
  if (marker === "papp_a") {
    if (eth.includes("afro")) mom /= 1.5;
    else if (eth.includes("asian") || eth.includes("sud")) mom /= 1.12;
    if (input.weightKg) {
      mom /= Math.exp(0.00318 * (input.weightKg - 69));
    }
    if (input.smoking) mom /= 0.87;
    if (input.nulliparous) mom /= 1.09;
  }
  if (marker === "plgf" && eth.includes("afro")) mom /= 2.7;
  if (marker === "plgf" && input.smoking) mom /= 0.68;

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
