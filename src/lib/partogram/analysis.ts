import type { PartogramSession } from "@/types/modules";
import {
  PARTO_ACTION_OFFSET_H,
  PARTO_ALERT_OFFSET_H,
} from "./constants";
import { evaluateLabour, PHASE_LABELS, sortPoints } from "./rules";

export { PARTO_ALERT_OFFSET_H, PARTO_ACTION_OFFSET_H };

export type PartogramAnalysis = {
  durationStr: string;
  phase: string;
  anomalies: string[];
  decision: string;
  decisionColor: string;
};

export function analyzePartogram(session: PartogramSession): PartogramAnalysis {
  const entries = sortPoints(session.points);
  if (entries.length === 0) {
    return {
      durationStr: "—",
      phase: "—",
      anomalies: [],
      decision: "Aucune donnée",
      decisionColor: "#6b7280",
    };
  }
  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  const ms = new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const durationStr = h + "h" + (m > 0 ? m + "min" : "");

  const evaluation = evaluateLabour(entries);
  const anomalies = evaluation.findings.map((f) => f.text);

  let decision = "Pas d'alerte de progression.";
  let decisionColor = "#16a34a";
  if (evaluation.progress === "action") {
    decision = "LIGNE D'ACTION franchie — décision obstétricale requise";
    decisionColor = "#dc2626";
  } else if (evaluation.progress === "alerte") {
    decision = "LIGNE D'ALERTE franchie — réévaluation et surveillance rapprochée";
    decisionColor = "#d97706";
  } else if (evaluation.findings.some((f) => f.level === "red")) {
    decision = "Anomalie sévère signalée — évaluation immédiate";
    decisionColor = "#dc2626";
  } else if (evaluation.phase === "latente") {
    decision = "Phase de latence — les lignes d'alerte ne s'appliquent pas encore.";
    decisionColor = "#6b7280";
  }

  return {
    durationStr,
    phase: PHASE_LABELS[evaluation.phase],
    anomalies,
    decision,
    decisionColor,
  };
}
