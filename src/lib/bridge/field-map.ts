/** Mapping champs échographe / DICOM SR → dossier HawaeMD. */

export type BridgeField = {
  source: string;
  target: keyof import("@/types/domain").PatientSnapshot | string;
  unit?: string;
};

export const ECHO_FIELD_MAP: BridgeField[] = [
  { source: "BPD", target: "t2_bip", unit: "mm" },
  { source: "HC", target: "t2_pc", unit: "mm" },
  { source: "AC", target: "t2_ca", unit: "mm" },
  { source: "FL", target: "t2_lf", unit: "mm" },
  { source: "EFW", target: "t2_pfe", unit: "g" },
  { source: "UA-PI", target: "t2_ip_ao" },
  { source: "MCA-PI", target: "t2_ip_acm" },
  { source: "UtA-PI-L", target: "t2_uta_g" },
  { source: "UtA-PI-R", target: "t2_uta_d" },
  { source: "FHR", target: "t2_fcf", unit: "bpm" },
  { source: "CL", target: "t2_col", unit: "mm" },
];

export function parseOcrBiometryLine(line: string): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  const patterns: [RegExp, string][] = [
    [/BIP\s*[:=]?\s*([\d.,]+)/i, "t2_bip"],
    [/HC|PC\s*[:=]?\s*([\d.,]+)/i, "t2_pc"],
    [/AC|CA\s*[:=]?\s*([\d.,]+)/i, "t2_ca"],
    [/FL|LF\s*[:=]?\s*([\d.,]+)/i, "t2_lf"],
    [/EFW|PFE\s*[:=]?\s*([\d.,]+)/i, "t2_pfe"],
    [/FCF|FHR\s*[:=]?\s*([\d.,]+)/i, "t2_fcf"],
    [/GA\s*[:=]?\s*([\d.,]+)/i, "t2_ag"],
  ];
  for (const [re, key] of patterns) {
    const m = line.match(re);
    if (m) out[key] = m[1]!.replace(",", ".");
  }
  return out;
}

export function parseOcrBlock(text: string): Partial<Record<string, string>> {
  const merged: Partial<Record<string, string>> = {};
  text.split(/\r?\n/).forEach((line) => {
    Object.assign(merged, parseOcrBiometryLine(line));
  });
  return merged;
}
