/**
 * Classifications FIGO (col, endomètre, ovaire).
 * Port fidèle de v50 `FIGO_DATA` + `renderFIGO` (lignes 22264–22346),
 * en pur TypeScript (le rendu est délégué au composant React).
 */

export type FigoType = "col" | "endo" | "ovaire";

export interface FigoStageInfo {
  desc: string;
  /** Ordre de grandeur indicatif, non sourcé ; absent quand aucune valeur fiable n'est disponible. */
  surv5?: string;
  pec: string;
}

export const FIGO_DATA: Record<FigoType, Record<string, FigoStageInfo>> = {
  col: {
    IA1: {
      desc: "Invasion stromale ≤ 3 mm",
      surv5: "> 98%",
      pec: "Conisation ± lymphadénectomie sentinelle",
    },
    IA2: {
      desc: "Invasion stromale > 3 mm et ≤ 5 mm",
      surv5: "> 95%",
      pec: "Trachélectomie ou hystérectomie simple + sentinelle",
    },
    IB1: {
      desc: "Tumeur ≤ 2 cm, limitée au col",
      surv5: "90–95%",
      pec: "Chirurgie radicale ou radio-chimiothérapie",
    },
    IB2: {
      desc: "Tumeur > 2 cm et ≤ 4 cm, limitée au col",
      surv5: "80–85%",
      pec: "Radio-chimiothérapie concomitante ou chirurgie",
    },
    IB3: {
      desc: "Tumeur > 4 cm, limitée au col",
      surv5: "70–75%",
      pec: "Radio-chimiothérapie concomitante (cisplatine)",
    },
    IIA1: {
      desc: "Extension vaginale sup., tumeur ≤ 4 cm",
      surv5: "75–80%",
      pec: "Chirurgie ou radio-chimiothérapie",
    },
    IIA2: {
      desc: "Extension vaginale sup., tumeur > 4 cm",
      surv5: "65–70%",
      pec: "Radio-chimiothérapie concomitante",
    },
    IIB: {
      desc: "Extension paramétriale sans atteinte paroi",
      surv5: "60–65%",
      pec: "Radio-chimiothérapie concomitante",
    },
    IIIA: {
      desc: "Extension au tiers inférieur du vagin",
      surv5: "40–50%",
      pec: "Radio-chimiothérapie + curiethérapie",
    },
    IIIB: {
      desc: "Extension à la paroi pelvienne et/ou hydronéphrose",
      surv5: "30–40%",
      pec: "Radio-chimiothérapie + curiethérapie",
    },
    IIIC1: {
      desc: "Métastases ganglionnaires pelviennes",
      surv5: "40–50%",
      pec: "Radio-chimiothérapie étendue",
    },
    IIIC2: {
      desc: "Métastases ganglionnaires para-aortiques",
      surv5: "25–35%",
      pec: "Radiothérapie étendue + chimiothérapie",
    },
    IVA: {
      desc: "Envahissement vessie ou rectum",
      surv5: "15–20%",
      pec: "Radio-chimiothérapie palliative ± chirurgie exentération",
    },
    IVB: {
      desc: "Métastases à distance",
      surv5: "< 10%",
      pec: "Chimiothérapie palliative (cisplatine + paclitaxel ± bévacizumab)",
    },
  },
  // FIGO 2023 (Berek et al.). Types « non agressifs » : endométrioïde de bas grade (grades 1–2).
  // Types « agressifs » : endométrioïde de grade 3, séreux, à cellules claires, carcinosarcome, indifférencié, mixte.
  endo: {
    IA1: {
      desc: "Type non agressif limité à un polype endométrial ou confiné à l'endomètre",
      pec: "Chirurgie : hystérectomie totale avec annexectomie bilatérale et évaluation ganglionnaire selon le risque. Traitement adjuvant selon le groupe de risque (ESGO/ESTRO/ESP).",
    },
    IA2: {
      desc: "Type non agressif envahissant moins de 50 % du myomètre, sans emboles lymphovasculaires ou avec emboles focaux",
      pec: "Chirurgie avec évaluation ganglionnaire (ganglion sentinelle). Traitement adjuvant selon le groupe de risque.",
    },
    IA3: {
      desc: "Carcinome endométrioïde de bas grade limité à l'utérus et à l'ovaire (atteinte ovarienne synchrone de bon pronostic, sous conditions strictes)",
      pec: "Chirurgie ; pas de traitement adjuvant si tous les critères de bon pronostic sont réunis. Décision en RCP.",
    },
    IB: {
      desc: "Type non agressif envahissant 50 % ou plus du myomètre, sans emboles lymphovasculaires ou avec emboles focaux",
      pec: "Chirurgie avec évaluation ganglionnaire. Traitement adjuvant (curiethérapie ou radiothérapie) selon le groupe de risque.",
    },
    IC: {
      desc: "Type agressif limité à un polype ou confiné à l'endomètre",
      pec: "Chirurgie avec stadification complète. Traitement adjuvant à discuter en RCP.",
    },
    IIA: {
      desc: "Type non agressif avec invasion du stroma cervical",
      pec: "Chirurgie avec évaluation ganglionnaire. Radiothérapie adjuvante selon le groupe de risque.",
    },
    IIB: {
      desc: "Type non agressif avec emboles lymphovasculaires substantiels",
      pec: "Chirurgie avec évaluation ganglionnaire. Traitement adjuvant selon le groupe de risque.",
    },
    IIC: {
      desc: "Type agressif avec atteinte myométriale, quelle qu'en soit la profondeur",
      pec: "Chirurgie avec stadification complète. Traitement adjuvant (chimiothérapie ± radiothérapie) en RCP.",
    },
    IIIA1: {
      desc: "Extension à l'ovaire ou à la trompe (hors critères du stade IA3)",
      pec: "Chirurgie puis traitement adjuvant systémique ± radiothérapie, en RCP.",
    },
    IIIA2: {
      desc: "Atteinte de la sous-séreuse ou de la séreuse utérine",
      pec: "Chirurgie puis traitement adjuvant systémique ± radiothérapie, en RCP.",
    },
    IIIB1: {
      desc: "Métastase ou extension directe au vagin et/ou aux paramètres",
      pec: "Stratégie multimodale (chirurgie si résection complète possible, radiothérapie, traitement systémique), en RCP.",
    },
    IIIB2: {
      desc: "Métastase au péritoine pelvien",
      pec: "Stratégie multimodale, en RCP.",
    },
    IIIC1: {
      desc: "Métastases ganglionnaires pelviennes (IIIC1i micrométastase, IIIC1ii macrométastase)",
      pec: "Chirurgie puis traitement adjuvant systémique et radiothérapie, en RCP.",
    },
    IIIC2: {
      desc: "Métastases ganglionnaires para-aortiques jusqu'aux vaisseaux rénaux, avec ou sans atteinte pelvienne (IIIC2i micrométastase, IIIC2ii macrométastase)",
      pec: "Chirurgie puis traitement adjuvant systémique et radiothérapie étendue, en RCP.",
    },
    IVA: {
      desc: "Invasion de la muqueuse vésicale et/ou intestinale",
      pec: "Traitement systémique ± radiothérapie ; chirurgie dans des cas sélectionnés. RCP.",
    },
    IVB: {
      desc: "Métastases péritonéales abdominales au-delà du pelvis",
      pec: "Traitement systémique ; chirurgie de cytoréduction si résection complète envisageable. RCP.",
    },
    IVC: {
      desc: "Métastases à distance, y compris ganglions extra-abdominaux ou intra-abdominaux au-dessus des vaisseaux rénaux, poumon, foie, cerveau, os",
      pec: "Traitement systémique (chimiothérapie ± immunothérapie selon le profil moléculaire) ; soins de support. RCP.",
    },
  },
  ovaire: {
    IA: {
      desc: "Tumeur limitée à un ovaire, capsule intacte, pas d'ascite",
      surv5: "> 90%",
      pec: "Chirurgie de stadification ± chimiothérapie selon grade",
    },
    IB: {
      desc: "Tumeur limitée aux deux ovaires, capsule intacte",
      surv5: "85–90%",
      pec: "Chirurgie de stadification ± chimiothérapie",
    },
    IC1: {
      desc: "Rupture chirurgicale per-opératoire",
      surv5: "80–85%",
      pec: "Chirurgie + chimiothérapie adjuvante",
    },
    IC2: {
      desc: "Rupture pré-opératoire ou végétations",
      surv5: "75–80%",
      pec: "Chirurgie + chimiothérapie (carboplatine + paclitaxel)",
    },
    IC3: {
      desc: "Cellules malignes dans le liquide d'ascite",
      surv5: "70–75%",
      pec: "Chirurgie + chimiothérapie",
    },
    IIA: {
      desc: "Extension et/ou implants sur utérus et/ou trompes",
      surv5: "70–75%",
      pec: "Chirurgie cytoreductrice + chimiothérapie",
    },
    IIB: {
      desc: "Extension autres organes pelviens",
      surv5: "60–65%",
      pec: "Chirurgie cytoreductrice + chimiothérapie",
    },
    IIIA1: {
      desc: "Ganglions rétropéritonéaux positifs seuls",
      surv5: "55–65%",
      pec: "Chirurgie + chimiothérapie à base de platine",
    },
    IIIA2: {
      desc: "Implants microscopiques extra-pelviens",
      surv5: "40–50%",
      pec: "Chirurgie d'intervalle + chimiothérapie",
    },
    IIIB: {
      desc: "Métastases péritonéales ≤ 2 cm",
      surv5: "35–45%",
      pec: "Chirurgie cytoreductrice maximale + chimiothérapie",
    },
    IIIC: {
      desc: "Métastases péritonéales > 2 cm",
      surv5: "25–35%",
      pec: "Chirurgie ± chimiothérapie néoadjuvante",
    },
    IVA: {
      desc: "Épanchement pleural avec cytologie positive",
      surv5: "15–25%",
      pec: "Chimiothérapie néoadjuvante + chirurgie d'intervalle",
    },
    IVB: {
      desc: "Métastases parenchymateuses ou extra-abdominales",
      surv5: "< 15%",
      pec: "Chimiothérapie palliative ± chirurgie de réduction",
    },
  },
};

export const FIGO_LABELS: Record<FigoType, string> = {
  col: "Col de l'utérus (FIGO 2018)",
  endo: "Endomètre (FIGO 2023)",
  ovaire: "Ovaire (FIGO 2014)",
};

export function figoRoman(
  stade: string,
): "I" | "II" | "III" | "IV" {
  if (stade.startsWith("IV")) return "IV";
  if (stade.startsWith("III")) return "III";
  if (stade.startsWith("II")) return "II";
  return "I";
}

export const FIGO_COLORS: Record<
  "I" | "II" | "III" | "IV",
  { bg: string; border: string; text: string }
> = {
  I: { bg: "rgba(220,252,231,0.5)", border: "#166534", text: "#166534" },
  II: { bg: "rgba(254,243,199,0.5)", border: "#92400e", text: "#92400e" },
  III: { bg: "rgba(254,226,226,0.5)", border: "#dc2626", text: "#dc2626" },
  IV: { bg: "rgba(252,231,243,0.5)", border: "#9d174d", text: "#9d174d" },
};
