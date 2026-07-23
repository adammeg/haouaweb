/** Constantes grille OMS — parité HawaeMD v51 / spec clinique */
export const PARTO_MAX_HOURS = 24;
export const PARTO_ALERT_OFFSET_H = 2;
export const PARTO_ACTION_OFFSET_H = 4;

export type SimScenario = "normal" | "dystocie" | "precipite";

export type SimPoint = {
  h: number;
  dil: number;
  desc: number;
  bcf: number;
  cxNb: number;
  cxDur: number;
  cxInt: number;
  la: string;
};

export const PARTO_SCENARIOS: Record<SimScenario, SimPoint[]> = {
  normal: [
    { h: 0, dil: 4, desc: 5, bcf: 145, cxNb: 2, cxDur: 40, cxInt: 2, la: "C" },
    { h: 1, dil: 5, desc: 4, bcf: 142, cxNb: 3, cxDur: 45, cxInt: 2, la: "C" },
    { h: 2.5, dil: 6, desc: 3, bcf: 138, cxNb: 3, cxDur: 50, cxInt: 3, la: "C" },
    { h: 4, dil: 7, desc: 3, bcf: 140, cxNb: 4, cxDur: 55, cxInt: 3, la: "C" },
    { h: 5.5, dil: 8, desc: 2, bcf: 136, cxNb: 4, cxDur: 50, cxInt: 3, la: "C" },
    { h: 7, dil: 9, desc: 1, bcf: 148, cxNb: 5, cxDur: 55, cxInt: 3, la: "C" },
    { h: 8.5, dil: 10, desc: 0, bcf: 152, cxNb: 5, cxDur: 60, cxInt: 3, la: "C" },
    { h: 10, dil: 10, desc: 0, bcf: 145, cxNb: 4, cxDur: 50, cxInt: 2, la: "C" },
  ],
  dystocie: [
    { h: 0, dil: 4, desc: 5, bcf: 140, cxNb: 2, cxDur: 40, cxInt: 2, la: "C" },
    { h: 1, dil: 5, desc: 4, bcf: 138, cxNb: 3, cxDur: 45, cxInt: 2, la: "C" },
    { h: 2.5, dil: 6, desc: 3, bcf: 135, cxNb: 3, cxDur: 50, cxInt: 2, la: "C" },
    { h: 4, dil: 6, desc: 3, bcf: 132, cxNb: 3, cxDur: 45, cxInt: 2, la: "C" },
    { h: 6, dil: 6, desc: 3, bcf: 128, cxNb: 3, cxDur: 50, cxInt: 2, la: "C" },
    { h: 8, dil: 6, desc: 2, bcf: 125, cxNb: 4, cxDur: 55, cxInt: 3, la: "C" },
    { h: 10, dil: 7, desc: 2, bcf: 118, cxNb: 4, cxDur: 50, cxInt: 3, la: "M" },
  ],
  precipite: [
    { h: 0, dil: 5, desc: 4, bcf: 150, cxNb: 4, cxDur: 55, cxInt: 3, la: "C" },
    { h: 0.5, dil: 7, desc: 2, bcf: 155, cxNb: 5, cxDur: 60, cxInt: 3, la: "C" },
    { h: 1, dil: 9, desc: 1, bcf: 158, cxNb: 5, cxDur: 55, cxInt: 3, la: "C" },
    { h: 1.5, dil: 10, desc: 0, bcf: 162, cxNb: 5, cxDur: 50, cxInt: 3, la: "C" },
  ],
};

export function genDossierId(): string {
  const y = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `OBS-${y}-${n}`;
}
