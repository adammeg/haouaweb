import type { ScoreResult } from "./types";

export function calcLUS(mm: number): ScoreResult | null {
  if (!mm || mm <= 0) return null;

  if (mm >= 3.5) {
    return {
      value: `${mm} mm`,
      raw: mm,
      max: 6,
      level: "low",
      label: "LUS favorable",
      interpretation:
        `LUS ${mm} mm — épaisseur satisfaisante. Risque déhiscence < 1%. AVAC autorisé sous réserve des autres critères (Score Flamm ≥ 5). [CNGOF 2020]`,
    };
  }
  if (mm >= 2.5) {
    return {
      value: `${mm} mm`,
      raw: mm,
      max: 6,
      level: "medium",
      label: "LUS zone grise",
      interpretation:
        `LUS ${mm} mm — zone d'incertitude (risque 1–3%). Discussion individualisée en RCP. [Rozenberg 2016]`,
    };
  }
  if (mm >= 1.5) {
    return {
      value: `${mm} mm`,
      raw: mm,
      max: 6,
      level: "high",
      label: "LUS défavorable",
      interpretation:
        `LUS ${mm} mm — épaisseur insuffisante (risque 3–4%). Césarienne programmée fortement recommandée. [CNGOF 2020]`,
    };
  }
  return {
    value: `${mm} mm`,
    raw: mm,
    max: 6,
    level: "critical",
    label: "LUS critique",
    interpretation:
      `LUS ${mm} mm — risque rupture > 5%. Césarienne programmée impérative. Contre-indication formelle à l'AVAC.`,
  };
}
