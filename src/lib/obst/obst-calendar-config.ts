/** Calendrier obstétrical CNGOF/HAS — porté depuis hawaemd_v50 CAL_PLANNING */

export type CalEventType = "consult" | "echo" | "alerte";

export type CalPlanningItem = {
  sa: [number, number];
  trim: 1 | 2 | 3;
  type: CalEventType;
  icon: string;
  titre: string;
  examens: string[];
  vaccins: string[];
  note: string;
};

export const CAL_PLANNING: CalPlanningItem[] = [
  {
    sa: [6, 8],
    trim: 1,
    type: "consult",
    icon: "🩺",
    titre: "1ère consultation prénatale",
    examens: [
      "Groupe sanguin ABO Rh (si inconnu)",
      "NFS plaquettes",
      "Glycémie à jeûn",
      "TPHA-VDRL",
      "VIH (sérologie)",
      "Rubéole (IgG)",
      "Toxoplasmose (IgG/IgM)",
      "CMV (IgG)",
      "ECBU",
      "TSH",
    ],
    vaccins: [],
    note: "Déclaration de grossesse obligatoire avant 15 SA.",
  },
  {
    sa: [11, 13],
    trim: 1,
    type: "echo",
    icon: "🔬",
    titre: "Échographie T1 — 11–13 SA+6",
    examens: [
      "Clarté nucale (marqueur T21)",
      "Mesure LCC",
      "Dépistage T21 combiné (β-hCG libre + PAPP-A)",
    ],
    vaccins: [],
    note: "Dépistage T21 combiné du 1er trimestre. Résultats sous 10 jours.",
  },
  {
    sa: [12, 14],
    trim: 1,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 12–14 SA",
    examens: [
      "Résultats dépistage T21",
      "Résultats sérologies",
      "Supplémentation fer + folates si indiqué",
    ],
    vaccins: [],
    note: "Vérifier la prise d'acide folique et discuter du résultat T21.",
  },
  {
    sa: [16, 18],
    trim: 2,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 2ème trimestre — 16–18 SA",
    examens: [
      "NFS",
      "Toxoplasmose (si IgG négatif)",
      "TP/TCA (si indiqué)",
      "Bandelette urinaire",
    ],
    vaccins: ["💉 Vaccin coqueluche (dTcaP) — à partir de 20 SA"],
    note: "Prescrire HGPO entre 24–28 SA si facteurs de risque DG.",
  },
  {
    sa: [22, 24],
    trim: 2,
    type: "echo",
    icon: "🔬",
    titre: "Échographie T2 — morphologique 22–24 SA",
    examens: [
      "Morphologie fœtale complète",
      "Biométries (BIP, PC, PA, LF)",
      "Localisation placentaire",
      "Doppler si indiqué",
      "Longueur cervicale (risque MAP)",
    ],
    vaccins: [],
    note: "Échographie la plus importante. Dépistage malformations fœtales.",
  },
  {
    sa: [26, 28],
    trim: 2,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 26–28 SA",
    examens: [
      "HGPO 75g (glycémie 0h/1h/2h)",
      "NFS",
      "Groupe Rh + RAI",
      "Bandelette urinaire",
      "Albuminurie si HTA",
    ],
    vaccins: [
      "💉 Vaccin grippe (si saison)",
      "💉 Immunoglobulines anti-D 300µg si Rh−",
    ],
    note: "HGPO obligatoire si facteurs de risque DG (IMC>25, ATCD, âge>35).",
  },
  {
    sa: [30, 32],
    trim: 3,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 30–32 SA",
    examens: [
      "NFS plaquettes",
      "Toxoplasmose (si séronégative)",
      "Bandelette urinaire",
      "TA + poids",
      "Mouvements actifs fœtaux (MAF)",
    ],
    vaccins: ["💉 Vaccin coqueluche (dTcaP) — si non fait"],
    note: "Vérifier position fœtale. Prescrire anesthésie prénatale.",
  },
  {
    sa: [32, 34],
    trim: 3,
    type: "echo",
    icon: "🔬",
    titre: "Échographie T3 — 32–34 SA",
    examens: [
      "Biométries fœtales (croissance)",
      "Index de liquide amniotique (ILA)",
      "Position fœtale",
      "Score biophysique de Manning",
      "Doppler ombilical et cérébral si RCIU",
    ],
    vaccins: [],
    note: "Dépistage RCIU et anomalies de position. Pronostic accouchement.",
  },
  {
    sa: [36, 38],
    trim: 3,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 36–38 SA",
    examens: [
      "Prélèvement vaginal Streptocoque B (SGB)",
      "NFS",
      "RAI",
      "Bilan pré-partum (TP, TCA, groupage)",
      "Bandelette urinaire",
    ],
    vaccins: [],
    note: "Prélèvement SGB obligatoire. Discuter voie d'accouchement.",
  },
  {
    sa: [39, 40],
    trim: 3,
    type: "consult",
    icon: "🩺",
    titre: "Consultation 39–40 SA — pré-partum",
    examens: [
      "TA + poids + MAF",
      "Bilan pré-partum complet si CS prévue",
      "Monitoring CTG si terme > 39 SA",
    ],
    vaccins: [],
    note: "Surveillance rapprochée. Déclenchement à discuter si post-terme.",
  },
  {
    sa: [41, 41],
    trim: 3,
    type: "alerte",
    icon: "⚠️",
    titre: "41 SA — Surveillance post-terme",
    examens: [
      "Monitoring CTG biquotidien",
      "Échographie (ILA + score Manning)",
      "Déclenchement à discuter",
    ],
    vaccins: [],
    note:
      "CNGOF : déclenchement recommandé entre 41 et 41+6 SA pour éviter mort fœtale in utero.",
  },
];

