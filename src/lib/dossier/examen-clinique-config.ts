/** Configuration des puces d'examen clinique — parité hawaemd_v50.html */

export type ExamChipSection = {
  id: string;
  label: string;
  sub?: string;
  chips: string[];
  /** Libellés sélectionnés par défaut à la création */
  defaults?: string[];
};

export const EXAM_CHIP_SECTIONS: ExamChipSection[] = [
  {
    id: "etat_general",
    label: "État général",
    sub: "الحالة العامة",
    chips: [
      "Bon état général",
      "Altéré",
      "Asthénie",
      "Pâleur cutanéo-muqueuse",
      "Ictère",
      "Fièvre",
    ],
    defaults: ["Bon état général"],
  },
  {
    id: "conjonctives",
    label: "Conjonctives",
    sub: "الملتحمات",
    chips: ["Rosées", "Pâles", "Ictériques"],
    defaults: ["Rosées"],
  },
  {
    id: "oedemes",
    label: "Œdèmes",
    sub: "الوذمات",
    chips: ["Absents", "Membres inf.", "Généralisés", "Prenant le godet"],
    defaults: ["Absents"],
  },
  {
    id: "ausc_card",
    label: "Auscultation cardiaque",
    chips: [
      "Rythmé",
      "Régulier",
      "Souffle systolique",
      "Arythmie",
      "Tachycardie",
      "Bradycardie",
    ],
    defaults: ["Rythmé"],
  },
  {
    id: "ausc_pulm",
    label: "Auscultation pulmonaire",
    chips: [
      "Murmure vésiculaire normal",
      "Râles crépitants",
      "Sibilants",
      "Silence aérique",
    ],
    defaults: ["Murmure vésiculaire normal"],
  },
  {
    id: "abdomen",
    label: "Abdomen",
    sub: "البطن",
    chips: [
      "Souple",
      "Sensible",
      "Douloureux",
      "Défense",
      "Contracture",
      "Masse palpable",
      "Cicatrice Pfannenstiel",
    ],
    defaults: ["Souple"],
  },
  {
    id: "uterus_chips",
    label: "Utérus",
    sub: "الرحم",
    chips: [
      "Gravide",
      "Non gravide",
      "Augmenté de volume",
      "Régulier",
      "Irrégulier (fibromes)",
      "Douloureux à la mobilisation",
    ],
    defaults: ["Gravide"],
  },
  {
    id: "annexes",
    label: "Annexes",
    sub: "الزوائد",
    chips: [
      "Libres et indolores",
      "Masse latéro-utérine droite",
      "Masse latéro-utérine gauche",
      "Douleur à la palpation",
    ],
    defaults: ["Libres et indolores"],
  },
  {
    id: "col",
    label: "Col utérin",
    sub: "عنق الرحم",
    chips: [
      "Aspect normal",
      "Ectropion",
      "Polype cervical",
      "Lésion suspecte",
      "Béant",
      "Fermé",
      "Saignement au contact",
    ],
    defaults: ["Aspect normal"],
  },
  {
    id: "vagin",
    label: "Vagin / Pertes",
    sub: "الإفرازات",
    chips: [
      "Leucorrhées physiologiques",
      "Leucorrhées abondantes",
      "Leucorrhées purulentes",
      "Métrorragies actives",
      "Liquide amniotique",
      "Pas de pertes",
    ],
    defaults: ["Leucorrhées physiologiques"],
  },
  {
    id: "seins",
    label: "Inspection / Palpation",
    chips: [
      "Seins symétriques",
      "Pas de masse palpable",
      "Masse suspecte D",
      "Masse suspecte G",
      "Écoulement mamelonnaire",
      "Adénopathie axillaire",
      "Mastodynie",
    ],
    defaults: ["Seins symétriques"],
  },
];

export const EC_DILATATION = [
  "Col fermé",
  "1 cm",
  "2 cm",
  "3 cm",
  "4 cm",
  "5 cm",
  "6 cm",
  "7 cm",
  "8 cm",
  "9 cm",
  "Complète (10 cm)",
];

export const EC_EFFACEMENT = [
  "Non effacé",
  "25%",
  "50%",
  "75%",
  "Effacé",
];

export const EC_CONSISTANCE = ["Ferme", "Moyenne", "Molle"];

export const EC_HPRES = [
  "-3 (mobile)",
  "-2",
  "-1",
  "0",
  "+1",
  "+2",
];

export const EC_PRESENTATION = [
  "Céphalique",
  "Siège",
  "Transverse",
  "Non précisée",
];

export function parseEcChips(raw?: string): Set<string> {
  if (!raw?.trim()) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed.map(String));
  } catch {
    /* legacy */
  }
  return new Set(
    raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function stringifyEcChips(selected: Set<string>): string {
  return JSON.stringify([...selected]);
}

export function defaultEcChips(): Set<string> {
  const s = new Set<string>();
  for (const sec of EXAM_CHIP_SECTIONS) {
    for (const d of sec.defaults ?? []) s.add(d);
  }
  return s;
}
