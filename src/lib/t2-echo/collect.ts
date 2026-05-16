import type { PatientSnapshot } from "@/types/domain";
import { getPatientDisplayName, patientAgeYears } from "@/lib/patient-utils";
import { checkT2Anomalies, type T2AnomalyCheck } from "./anomalies";
import { computeBiometryPercentile } from "./salomon";

export type T2Collected = {
  pat: string;
  age: string;
  ag: string;
  ag_sa: string;
  date: string;
  operateur: string;
  machine: string;
  qualite: string;
  bip: string;
  pc: string;
  ca: string;
  lf: string;
  pfe: string;
  col: string;
  ip_ao: string;
  edf: string;
  ip_acm: string;
  uta_g: string;
  uta_d: string;
  encoche: string;
  la: string;
  ila: string;
  placenta_loc: string;
  placenta_grade: string;
  placenta_asp: string;
  dist_col: string;
  csp: string;
  cerv: string;
  cist_magna: string;
  atrium: string;
  profil: string;
  levres: string;
  situs: string;
  q4cav: string;
  vej: string;
  q3vt: string;
  fcf: string;
  rythme: string;
  poumons: string;
  estomac: string;
  paroi: string;
  reins: string;
  pyelon: string;
  vessie: string;
  rachis: string;
  membres: string;
  sexe: string;
  notes: string;
  ia_conclusion: string;
  check: T2AnomalyCheck;
};

export function collectT2FromSnapshot(
  draft: PatientSnapshot,
  doctorName?: string,
): T2Collected {
  const ageY = patientAgeYears(draft.ddn);
  const ag = draft.t2_ag || draft.o_terme || "22";
  const dt = draft.t2_date
    ? new Date(draft.t2_date + "T12:00:00").toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");

  return {
    pat: getPatientDisplayName(draft),
    age: ageY != null ? ageY + " ans" : "—",
    ag,
    ag_sa: ag ? ag + " SA" : "—",
    date: dt,
    operateur: draft.t2_operateur || doctorName || "Dr Médecin",
    machine: draft.t2_machine || "—",
    qualite: draft.t2_qualite || "bonne",
    bip: draft.t2_bip ?? "",
    pc: draft.t2_pc ?? "",
    ca: draft.t2_ca ?? "",
    lf: draft.t2_lf ?? "",
    pfe: draft.t2_pfe ?? "",
    col: draft.t2_col ?? "",
    ip_ao: draft.t2_ip_ao ?? "",
    edf: draft.t2_edf ?? "",
    ip_acm: draft.t2_ip_acm ?? "",
    uta_g: draft.t2_uta_g ?? "",
    uta_d: draft.t2_uta_d ?? "",
    encoche: draft.t2_encoche ?? "non",
    la: draft.t2_la ?? "",
    ila: draft.t2_ila ?? "",
    placenta_loc: draft.t2_placenta_loc || "—",
    placenta_grade: draft.t2_placenta_grade ?? "",
    placenta_asp: draft.t2_placenta_asp ?? "",
    dist_col: draft.t2_dist_col ?? "",
    csp: draft.t2_csp ?? "normal",
    cerv: draft.t2_cerv ?? "normal",
    cist_magna: draft.t2_cist_magna ?? "",
    atrium: draft.t2_atrium ?? "",
    profil: draft.t2_profil ?? "normal",
    levres: draft.t2_levres ?? "normal",
    situs: draft.t2_situs ?? "normal",
    q4cav: draft.t2_4cav ?? "normal",
    vej: draft.t2_vej ?? "normal",
    q3vt: draft.t2_3vt ?? "normal",
    fcf: draft.t2_fcf ?? "",
    rythme: draft.t2_rythme ?? "regulier",
    poumons: draft.t2_poumons ?? "normal",
    estomac: draft.t2_estomac ?? "visible",
    paroi: draft.t2_paroi ?? "intact",
    reins: draft.t2_reins ?? "normal",
    pyelon: draft.t2_pyelon ?? "",
    vessie: draft.t2_vessie ?? "oui",
    rachis: draft.t2_rachis ?? "normal",
    membres: draft.t2_membres ?? "normal",
    sexe: draft.t2_sexe ?? "nd",
    notes: draft.t2_notes ?? "",
    ia_conclusion: draft.t2_ia_conclusion ?? "",
    check: checkT2Anomalies(draft),
  };
}

export function buildT2IaPrompt(d: T2Collected): string {
  const agNum = parseFloat(d.ag) || 22;
  function ps(val: string, k: "bip" | "pc" | "ca" | "lf" | "pfe"): string {
    if (!val) return "";
    const ref = computeBiometryPercentile(k, agNum, parseFloat(val));
    return ref ? " (" + ref.result.txt + " pct)" : "";
  }
  return [
    "Tu es médecin expert en échographie obstétricale niveau CHU, référent ISUOG.",
    "Rédige un compte-rendu officiel de morphologie fœtale T2 en français médical soigné.",
    "Patiente : " + d.pat + ", " + d.age + ", AG " + d.ag_sa + ", examen du " + d.date + ".",
    "",
    "BIOMETRIE (Salomon 2011) :",
    "BIP=" + d.bip + "mm" + ps(d.bip, "bip") + ", PC=" + d.pc + "mm" + ps(d.pc, "pc") +
      ", CA=" + d.ca + "mm" + ps(d.ca, "ca") + ", LF=" + d.lf + "mm" + ps(d.lf, "lf") +
      ", PFE=" + d.pfe + "g" + ps(d.pfe, "pfe") + ", Col=" + d.col + "mm.",
    "",
    "ANOMALIES : " + (d.check.anomalies.length ? d.check.anomalies.join(", ") : "Aucune") + ".",
    "VIGILANCE : " + (d.check.warnings.length ? d.check.warnings.join(", ") : "Aucun") + ".",
    d.notes ? "NOTES : " + d.notes + "." : "",
    "",
    "Rédige 5 sections : 1.BIOMÉTRIE 2.MORPHOLOGIE 3.PLACENTA/LA 4.DOPPLER 5.CONCLUSION. Max 600 mots.",
  ]
    .filter(Boolean)
    .join("\n");
}