export type CalEventStatus = "past" | "current" | "future";

export type CalTimelineEvent = CalPlanningItem & {
  saCible: number;
  dateEvt: Date;
  dateLimite: Date;
  status: CalEventStatus;
};

export type ObstCalendarSummary = {
  ddr: Date;
  dpa: Date;
  saCurrent: number;
  trimLabel: string;
  daysUntilDpa: number;
};

const TRIM_NAMES: Record<1 | 2 | 3, string> = {
  1: "🔵 1er Trimestre — S1 à S14",
  2: "🟢 2ème Trimestre — S15 à S28",
  3: "🟠 3ème Trimestre — S29 à S41",
};

export function parseTermeSa(terme?: string): number | null {
  if (!terme) return null;
  const m = terme.match(/(\d+)\s*SA/i);
  return m ? parseInt(m[1]!, 10) : null;
}

export function calcDdrFromSa(sa: number, ref = new Date()): string {
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);
  const ddr = new Date(today.getTime() - sa * 7 * 86400000);
  return ddr.toISOString().split("T")[0] ?? "";
}

export function buildObstCalendar(ddrIso: string): {
  summary: ObstCalendarSummary | null;
  events: CalTimelineEvent[];
} {
  if (!ddrIso) return { summary: null, events: [] };

  const ddr = new Date(ddrIso + "T00:00:00");
  if (Number.isNaN(ddr.getTime())) return { summary: null, events: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dpa = new Date(ddr.getTime() + 280 * 86400000);
  const saCurrent = Math.floor((today.getTime() - ddr.getTime()) / (7 * 86400000));
  const daysUntilDpa = Math.ceil((dpa.getTime() - today.getTime()) / 86400000);

  const trimLabel =
    saCurrent <= 14
      ? "1er Trimestre"
      : saCurrent <= 28
        ? "2ème Trimestre"
        : "3ème Trimestre";

  const summary: ObstCalendarSummary = {
    ddr,
    dpa,
    saCurrent: Math.max(0, saCurrent),
    trimLabel,
    daysUntilDpa,
  };

  const events: CalTimelineEvent[] = CAL_PLANNING.map((item) => {
    const saCible = item.sa[0];
    const dateEvt = new Date(ddr.getTime() + saCible * 7 * 86400000);
    const dateLimite = new Date(ddr.getTime() + item.sa[1] * 7 * 86400000);
    const isPast = dateEvt < today && saCurrent > item.sa[1];
    const isCurrent = saCurrent >= item.sa[0] && saCurrent <= item.sa[1];
    const status: CalEventStatus = isPast ? "past" : isCurrent ? "current" : "future";

    return { ...item, saCible, dateEvt, dateLimite, status };
  });

  return { summary, events };
}

export function trimSeparatorLabel(trim: 1 | 2 | 3): string {
  return TRIM_NAMES[trim];
}

export function formatCalDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const CAL_TYPE_LABELS: Record<CalEventType, string> = {
  consult: "Consultation",
  echo: "Échographie",
  alerte: "Alerte",
};
