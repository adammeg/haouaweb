import type { PartogramPoint } from "@/types/modules";

/** Entrée normalisée pour le moteur canvas */
export type PartoCanvasEntry = {
  id: string;
  time: string;
  dil: number | null;
  desc: number | null;
  bcf: number | null;
  cxNb: number | null;
  cxDur: number | null;
  cxInt: number | null;
  la: string;
};

export function pointsToCanvasEntries(points: PartogramPoint[]): PartoCanvasEntry[] {
  return [...points]
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    )
    .map((p) => ({
      id: p.id ?? p.recordedAt,
      time: p.recordedAt,
      dil: p.dilatationCm ?? null,
      desc: p.descent ?? null,
      bcf: p.fcf ?? null,
      cxNb: p.cx ?? null,
      cxDur: p.cxDur ?? null,
      cxInt: p.cxInt ?? null,
      la: p.la ?? "C",
    }));
}

export function toHoursFromFirst(entries: PartoCanvasEntry[], iso: string): number {
  if (!entries.length) return 0;
  const t0 = new Date(entries[0]!.time).getTime();
  return (new Date(iso).getTime() - t0) / 3600000;
}
