import type { ScoreResult } from "./types";

export type GeuHemody = "stable" | "instable" | "choc";
export type GeuSiu = "non_visible" | "visible";
export type GeuMasse = "non_visible" | "visible";

export interface GEUInput {
  bhcg: number;
  bhcgJ2: number;
  siu: GeuSiu;
  masse: GeuMasse;
  diamMm: number;
  cardiacActivity: boolean;
  hemody: GeuHemody;
  bodySurface: number;
}

export const GEU_DEFAULT: GEUInput = {
  bhcg: 0,
  bhcgJ2: 0,
  siu: "non_visible",
  masse: "visible",
  diamMm: 0,
  cardiacActivity: false,
  hemody: "stable",
  bodySurface: 1.7,
};

export function calcGEU(input: GEUInput): ScoreResult | null {
  const { bhcg, bhcgJ2, hemody } = input;
  const doublement =
    bhcgJ2 > 0 && bhcg > 0
      ? Math.round(((bhcgJ2 - bhcg) / bhcg) * 100)
      : null;

  if (hemody === "instable" || hemody === "choc") {
    return {
      value: "Chirurgie urgence",
      raw: 0,
      max: 1,
      level: "critical",
      label: "Chirurgie en urgence absolue",
      interpretation:
        "Instabilité hémodynamique → laparoscopie/laparotomie d'hémostase immédiate. 2 VVP + remplissage + groupe-RAI en urgence.",
      details: bhcg > 0 ? [{ label: "βhCG J0", value: `${bhcg} UI/L` }] : undefined,
    };
  }

  const criteresMTX = {
    bhcgOk: bhcg < 5000,
    siuOk: input.siu !== "visible",
    masseOk: input.diamMm < 35 || input.masse === "non_visible",
    acOk: !input.cardiacActivity,
    hemOk: hemody === "stable",
  };
  const eligibleMTX = Object.values(criteresMTX).every(Boolean);
  const doseMTX = Math.round(50 * input.bodySurface);

  if (bhcg < 1000 && doublement !== null && doublement < 0) {
    return {
      value: "Expectative",
      raw: bhcg,
      max: 5000,
      level: "medium",
      label: "Expectative possible",
      interpretation: `βhCG ${bhcg} UI/L déclinant (${doublement}%). Surveillance βhCG toutes 48 h jusqu'à négativation.`,
    };
  }

  if (eligibleMTX) {
    return {
      value: `MTX ${doseMTX} mg`,
      raw: doseMTX,
      max: doseMTX,
      level: "low",
      label: "MTX dose unique éligible",
      interpretation: `Méthotrexate ${doseMTX} mg IM (50 mg/m² × SC ${input.bodySurface} m²). Suivi βhCG J4 et J7. Succès si chute ≥ 15% entre J4 et J7.`,
      details: bhcg > 0 ? [{ label: "βhCG J0", value: `${bhcg} UI/L` }] : undefined,
    };
  }

  const reasons: string[] = [];
  if (!criteresMTX.bhcgOk) reasons.push(`βhCG ${bhcg} ≥ 5000`);
  if (!criteresMTX.siuOk) reasons.push("SIU visible");
  if (!criteresMTX.masseOk) reasons.push(`Masse ${input.diamMm} mm ≥ 35`);
  if (!criteresMTX.acOk) reasons.push("Activité cardiaque présente");

  return {
    value: "Chirurgie",
    raw: reasons.length,
    max: 4,
    level: "high",
    label: "Chirurgie recommandée",
    interpretation: `Critères MTX non remplis : ${reasons.join(" ; ")}. Laparoscopie : salpingotomie ou salpingectomie.`,
    details: bhcg > 0 ? [{ label: "βhCG J0", value: `${bhcg} UI/L` }] : undefined,
  };
}
