import {
  PARTO_ACTION_OFFSET_H,
  PARTO_ALERT_OFFSET_H,
} from "./constants";
import type { PartoCanvasEntry } from "./canvas-types";
import { toHoursFromFirst } from "./canvas-types";

export type ClinicalAlert = {
  level: "red" | "orange" | "green";
  text: string;
  pulse?: boolean;
};

export function computeClinicalAlerts(
  entries: PartoCanvasEntry[],
): ClinicalAlert[] {
  if (!entries.length) return [];

  const alerts: ClinicalAlert[] = [];
  const last = entries[entries.length - 1]!;
  const initDil = Math.max(4, entries[0]!.dil ?? 4);
  const elapsed = toHoursFromFirst(entries, last.time);
  const expectedAlert = initDil + Math.max(0, elapsed - PARTO_ALERT_OFFSET_H);
  const expectedAction = initDil + Math.max(0, elapsed - PARTO_ACTION_OFFSET_H);

  if (last.dil != null && last.dil < 10) {
    if (last.dil < expectedAction && elapsed >= PARTO_ACTION_OFFSET_H) {
      alerts.push({
        level: "red",
        text: "🚨 Ligne d'ACTION franchie — Décision obstétricale requise",
        pulse: true,
      });
    } else if (last.dil < expectedAlert && elapsed >= PARTO_ALERT_OFFSET_H) {
      alerts.push({
        level: "red",
        text: "⚠️ Ligne d'alerte franchie — Réévaluer dans 1h",
        pulse: true,
      });
    }
  }

  for (const e of entries) {
    if (e.bcf && (e.bcf < 110 || e.bcf > 160)) {
      const t = new Date(e.time).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      alerts.push({
        level: "orange",
        text: `⚠️ BCF anormal : ${e.bcf} bpm à ${t}`,
      });
      break;
    }
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
