/** Options et utilitaires anamnèse (alignés hawaemd_v50). */

export function opts(labels: string[]): { value: string; label: string }[] {
  return labels.map((l) => ({ value: l, label: l }));
}

export const ETHNIE_OPTIONS = opts([
  "Caucasienne",
  "Afro-caribéenne",
  "Sud-asiatique",
  "Est-asiatique",
  "Métissée",
]);

export const DEBUT_OPTIONS = opts([
  "Aujourd'hui",
  "Depuis quelques jours",
  "Depuis 1 semaine",
  "Depuis 2–4 semaines",
  "Depuis plus d'un mois",
  "Chronique (>6 mois)",
]);

export const GYN_MOTIFS = opts([
  "Douleur pelvienne",
  "Métrorragies / Ménorragies",
  "Dysménorrhée",
  "Leucorrhées / Pertes vaginales",
  "Masse pelvienne",
  "Contraception",
  "Bilan gynécologique de routine",
  "Dépistage (frottis)",
  "Ménopause / Périménopause",
  "Prolapsus / Incontinence",
]);

export const OBST_MOTIFS = opts([
  "Consultation prénatale de routine",
  "Douleurs pelviennes / lombaires",
  "Métrorragies / Saignements",
  "Menace d'accouchement prématuré (MAP)",
  "Rupture prématurée des membranes (RPM)",
  "Diminution des mouvements actifs fœtaux",
  "HTA gravidique / Pré-éclampsie",
  "Diabète gestationnel",
  "Admission en salle de travail",
  "Consultation post-partum",
]);

export const INF_MOTIFS = opts([
  "Bilan d'infertilité primaire",
  "Bilan d'infertilité secondaire",
  "Suivi stimulation ovarienne",
  "Consultation pré-FIV / ICSI",
  "Suivi après échec FIV",
  "Bilan fausses couches à répétition (FCR)",
  "Préservation de la fertilité",
  "Exploration SOPK",
  "Exploration endométriose",
]);

export const GYN_REG = opts([
  "Réguliers",
  "Irréguliers",
  "Oligoménorrhée",
  "Aménorrhée",
  "Polyménorrhée",
]);

export const GYN_ABOND = opts([
  "Normale",
  "Hypomenorrhée",
  "Ménorragie",
  "Très abondante",
]);

export const GYN_DYSMEN = opts([
  "Absente",
  "Légère",
  "Modérée",
  "Sévère (invalidante)",
]);

export const GYN_LEUCO = opts([
  "Physiologiques",
  "Abondantes",
  "Purulentes",
  "Malodorantes",
  "Caséeuses (mycose)",
  "Absentes",
]);

export const GYN_CONTRA = opts([
  "Aucune",
  "Pilule œstroprogestative",
  "Pilule microprogestative",
  "DIU cuivre",
  "DIU hormonal (Mirena)",
  "Implant",
  "Préservatif",
  "Stérilisation",
]);

export const GYN_FCV_RES = opts([
  "Normal",
  "ASC-US",
  "LSIL",
  "HSIL",
  "Jamais réalisé",
  "Inconnu",
]);

export const O_TYPE = opts([
  "Singleton",
  "Gémellaire BCBA",
  "Gémellaire MCBA",
  "Gémellaire MCMA",
  "Triplets et +",
]);

export const O_CONCEPT = opts([
  "Spontanée",
  "Clomifène",
  "FIV / ICSI",
  "IAC / IAD",
]);

export const O_SUIVI = opts([
  "Régulier (ici)",
  "Régulier (ailleurs)",
  "Irrégulier",
  "Non suivi",
]);

export const O_GRP = opts([
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
  "Inconnu",
]);

export const O_TOXO = opts(["Immune", "Non immune", "Inconnu"]);
export const O_RUBEO = opts(["Immune", "Non immune", "Inconnu"]);

export const O_PRES = opts([
  "Céphalique",
  "Siège complet",
  "Siège décomplété",
  "Transverse",
  "Non précisée",
]);

export const O_INDCS = opts([
  "—",
  "Dystocie / DFCP",
  "SFA",
  "Placenta praevia",
  "Présentation siège",
  "Autre",
]);

export const O_EDF = [
  { value: "", label: "— ND —" },
  { value: "normal", label: "Normale" },
  { value: "absent", label: "Diastole absente (EDF+)" },
  { value: "reverse", label: "Diastole inversée (REDF)" },
];

export const O_DV_FLUX = [
  { value: "", label: "— ND —" },
  { value: "normal", label: "Normal (onde A positive)" },
  { value: "absent", label: "Onde A absente" },
  { value: "reverse", label: "Onde A inversée" },
];

export const I_HSG = opts([
  "Non réalisée",
  "Normale (trompes perméables)",
  "Obstruction tubaire unilatérale",
  "Obstruction tubaire bilatérale",
  "Hydrosalpinx",
  "Anomalie cavité",
]);

export const I_HYSTERO = opts([
  "Non réalisée",
  "Normale",
  "Polype endométrial",
  "Fibrome sous-muqueux",
  "Synéchies",
  "Cloison utérine",
]);

export const I_COELIO = opts([
  "Non réalisée",
  "Normale",
  "Endométriose stade I-II",
  "Endométriose stade III-IV",
  "Adhérences pelviennes",
]);

export const I_SPERMO_RES = opts([
  "Non réalisé",
  "Normal (normozoospermie)",
  "Oligozoospermie légère",
  "Oligozoospermie sévère",
  "Asthénozoospermie",
  "Tératozoospermie",
  "OAT syndrome",
  "Azoospermie sécrétoire",
  "Azoospermie obstructive",
]);

export function calcImc(poids?: string, taille?: string): string {
  const p = parseFloat(poids ?? "");
  const t = parseFloat(taille ?? "");
  if (!p || !t || t <= 0) return "";
  const m = t / 100;
  const imc = p / (m * m);
  return Number.isFinite(imc) ? imc.toFixed(1) : "";
}

/** Terme SA + DPA à partir de la DDR (logique v50 calcTerme). */
export function calcTermeFromDdr(
  ddr: string,
): { terme: string; dpa: string } | null {
  if (!ddr) return null;
  const start = new Date(ddr);
  if (Number.isNaN(start.getTime())) return null;
  const diff = Math.floor((Date.now() - start.getTime()) / 86400000);
  const sa = Math.floor(diff / 7);
  const j = diff % 7;
  const dpa = new Date(start.getTime() + 280 * 86400000);
  return {
    terme: `${sa} SA + ${j}j`,
    dpa: dpa.toISOString().split("T")[0] ?? "",
  };
}
