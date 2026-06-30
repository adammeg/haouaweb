/**
 * Synthèse clinique automatique — biométrie fœtale.
 */

import { formatGa, PARAM_META } from "./constants";
import { estimatePercentile } from "./percentile-engine";
import type { GrowthMeasure, GrowthParamKey } from "./types";

const BIOMETRY_KEYS: GrowthParamKey[] = ["bip", "pc", "pa", "lf", "pfe"];

/** Génère une phrase de synthèse à partir des dernières mesures */
export function buildGrowthSummary(
  measures: GrowthMeasure[],
): string {
  if (!measures.length) {
    return "Aucune mesure saisie — renseignez une échographie pour obtenir une synthèse.";
  }

  const latest = [...measures].sort((a, b) => b.gaWeeks - a.gaWeeks)[0]!;
  const gaStr = formatGa(latest.gaWeeks);

  const estimates: Array<{
    key: GrowthParamKey;
    value: number;
    pct: number;
    label: string;
  }> = [];

  for (const key of [...BIOMETRY_KEYS, "ila" as GrowthParamKey]) {
    const val = latest[key];
    if (val == null) continue;
    const est = estimatePercentile(key, latest.gaWeeks, val);
    if (est) {
      estimates.push({
        key,
        value: val,
        pct: est.percentile,
        label: PARAM_META[key].shortLabel,
      });
    }
  }

  if (!estimates.length) {
    return `Échographie à ${gaStr} — biométrie incomplète pour l'analyse percentile.`;
  }

  const abnormal = estimates.filter((e) => e.pct < 10 || e.pct > 90);
  const severe = estimates.filter((e) => e.pct < 3 || e.pct > 97);

  const pfeEst = estimates.find((e) => e.key === "pfe");
  const paEst = estimates.find((e) => e.key === "pa");
  const bipEst = estimates.find((e) => e.key === "bip");

  if (severe.length) {
    if (paEst && paEst.pct < 10 && bipEst && bipEst.pct >= 10) {
      return `RCIU asymétrique suspecté — PA au P${paEst.pct}, BIP au P${bipEst.pct} (${gaStr}).`;
    }
    const parts = severe.map((e) => `${e.label} P${e.pct}`).join(", ");
    return `⚠ Anomalie de croissance — ${parts} à ${gaStr}. Surveillance rapprochée recommandée.`;
  }

  if (abnormal.length) {
    const parts = abnormal.map((e) => `${e.label} P${e.pct}`).join(", ");
    return `Surveillance — ${parts} à ${gaStr}. Contrôle échographique à prévoir.`;
  }

  if (pfeEst) {
    return `Biométrie fœtale harmonieuse — PFE au P${pfeEst.pct} (${pfeEst.value}g à ${gaStr}).`;
  }

  const allNormal = estimates.every((e) => e.pct >= 10 && e.pct <= 90);
  if (allNormal) {
    return `Biométrie fœtale harmonieuse — tous les paramètres entre P10 et P90 (${gaStr}).`;
  }

  return `Biométrie à ${gaStr} — ${estimates.map((e) => `${e.label} P${e.pct}`).join(", ")}.`;
}
