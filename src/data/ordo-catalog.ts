import type { OrdoSuggestion, OrdoTemplate, Specialty } from "@/types/domain";

/** Suggestions par spécialité (extrait du template HTML). */
export const ORDO_SUGGESTIONS: Record<
  Specialty | "default",
  OrdoSuggestion[]
> = {
  gyn: [
    {
      dci: "Acide folique",
      dose: "0,4 mg",
      posologie: "1 cp/j dès le projet de grossesse (5 mg/j si antécédent d'anomalie du tube neural ou antiépileptique)",
      duree: "jusqu'à 12 SA",
      boites: 3,
      cat: "Vitamines",
    },
    {
      dci: "Progestérone micronisée (Utrogestan)",
      dose: "200 mg",
      posologie: "1 cp/soir en intravaginal",
      duree: "14 j",
      boites: 1,
      cat: "Hormones",
    },
    {
      dci: "Métronidazole",
      dose: "500 mg",
      posologie: "1 cp 2×/j avec les repas",
      duree: "7 j",
      boites: 1,
      cat: "Antibiotiques",
    },
    {
      dci: "Paracétamol",
      dose: "1 g",
      posologie: "1 cp jusqu'à 3×/j si douleur",
      duree: "5 j",
      boites: 1,
      cat: "Antalgiques",
    },
  ],
  obst: [
    {
      dci: "Acide folique",
      dose: "0,4 mg",
      posologie: "1 cp/j dès le projet de grossesse (5 mg/j si antécédent d'anomalie du tube neural ou antiépileptique)",
      duree: "jusqu'à 12 SA",
      boites: 3,
      cat: "Vitamines",
    },
    {
      dci: "Sulfate ferreux",
      dose: "80 mg",
      posologie: "1 cp/j à distance des repas",
      duree: "3 mois",
      boites: 3,
      cat: "Vitamines",
    },
    {
      dci: "Aspirine faible dose",
      dose: "100 à 160 mg",
      posologie: "1 prise/j le soir, à débuter avant 16 SA (indication : haut risque de prééclampsie)",
      duree: "jusqu'à 35–36 SA",
      boites: 6,
      cat: "Anticoagulants",
    },
    {
      dci: "Métoclopramide (Primpéran)",
      dose: "10 mg",
      posologie: "1 cp jusqu'à 3×/j avant les repas (2e intention ; 30 mg/j maximum)",
      duree: "5 j maximum",
      boites: 1,
      cat: "Antiémétiques",
    },
  ],
  inf: [
    {
      dci: "Citrate de clomifène (Clomid)",
      dose: "50 mg",
      posologie: "1 cp/j J2–J6",
      duree: "5 j",
      boites: 1,
      cat: "Inducteurs",
    },
    {
      dci: "Metformine",
      dose: "500 mg",
      posologie: "1 cp 2–3×/j avec repas",
      duree: "3 mois",
      boites: 3,
      cat: "SOPK",
    },
    {
      dci: "Acide folique",
      dose: "0,4 mg",
      posologie: "1 cp/j dès le projet de grossesse (5 mg/j si antécédent d'anomalie du tube neural ou antiépileptique)",
      duree: "jusqu'à 12 SA",
      boites: 3,
      cat: "Vitamines",
    },
  ],
  default: [
    {
      dci: "Paracétamol",
      dose: "1 g",
      posologie: "1 cp jusqu'à 3×/j si douleur",
      duree: "5 j",
      boites: 1,
      cat: "Antalgiques",
    },
    {
      dci: "Ibuprofène",
      dose: "400 mg",
      posologie: "1 cp 3×/j avec repas — contre-indiqué pendant la grossesse (formellement dès 24 SA)",
      duree: "5 j",
      boites: 1,
      cat: "Antalgiques",
    },
  ],
};

export const ORDO_TEMPLATES: OrdoTemplate[] = [
  {
    id: "suivi-gro",
    name: "Suivi grossesse standard",
    spec: "obst",
    icon: "🤰",
    lignes: [
      {
        dci: "Acide folique",
        dose: "0,4 mg",
        posologie: "1 cp/j dès le projet de grossesse (5 mg/j si antécédent d'anomalie du tube neural ou antiépileptique)",
        duree: "jusqu'à 12 SA",
        boites: 3,
      },
      {
        dci: "Sulfate ferreux",
        dose: "80 mg",
        posologie: "1 cp/j à distance des repas",
        duree: "3 mois",
        boites: 3,
      },
    ],
  },
  {
    id: "contracep",
    name: "Contraception oestroprogestative",
    spec: "gyn",
    icon: "💊",
    lignes: [
      {
        dci: "Éthinylestradiol + Lévonorgestrel (Minidril)",
        dose: "1 cp",
        posologie: "1 cp/j pendant 21 jours, puis 7 jours d'arrêt",
        duree: "3 mois",
        boites: 3,
      },
    ],
  },
  {
    id: "sopk",
    name: "SOPK + induction ovulation",
    spec: "inf",
    icon: "🔄",
    lignes: [
      {
        dci: "Citrate de clomifène (Clomid)",
        dose: "50 mg",
        posologie: "1 cp/j J2–J6",
        duree: "5 j",
        boites: 1,
      },
      {
        dci: "Metformine",
        dose: "500 mg",
        posologie: "1 cp 2×/j avec repas",
        duree: "3 mois",
        boites: 3,
      },
    ],
  },
];
