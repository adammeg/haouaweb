import type { PartogramPoint } from "@/types/modules";
import type { PartoCanvasEntry } from "./canvas-types";
import { evaluateLabour } from "./rules";

export type ClinicalAlert = {
  level: "red" | "orange" | "green";
  text: string;
  pulse?: boolean;
};

export function computeClinicalAlerts(points: PartogramPoint[]): ClinicalAlert[] {
  if (!points.length) return [];

  const alerts: ClinicalAlert[] = [];
  const evaluation = evaluateLabour(points);

  if (evaluation.progress === "action") {
    alerts.push({
      level: "red",
      text: "🚨 Ligne d'ACTION franchie — Décision obstétricale requise",
      pulse: true,
    });
  } else if (evaluation.progress === "alerte") {
    alerts.push({
      level: "orange",
      text: "⚠️ Ligne d'alerte franchie — Réévaluation et surveillance rapprochée",
    });
  }

  for (const f of evaluation.findings) {
    alerts.push({
      level: f.level,
      text: (f.level === "red" ? "🚨 " : "⚠️ ") + f.text,
      pulse: f.level === "red",
    });
  }

  if (!alerts.length) {
    alerts.push({
      level: "green",
      text: "✓ Surveillance en cours — pas d'alerte active",
    });
  }

  return alerts;
}

export type PartoInfoStrip = {
  admission: string;
  dilInit: string;
  duree: string;
  phase: string;
};

export function computeInfoStrip(entries: PartoCanvasEntry[]): PartoInfoStrip {
  if (!entries.length) {
    return {
      admission: "—",
      dilInit: "—",
      duree: "—",
      phase: "—",
    };
  }
  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  const ms = new Date(last.time).getTime() - new Date(first.time).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const dil = last.dil;
  let phase = "—";
  if (dil != null) {
    if (dil < 4) phase = "Latente";
    else if (dil < 10) phase = "Active";
    else phase = "Complète (10 cm)";
  }
  return {
    admission: "—",
    dilInit: (first.dil ?? "—") + " cm",
    duree: h + "h" + (m ? m + "min" : ""),
    phase,
  };
}
