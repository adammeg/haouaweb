import type { PartogramPoint } from "@/types/modules";
import { PARTO_ACTION_OFFSET_H, PARTO_ACTIVE_PHASE_CM } from "./constants";

/**
 * Règles uniques du partogramme (partogramme OMS modifié) :
 * phase active à partir de 4 cm ; ligne d'alerte à 1 cm/h depuis l'entrée en phase active ;
 * ligne d'action 4 h à droite. Utilisées par les alertes en direct, l'analyse et le PDF.
 */

export type LabourFinding = { level: "red" | "orange"; text: string };

export type LabourEvaluation = {
  phase: "latente" | "active" | "complete" | "inconnue";
  progress: "ok" | "alerte" | "action";
  /** Entrée en phase active (première dilatation ≥ 4 cm), ou null. */
  activeStart: { at: string; dil: number } | null;
  findings: LabourFinding[];
};

const HOUR = 3600000;

function hhmm(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / HOUR;
}

function lastWith<T>(points: PartogramPoint[], pick: (p: PartogramPoint) => T | null | undefined) {
  for (let i = points.length - 1; i >= 0; i--) {
    const v = pick(points[i]!);
    if (v != null) return { point: points[i]!, value: v };
  }
  return null;
}

export function sortPoints(points: PartogramPoint[]): PartogramPoint[] {
  return [...points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
}

export function evaluateLabour(rawPoints: PartogramPoint[]): LabourEvaluation {
  const points = sortPoints(rawPoints);
  const findings: LabourFinding[] = [];
  const exams = points.filter((p) => p.dilatationCm != null);
  const lastExam = exams[exams.length - 1];
  const firstActive = exams.find((p) => p.dilatationCm! >= PARTO_ACTIVE_PHASE_CM);
  const activeStart = firstActive
    ? { at: firstActive.recordedAt, dil: firstActive.dilatationCm! }
    : null;

  let phase: LabourEvaluation["phase"] = "inconnue";
  if (lastExam) {
    const dil = lastExam.dilatationCm!;
    phase = dil >= 10 ? "complete" : dil >= PARTO_ACTIVE_PHASE_CM ? "active" : "latente";
  }

  // Progression : jugée au dernier toucher vaginal, uniquement en phase active.
  let progress: LabourEvaluation["progress"] = "ok";
  if (activeStart && lastExam && lastExam.dilatationCm! < 10) {
    const elapsed = hoursBetween(activeStart.at, lastExam.recordedAt);
    const onAlertLine = Math.min(10, activeStart.dil + elapsed);
    const onActionLine = Math.min(10, activeStart.dil + elapsed - PARTO_ACTION_OFFSET_H);
    const dil = lastExam.dilatationCm!;
    if (elapsed >= PARTO_ACTION_OFFSET_H && dil < onActionLine) progress = "action";
    else if (elapsed > 0 && dil < onAlertLine) progress = "alerte";

    // Absence de progression entre deux examens en phase active.
    let since = lastExam;
    for (let i = exams.length - 2; i >= 0; i--) {
      const e = exams[i]!;
      if (e.dilatationCm !== dil || e.dilatationCm! < PARTO_ACTIVE_PHASE_CM) break;
      since = e;
    }
    const stagnation = hoursBetween(since.recordedAt, lastExam.recordedAt);
    if (stagnation >= 2) {
      findings.push({
        level: stagnation >= 4 ? "red" : "orange",
        text: `Dilatation inchangée à ${dil} cm depuis ${Math.round(stagnation * 10) / 10} h`,
      });
    }
  }

  // Rythme cardiaque fœtal : dernier relevé, puis rappel des épisodes antérieurs.
  const fhrPoints = points.filter((p) => p.fcf != null && p.fcf > 0);
  const lastFhr = fhrPoints[fhrPoints.length - 1];
  const abnormal = (v: number) => v < 110 || v > 160;
  if (lastFhr && abnormal(lastFhr.fcf!)) {
    const v = lastFhr.fcf!;
    findings.push({
      level: v < 100 || v > 180 ? "red" : "orange",
      text: `${v < 110 ? "Bradycardie" : "Tachycardie"} fœtale ${v} bpm à ${hhmm(lastFhr.recordedAt)}`,
    });
  }
  const earlier = fhrPoints.filter((p) => p !== lastFhr && abnormal(p.fcf!));
  if (earlier.length) {
    const worst = earlier.reduce((a, b) => (Math.abs(b.fcf! - 135) > Math.abs(a.fcf! - 135) ? b : a));
    findings.push({
      level: "orange",
      text: `${earlier.length} relevé(s) de BCF anormal antérieur(s) (extrême ${worst.fcf} bpm à ${hhmm(worst.recordedAt)})`,
    });
  }

  const la = lastWith(points, (p) => p.la || null);
  if (la && la.value === "M") {
    findings.push({ level: "orange", text: `Liquide amniotique méconial (${hhmm(la.point.recordedAt)})` });
  }

  const bp = lastWith(points, (p) => (p.taSys || p.taDia ? p : null));
  if (bp) {
    const sys = bp.point.taSys ?? 0;
    const dia = bp.point.taDia ?? 0;
    const txt = `${bp.point.taSys ?? "?"}/${bp.point.taDia ?? "?"} mmHg à ${hhmm(bp.point.recordedAt)}`;
    if (sys >= 160 || dia >= 110) findings.push({ level: "red", text: `HTA sévère ${txt}` });
    else if (sys >= 140 || dia >= 90) findings.push({ level: "orange", text: `HTA ${txt}` });
  }

  const temp = lastWith(points, (p) => p.temp ?? null);
  if (temp && temp.value >= 38) {
    findings.push({ level: "orange", text: `Fièvre maternelle ${temp.value} °C à ${hhmm(temp.point.recordedAt)}` });
  }

  return { phase, progress, activeStart, findings };
}

export const PHASE_LABELS: Record<LabourEvaluation["phase"], string> = {
  latente: "Latente (< 4 cm)",
  active: "Active",
  complete: "Complète (10 cm)",
  inconnue: "—",
};
