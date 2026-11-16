import type { ScoreResult } from "./types";

/**
 * Épaisseur échographique du segment inférieur sur utérus cicatriciel.
 * Aucun seuil décisionnel n'est validé (CNGOF 2012) : repère de Rozenberg 1996 (3,5 mm) à titre informatif.
 */
export function calcLUS(mm: number): ScoreResult | null {
  if (!mm || mm <= 0) return null;

  const caveat =
    "Aucun seuil n'est validé et le CNGOF 2012 ne recommande pas de fonder le choix de la voie d'accouchement sur cette seule mesure.";

  if (mm >= 3.5) {
    return {
      value: `${mm} mm`,
      raw: mm,
      max: 6,
      level: "low",
      label: "Segment inférieur ≥ 3,5 mm",
      interpretation: `Épaisseur ${mm} mm : au-dessus du repère de 3,5 mm, le risque de défect de la cicatrice était faible dans l'étude de Rozenberg (1996). ${caveat}`,
    };
  }
  if (mm >= 2.5) {
    return {
      value: `${mm} mm`,
      raw: mm,
      max: 6,
      level: "medium",
      label: "Segment inférieur 2,5–3,4 mm",
      interpretation: `Épaisseur ${mm} mm : sous le repère de 3,5 mm (Rozenberg 1996). Élément à intégrer à l'évaluation globale (antécédents, type de cicatrice, souhait de la patiente). ${caveat}`,
    };
  }
  return {
    value: `${mm} mm`,
    raw: mm,
    max: 6,
    level: "high",
    label: "Segment inférieur fin (< 2,5 mm)",
    interpretation: `Épaisseur ${mm} mm : segment inférieur fin, associé à un risque accru de défect de la cicatrice. Discussion de la voie d'accouchement en équipe et avec la patiente. ${caveat}`,
  };
}
