import type { ScoreResult } from "./types";

/** Aide à l'orientation d'une GEU tubaire — critères CNGOF / ACOG PB 193. */

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
  masse: "non_visible",
  diamMm: 0,
  cardiacActivity: false,
  hemody: "stable",
  bodySurface: 1.7,
};

export function calcGEU(input: GEUInput): ScoreResult | null {
  const { bhcg, bhcgJ2, hemody } = input;
  const bhcgDetail = bhcg > 0 ? [{ label: "βhCG J0", value: `${bhcg} UI/L` }] : undefined;

  if (hemody === "instable" || hemody === "choc") {
    return {
      value: "Chirurgie urgence",
      raw: 0,
      max: 1,
      level: "critical",
      label: "Chirurgie en urgence absolue",
      interpretation:
        "Instabilité hémodynamique → cœlioscopie ou laparotomie d'hémostase immédiate. 2 voies veineuses, remplissage, groupe-RAI en urgence.",
      details: bhcgDetail,
    };
  }

  if (input.siu === "visible") {
    return {
      value: "GIU visible",
      raw: 0,
      max: 1,
      level: "medium",
      label: "Sac intra-utérin visible — GEU peu probable",
      interpretation:
        "Une grossesse intra-utérine est visible : ni méthotrexate ni chirurgie tubaire. Vérifier qu'il s'agit d'un vrai sac gestationnel (vésicule vitelline ou embryon). Évoquer une grossesse hétérotopique en cas de masse annexielle, de douleur ou de grossesse obtenue par AMP.",
      details: bhcgDetail,
    };
  }

  if (!bhcg || bhcg <= 0) return null;

  const variation =
    bhcgJ2 > 0 ? Math.round(((bhcgJ2 - bhcg) / bhcg) * 100) : null;
  const masseVisible = input.masse === "visible";

  if (bhcg < 1000 && variation !== null && variation < 0 && !input.cardiacActivity) {
    return {
      value: "Expectative",
      raw: bhcg,
      max: 5000,
      level: "medium",
      label: "Expectative possible",
      interpretation: `βhCG ${bhcg} UI/L en décroissance (${variation} % en 48 h), patiente stable et peu symptomatique : surveillance de la βhCG toutes les 48 h jusqu'à négativation, avec information sur les signes d'alerte.`,
      details: bhcgDetail,
    };
  }

  if (!masseVisible) {
    return {
      value: "GLI",
      raw: bhcg,
      max: 5000,
      level: "medium",
      label: "Grossesse de localisation indéterminée",
      interpretation: `Ni sac intra-utérin ni masse annexielle visibles (βhCG ${bhcg} UI/L${variation !== null ? `, variation ${variation > 0 ? "+" : ""}${variation} % en 48 h` : ""}). Pas de méthotrexate sans diagnostic : répéter βhCG à 48 h et échographie endovaginale.`,
      details: bhcgDetail,
    };
  }

  const reasons: string[] = [];
  if (bhcg >= 5000) reasons.push(`βhCG ${bhcg} UI/L ≥ 5 000`);
  if (input.diamMm >= 35) reasons.push(`Masse ${input.diamMm} mm ≥ 35 mm`);
  if (input.cardiacActivity) reasons.push("Activité cardiaque embryonnaire");

  if (reasons.length === 0) {
    const doseMTX = Math.round(50 * input.bodySurface);
    return {
      value: `MTX ${doseMTX} mg`,
      raw: doseMTX,
      max: doseMTX,
      level: "medium",
      label: "Critères de traitement médical remplis",
      interpretation: `Méthotrexate IM en dose unique envisageable : ${doseMTX} mg (50 mg/m² × ${input.bodySurface} m²) ou 1 mg/kg selon le protocole. <strong>Avant injection</strong> : NFS, créatinine, transaminases normales ; pas d'allaitement, d'immunodépression, d'hépatopathie ni d'insuffisance rénale ; patiente observante et informée. Contrôle de la βhCG à J4 et J7 : baisse ≥ 15 % attendue entre J4 et J7.`,
      details: bhcgDetail,
    };
  }

  return {
    value: "Chirurgie",
    raw: reasons.length,
    max: 3,
    level: "high",
    label: "Traitement chirurgical à privilégier",
    interpretation: `Critères du traitement médical non remplis : ${reasons.join(" ; ")}. Cœlioscopie : salpingotomie ou salpingectomie selon l'état de la trompe controlatérale et le désir de grossesse.`,
    details: bhcgDetail,
  };
}
