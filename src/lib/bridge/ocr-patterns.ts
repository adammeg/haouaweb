/** Patterns OCR echographe (port HTML v49). */

export type OcrFieldKey =
  | "bip"
  | "hc"
  | "ac"
  | "fl"
  | "efw"
  | "col"
  | "ip_ao"
  | "ip_acm"
  | "uta_pi"
  | "ila"
  | "fcf"
  | "ag_sa"
  | "nt"
  | "crl";

const PATTERNS: { re: RegExp; field: OcrFieldKey }[] = [
  { re: /\bBPD[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "bip" },
  { re: /\bBIP[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "bip" },
  { re: /\bHC[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "hc" },
  { re: /\bPC[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "hc" },
  { re: /\bAC[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "ac" },
  { re: /\bCA[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "ac" },
  { re: /\bFL[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "fl" },
  { re: /\bLF[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "fl" },
  { re: /\bEFW[\s:=]*(\d+\.?\d*)\s*(?:g)?/i, field: "efw" },
  { re: /\bPFE[\s:=]*(\d+\.?\d*)\s*(?:g)?/i, field: "efw" },
  { re: /(?:CL|Col|Cervix)[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "col" },
  { re: /(?:UA|UmA|AO)\s*PI[\s:=]*(\d+\.?\d*)/i, field: "ip_ao" },
  { re: /(?:MCA|ACM)\s*PI[\s:=]*(\d+\.?\d*)/i, field: "ip_acm" },
  { re: /(?:UtA|Ut\.A)\s*PI[\s:=]*(\d+\.?\d*)/i, field: "uta_pi" },
  { re: /\bAFI[\s:=]*(\d+\.?\d*)\s*(?:cm)?/i, field: "ila" },
  { re: /\bILA[\s:=]*(\d+\.?\d*)\s*(?:cm)?/i, field: "ila" },
  { re: /\bFHR[\s:=]*(\d+\.?\d*)\s*(?:bpm)?/i, field: "fcf" },
  { re: /\bFCF[\s:=]*(\d+\.?\d*)\s*(?:bpm)?/i, field: "fcf" },
  { re: /(?:GA|AG)[\s:=]*(\d+\.?\d*)\s*(?:SA|wk|w)?/i, field: "ag_sa" },
  { re: /\bNT[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "nt" },
  { re: /\bCRL[\s:=]*(\d+\.?\d*)\s*(?:mm)?/i, field: "crl" },
];

export const OCR_LABELS: Record<OcrFieldKey, string> = {
  bip: "BIP",
  hc: "PC/HC",
  ac: "CA/AC",
  fl: "LF/FL",
  efw: "PFE",
  col: "Col",
  ip_ao: "IP AO",
  ip_acm: "IP ACM",
  uta_pi: "UtA PI",
  ila: "ILA",
  fcf: "FCF",
  ag_sa: "AG (SA)",
  nt: "NT",
  crl: "CRL",
};

/** Map OCR keys -> champs PatientSnapshot (t2_*). */
export function ocrToPatientPatch(
  data: Partial<Record<OcrFieldKey, number>>,
): Record<string, string> {
  const patch: Record<string, string> = {};
  if (data.bip != null) patch.t2_bip = String(data.bip);
  if (data.hc != null) patch.t2_pc = String(data.hc);
  if (data.ac != null) patch.t2_ca = String(data.ac);
  if (data.fl != null) patch.t2_lf = String(data.fl);
  if (data.efw != null) patch.t2_pfe = String(data.efw);
  if (data.col != null) patch.t2_col = String(data.col);
  if (data.ip_ao != null) patch.t2_ip_ao = String(data.ip_ao);
  if (data.ip_acm != null) patch.t2_ip_acm = String(data.ip_acm);
  if (data.uta_pi != null) {
    patch.t2_uta_g = String(data.uta_pi);
    patch.t2_uta_d = String(data.uta_pi);
  }
  if (data.ila != null) patch.t2_ila = String(data.ila);
  if (data.fcf != null) patch.t2_fcf = String(data.fcf);
  if (data.ag_sa != null) patch.t2_ag = String(data.ag_sa);
  if (data.nt != null) patch.o_nt = String(data.nt);
  return patch;
}

export function parseOcrText(text: string): Partial<Record<OcrFieldKey, number>> {
  const results: Partial<Record<OcrFieldKey, number>> = {};
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m && m[1]) {
      const val = parseFloat(m[1]);
      if (!Number.isNaN(val) && val > 0) results[p.field] = val;
    }
  }
  return results;
}
