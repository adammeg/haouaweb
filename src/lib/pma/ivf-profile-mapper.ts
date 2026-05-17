import type { PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";
import {
  EMPTY_IVF_PROFILE,
  type IvfPatientProfile,
} from "@/lib/pma/ivf-types";

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function mapSopk(v?: string): string {
  if (v === "oui") return "oui";
  if (v === "probable") return "probable";
  return "non";
}

function mapEndo(d: PatientSnapshot): string {
  if (d.i_cause_inf === "endometriose" || d.g_endometriose === "oui") {
    if (d.i_dysp === "oui") return "stade34";
    return "stade12";
  }
  if (d.i_dysp === "oui") return "stade12";
  return "non";
}

function mapOhss(v?: string): string {
  if (v === "sev" || v === "sévère") return "severe";
  if (v === "mod" || v === "modéré") return "modere";
  if (v === "leger") return "leger";
  return "non";
}

function mapCause(v?: string): string {
  const m: Record<string, string> = {
    tubaire: "tubaire",
    ovulatoire: "ovulatoire",
    uterine: "uterin",
    endometriose: "endometriose",
    masculine: "masculin",
    mixte: "mixte",
    inexpliquee: "idiopathique",
  };
  return v ? m[v] ?? v : "";
}

function mapSpermo(v?: string): string {
  if (!v) return "normal";
  const m: Record<string, string> = {
    normo: "normal",
    oligo: "oligo",
    astheno: "astheno",
    terato: "terato",
    azoo: "azoospermie_sec",
  };
  return m[v] ?? v;
}

/** Pré-remplit le profil IVF depuis le dossier infertilité. */
export function ivfProfileFromPatient(d: PatientSnapshot): IvfPatientProfile {
  const age = patientAgeYears(d.ddn);
  const poids = num(d.ec_poids) ?? num(d.o_poids);
  const taille = num(d.ec_taille);
  const bmi =
    poids && taille ? +(poids / (taille / 100) ** 2).toFixed(1) : num(d.imc);

  let amh = num(d.i_amh_ngml) ?? num(d.bio_amh);
  const pmol = num(d.i_amh_pmol);
  if (amh == null && pmol != null) amh = +(pmol / 7.14).toFixed(2);

  const prevCycles = num(d.i_tentatives_fiv);
  const poor = d.i_mauvaise_reponse === "oui";

  return {
    ...EMPTY_IVF_PROFILE,
    age,
    bmi,
    dureeInf: num(d.i_duree),
    typeInf: d.i_type === "sec" ? "secondaire" : d.i_type === "prim" ? "primaire" : "",
    cause: mapCause(d.i_cause_inf),
    indication: d.motif?.toLowerCase().includes("préservation")
      ? "preservation"
      : "fiv",
    sopk: mapSopk(d.i_sopk),
    endo: mapEndo(d),
    ohssAtcd: mapOhss(d.i_atcd_ohss),
    ageH: num(d.i_age_h),
    spermo: mapSpermo(d.i_spermo_res ?? d.i_spermo),
    amh,
    afc: num(d.i_cfa) != null ? Math.round(num(d.i_cfa)!) : null,
    prevCycles: prevCycles != null ? Math.max(0, Math.round(prevCycles)) : 0,
    prevOocytes: poor ? 3 : null,
    historyNotes: d.i_amp ?? d.i_hormones ?? "",
  };
}
