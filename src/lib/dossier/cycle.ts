/** Repères du cycle en cours, calculés depuis la DDR et la durée habituelle du cycle (anamnèse commune). */
export type CycleStatus = {
  /** Jour du cycle (J1 = premier jour des règles). */
  day: number;
  /** Jours de retard par rapport au cycle habituel, 0 si pas de retard. */
  lateBy: number;
  usual: number | null;
};

export function cycleStatus(ddr: string | undefined, usualCycle: string | undefined, today = new Date()): CycleStatus | null {
  const start = new Date(ddr ?? "");
  if (Number.isNaN(start.getTime())) return null;
  const t = new Date(today.toISOString().slice(0, 10));
  const day = Math.floor((t.getTime() - start.getTime()) / 86400000) + 1;
  if (day < 1 || day > 400) return null;
  const n = parseInt(usualCycle ?? "", 10);
  const usual = Number.isFinite(n) && n >= 15 && n <= 90 ? n : null;
  return { day, usual, lateBy: usual && day > usual ? day - usual : 0 };
}

export const CYCLE_SYMPTOMS = [
  "Douleurs pelviennes",
  "Syndrome prémenstruel",
  "Mastodynie",
  "Dyspareunie",
  "Troubles urinaires",
  "Troubles digestifs cycliques",
  "Bouffées de chaleur",
  "Galactorrhée",
  "Acné ou hirsutisme",
] as const;

export const LEUCO_SIGNS = ["Prurit", "Brûlures", "Mauvaise odeur"] as const;

/** Liste stockée sous forme de texte séparé par des virgules (champ simple, lisible par Hawae et le PDF). */
export const splitList = (v?: string) =>
  (v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const toggleInList = (v: string | undefined, item: string) => {
  const list = splitList(v);
  return (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]).join(", ");
};
