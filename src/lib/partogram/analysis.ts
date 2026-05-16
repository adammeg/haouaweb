import type { PartogramSession } from "@/types/modules";

export const PARTO_ALERT_HOURS = 2;
export const PARTO_ACTION_HOURS = 4;

export type PartogramAnalysis = {
  durationStr: string;
  phase: string;
  anomalies: string[];
  decision: string;
  decisionColor: string;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function analyzePartogram(session: PartogramSession): PartogramAnalysis {
  const entries = [...session.points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  if (entries.length === 0) {
    return {
      durationStr: "—",
      phase: "—",
      anomalies: [],
      decision: "Aucune donnee",
      decisionColor: "#6b7280",
    };
  }
  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  const ms = new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const durationStr = h + "h" + (m > 0 ? m + "min" : "");

  let phase = "—";
  if (last.dilatationCm != null) {
    if (last.dilatationCm < 5) phase = "Phase latente";
    else if (last.dilatationCm < 10) phase = "Phase active";
    else phase = "Dilatation complete (10 cm)";
  }

  const anomalies: string[] = [];
  for (const e of entries) {
    const t = formatTime(e.recordedAt);
    if (e.fcf && e.fcf < 110) anomalies.push("Bradycardie (" + e.fcf + ") a " + t);
    if (e.fcf && e.fcf > 160) anomalies.push("Tachycardie (" + e.fcf + ") a " + t);
    if (e.la === "M") anomalies.push("LA meconial a " + t);
    if (e.taSys && e.taSys >= 140)
      anomalies.push("HTA " + e.taSys + "/" + (e.taDia ?? "?") + " a " + t);
    if (e.temp && e.temp >= 38) anomalies.push("Fievre " + e.temp + " a " + t);
  }
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1]!;
    const cur = entries[i]!;
    const dH =
      (new Date(cur.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) /
      3600000;
    if (
      dH >= 2 &&
      cur.dilatationCm === prev.dilatationCm &&
      cur.dilatationCm != null &&
      cur.dilatationCm < 10
    ) {
      anomalies.push(
        "Stagnation " + cur.dilatationCm + " cm pendant >=" + Math.round(dH) + "h",
      );
    }
  }

  const initDil = Math.max(4, first.dilatationCm ?? 4);
  const elapsed =
    (new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) /
    3600000;
  const expAlerte = initDil + Math.max(0, elapsed - PARTO_ALERT_HOURS);
  const expAction = initDil + Math.max(0, elapsed - PARTO_ACTION_HOURS);

  let decision = "Travail en progression normale.";
  let decisionColor = "#16a34a";
  if (
    last.dilatationCm != null &&
    last.dilatationCm < expAction &&
    last.dilatationCm < 10 &&
    elapsed > PARTO_ACTION_HOURS
  ) {
    decision = "LIGNE ACTION — Decision chirurgicale a envisager";
    decisionColor = "#dc2626";
  } else if (
    last.dilatationCm != null &&
    last.dilatationCm < expAlerte &&
    last.dilatationCm < 10 &&
    elapsed > PARTO_ALERT_HOURS
  ) {
    decision = "LIGNE ALERTE — Surveillance rapprochee";
    decisionColor = "#d97706";
  }

  return { durationStr, phase, anomalies, decision, decisionColor };
}
