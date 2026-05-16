import type { PatientSnapshot } from "@/types/domain";
import {
  computeBiometryPercentile,
  interpSalomon,
  SALOMON_TABLES,
  type SalomonKey,
} from "./salomon";

function num(v?: string): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

const BIOMETRY_LABELS: Record<SalomonKey, string> = {
  bip: "BIP",
  pc: "PC/HC",
  ca: "CA/AC",
  lf: "LF/FL",
  pfe: "PFE",
};

export type T2AnomalyCheck = {
  anomalies: string[];
  warnings: string[];
  level: "clean" | "warn" | "danger";
};

export function checkT2Anomalies(d: PatientSnapshot): T2AnomalyCheck {
  const anom: string[] = [];
  const warn: string[] = [];
  const ag = num(d.t2_ag);

  if (ag) {
    (Object.keys(BIOMETRY_LABELS) as SalomonKey[]).forEach((k) => {
      const fieldKey = ("t2_" + k) as keyof PatientSnapshot;
      const val = num(d[fieldKey] as string | undefined);
      const ref = interpSalomon(SALOMON_TABLES[k], ag);
      if (val && ref) {
        if (val < ref.p5) anom.push(BIOMETRY_LABELS[k] + " < 5e pct");
        if (val > ref.p95) warn.push(BIOMETRY_LABELS[k] + " > 95e pct");
      }
    });
  }

  const atr = num(d.t2_atrium);
  if (atr && atr >= 10) anom.push("Ventriculomégalie (" + atr + " mm)");
  const mag = num(d.t2_cist_magna);
  if (mag && mag > 10) warn.push("Citerne magna > 10 mm");
  if (d.t2_csp === "absent") anom.push("CSP absent");
  if (d.t2_cerv === "anormal") anom.push("Cervelet anormal");
  if (d.t2_profil === "anormal") warn.push("Profil anormal");
  if (d.t2_levres === "fente") anom.push("Fente labio-palatine");
  if (d.t2_situs === "anormal") anom.push("Situs anormal");
  if (d.t2_4cav === "anormal") anom.push("Vue 4 cavités anormale");
  if (d.t2_vej === "anormal") anom.push("Voies d'éjection anormales");
  if (d.t2_3vt === "anormal") anom.push("3VT anormal");
  const fcf = num(d.t2_fcf);
  if (fcf && (fcf < 110 || fcf > 180)) warn.push("FCF hors limites");
  if (d.t2_rythme === "irregulier") warn.push("Rythme irrégulier");
  if (d.t2_estomac === "absent") anom.push("Estomac non visible");
  if (d.t2_paroi === "defect") anom.push("Défect paroi abdominale");
  if (d.t2_reins === "anormal") anom.push("Anomalie rénale");
  const py = num(d.t2_pyelon);
  if (py && py >= 7) anom.push("Pyélectasie ≥ 7 mm");
  else if (py && py >= 4) warn.push("Pyélectasie légère");
  if (d.t2_vessie === "non") anom.push("Vessie non visible");
  if (d.t2_rachis === "anormal") anom.push("Anomalie rachis");
  if (d.t2_membres === "anormal") warn.push("Anomalie membres");
  if (d.t2_placenta_loc === "praevia") anom.push("Placenta praevia");
  else if (d.t2_placenta_loc === "bas") warn.push("Placenta bas inséré");
  const dc = num(d.t2_dist_col);
  if (dc !== null && dc < 20) warn.push("Distance col < 20 mm");

  const level =
    anom.length > 0 ? "danger" : warn.length > 0 ? "warn" : "clean";
  return { anomalies: anom, warnings: warn, level };
}

export type BiometryPercentileRow = {
  key: SalomonKey;
  label: string;
  value: number | null;
  ref: ReturnType<typeof computeBiometryPercentile>;
};

export function getT2Percentiles(d: PatientSnapshot): BiometryPercentileRow[] {
  const ag = num(d.t2_ag);
  if (!ag) return [];
  const keys: SalomonKey[] = ["bip", "pc", "ca", "lf", "pfe"];
  return keys.map((k) => {
    const fieldKey = ("t2_" + k) as keyof PatientSnapshot;
    const value = num(d[fieldKey] as string | undefined);
    return {
      key: k,
      label: BIOMETRY_LABELS[k],
      value,
      ref: value ? computeBiometryPercentile(k, ag, value) : null,
    };
  });
}
