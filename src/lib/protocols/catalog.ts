export type ProtocolItem = {
  id: string;
  title: string;
  category: "obst" | "gyn" | "pma" | "urgence";
  summary: string;
  steps: string[];
  references?: string;
};

export const PROTOCOL_CATALOG: ProtocolItem[] = [
  {
    id: "pe-severe",
    title: "Pré-éclampsie sévère — prise en charge",
    category: "obst",
    summary: "Hypertension + atteinte organe après 20 SA.",
    steps: [
      "Hospitalisation, monitoring TA/urines/protéinurie 24h",
      "Sulfate de magnésium si critères de gravité",
      "Antihypertenseur si TA ≥ 160/110",
      "Évaluation maturation fœtale et décision d'accouchement",
    ],
    references: "CNGOF / ISSHP 2022",
  },
  {
    id: "rpm-34",
    title: "RPM avant terme ≥ 34 SA",
    category: "obst",
    summary: "Rupture membranes prématurées.",
    steps: [
      "Confirmer RPM (spéculum, IGFBP-1 si doute)",
      "Antibioprophylaxie selon protocole local",
      "Surveillance infectieuse et bien-être fœtal",
      "Déclenchement si non travail à 24–48 h selon protocole",
    ],
  },
  {
    id: "ohss-mod",
    title: "OHSS modérée — surveillance",
    category: "pma",
    summary: "Après stimulation ovarienne.",
    steps: [
      "Hydratation orale, éviter activité intense",
      "Pesée quotidienne, périmètre abdominal",
      "Bilan: Hb, hématocrite, créatinine, ionogramme",
      "Hospitaliser si vomissements, dyspnée, oligurie",
    ],
  },
  {
    id: "endometriose-douleur",
    title: "Endométriose — douleur chronique",
    category: "gyn",
    summary: "Prise en charge médicale première intention.",
    steps: [
      "CUP / progestatif continu ou DIU LNG",
      "Antalgiques palier 1–2, kinésithérapie",
      "Imagerie si indication chirurgicale",
      "Discussion fertilité si projet parental",
    ],
  },
  {
    id: "hemorragie-gen",
    title: "Hémorragie génitale 1er trimestre",
    category: "urgence",
    summary: "Éliminer GEU, fausse couche, menace.",
    steps: [
      "Groupe Rh, β-hCG, échographie endovaginale",
      "Hémodynamique, Hb si saignement abondant",
      "Rhesus prophylaxie si indiquée",
      "Suivi β-hCG si GEU non visualisée",
    ],
  },
];
