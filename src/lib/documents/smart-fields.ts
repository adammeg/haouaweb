/**
 * Champs intelligents — calculs automatiques pour les documents.
 */

/** Règle de Naegele : DDR + 280 jours */
export function computeDpaFromDdr(ddr: string): string {
  if (!ddr) return "";
  const d = new Date(ddr);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

/** DDR depuis DPA (inverse Naegele) */
export function computeDdrFromDpa(dpa: string): string {
  if (!dpa) return "";
  const d = new Date(dpa);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() - 280);
  return d.toISOString().slice(0, 10);
}

/** Date fin = date début + N jours */
export function addDays(isoDate: string, days: number): string {
  if (!isoDate || !days) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Jours entre deux dates */
export function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** IMC */
export function computeBmi(weightKg: number, heightCm: number): string {
  if (!weightKg || !heightCm) return "";
  const m = heightCm / 100;
  return (weightKg / (m * m)).toFixed(1);
}

/** SA depuis DDR */
export function gaWeeksFromDdr(ddr: string, refDate = new Date()): number {
  if (!ddr) return 0;
  const d = new Date(ddr);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = refDate.getTime() - d.getTime();
  return Math.max(0, Math.floor(ms / (7 * 86400000)));
}

export function formatGaFromDdr(ddr: string): string {
  const w = gaWeeksFromDdr(ddr);
  if (!w) return "";
  return `${w} SA`;
}

/** Numéro dossier GYN/OBS-YYYY-XXXX */
export function genDossierNumber(spec: "gyn" | "obs" = "gyn"): string {
  const y = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${spec === "obs" ? "OBS" : "GYN"}-${y}-${n}`;
}

export function formatDateFr(iso?: string): string {
  if (!iso) return "……………";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
