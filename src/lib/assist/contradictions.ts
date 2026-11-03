import type { AssistProfile, Contradiction, ScoreOutput } from "./types";
import { RISK } from "./types";

export function detectContradictions(
  scores: ScoreOutput[],
  p: AssistProfile,
): Contradiction[] {
  const m: Record<string, ScoreOutput> = {};
  scores.forEach((s) => {
    m[s.score_name] = s;
  });
  const contras: Contradiction[] = [];
  const add = (
    id: string,
    severity: Contradiction["severity"],
    msg: string,
    sc: string[],
    sug: string,
  ) => contras.push({ rule_id: id, severity, message: msg, scores_involved: sc, suggestion: sug });

  const ohss = m["OHSS_Risk"];
  const amh = p.amh_normalized_pmol;
  if (ohss?.risk_level === RISK.HIGH && amh && amh < 1.0)
    add(
      "R01",
      "warning",
      "OHSS élevé avec AMH très basse : vérifier les entrées et les autres facteurs de risque",
      ["OHSS_Risk", "POSEIDON"],
      "Vérifier unité AMH (pmol/L vs ng/mL) et CFA",
    );

  const pe = m["FMF_PE_FirstTrimester"];
  if (
    pe &&
    (pe.risk_level === RISK.HIGH || pe.risk_level === RISK.CRITICAL) &&
    p.plgf_mom &&
    p.plgf_mom > 1.5
  )
    add(
      "R02",
      "warning",
      `Risque PE élevé + PlGF ÉLEVÉ (${p.plgf_mom} MoM) : atypique`,
      ["FMF_PE_FirstTrimester"],
      "Vérifier valeur PlGF",
    );

  const fgr = m["FGR_Staging"];
  if (
    fgr &&
    (fgr.metadata?.stage as number) >= 3 &&
    (p.gestational_age_weeks ?? 0) < 24
  )
    add(
      "R03",
      "warning",
      `FGR Stade ${fgr.metadata?.stage} avant viabilité`,
      ["FGR_Staging"],
      "Avant 24 SA : centre expert",
    );

  const pos = m["POSEIDON"];
  if (
    pos &&
    ["3", "4"].includes(String(pos.metadata?.group ?? "")) &&
    ohss?.risk_level === RISK.HIGH
  )
    add(
      "R04",
      "warning",
      "Réserve basse et risque OHSS élevé : résultats à rapprocher des facteurs individuels",
      ["POSEIDON", "OHSS_Risk"],
      "Vérifier unités et mesures sans modifier les données pour faire correspondre les scores",
    );

  const roma = m["ROMA"];
  if (
    roma?.risk_level === RISK.HIGH &&
    p.age &&
    p.age < 35 &&
    p.ca125 &&
    p.ca125 < 35
  )
    add(
      "R06",
      "info",
      "ROMA élevé chez patiente <35 ans CA125 bas",
      ["ROMA"],
      "Vérifier le statut ménopausique, la méthode de dosage et les données morphologiques",
    );

  const cpr = m["CPR"];
  if (fgr && fgr.risk_level === RISK.LOW && cpr && cpr.risk_level === RISK.HIGH)
    add(
      "R07",
      "warning",
      "FGR Stade I + CPR pathologique : discordance",
      ["FGR_Staging", "CPR"],
      "Reclasser surveillance intensive",
    );

  if (p.amh_ngml != null && p.amh_pmol != null && Math.abs(p.amh_ngml * 7.14 - p.amh_pmol) > Math.max(0.1, p.amh_pmol * 0.1))
    add("AMH_UNITS", "warning", "Les deux valeurs AMH ne concordent pas après conversion des unités", ["POSEIDON", "OHSS_Risk"], "Vérifier les dates des prélèvements et les unités ng/mL et pmol/L");

  return contras;
}
