import type { ScoreLevel, ScoreResult } from "./types";

export type SeinT =
  | "Tis"
  | "T1mi"
  | "T1a"
  | "T1b"
  | "T1c"
  | "T2"
  | "T3"
  | "T4a"
  | "T4b"
  | "T4c"
  | "T4d";
export type SeinN =
  | "N0"
  | "N1mi"
  | "N1"
  | "N2a"
  | "N2b"
  | "N3a"
  | "N3b"
  | "N3c";
export type SeinM = "M0" | "M1";
export type TriState = "pos" | "neg";
export type SeinHer2 = "neg" | "pos" | "low";
export type SeinKi67 = "low" | "inter" | "high";
export type SeinGrade = "1" | "2" | "3";
export type SeinHisto =
  | "canalaire"
  | "lobulaire"
  | "ccis"
  | "mucineux"
  | "medullaire"
  | "autre";
export type SeinMeno = "post" | "pre";

export interface SeinInput {
  T: SeinT;
  N: SeinN;
  M: SeinM;
  re: TriState;
  rp: TriState;
  her2: SeinHer2;
  ki67: SeinKi67;
  grade: SeinGrade;
  histo: SeinHisto;
  meno: SeinMeno;
}

export const SEIN_DEFAULT: SeinInput = {
  T: "T1c",
  N: "N0",
  M: "M0",
  re: "pos",
  rp: "pos",
  her2: "neg",
  ki67: "low",
  grade: "2",
  histo: "canalaire",
  meno: "post",
};

export interface SeinTherapeuticPlan {
  chir: string;
  chemo: string;
  hormono: string;
  her2: string;
  radio: string;
}

export interface SeinFullResult extends ScoreResult {
  stade: string;
  soustype: string;
  soustypeDesc: string;
  tnm: string;
  therapeutic: SeinTherapeuticPlan;
  remarques: string[];
}

function stadeTNM(T: SeinT, N: SeinN, M: SeinM): string {
  // Stades anatomiques AJCC 8e édition.
  if (M === "M1") return "IV";
  if (N === "N3a" || N === "N3b" || N === "N3c") return "IIIC";
  if (["T4a", "T4b", "T4c", "T4d"].includes(T)) return "IIIB";
  if (N === "N2a" || N === "N2b") return "IIIA";
  if (T === "T3") return N === "N0" ? "IIB" : "IIIA";
  if (T === "T2") return N === "N0" ? "IIA" : "IIB";
  if (T === "Tis" && N === "N0") return "0";
  // T1 (et Tis avec atteinte ganglionnaire, à reclasser après relecture anatomopathologique)
  if (N === "N0") return "IA";
  if (N === "N1mi") return "IB";
  return "IIA";
}

function molecularSubtype(input: SeinInput): {
  name: string;
  desc: string;
  level: ScoreLevel;
} {
  const { re, rp, her2, ki67, grade } = input;
  if (re === "pos" && her2 === "neg") {
    if (ki67 === "low" && grade === "1") {
      return {
        name: "Luminal A",
        desc: "RE+, RP+, HER2−, Ki-67 faible, Grade I. Pronostic favorable.",
        level: "ok",
      };
    }
    return {
      name: "Luminal B (HER2−)",
      desc: "RE+, HER2−, Ki-67 élevé ou Grade II–III. Plus agressif que Luminal A.",
      level: "medium",
    };
  }
  if (re === "pos" && her2 === "pos") {
    return {
      name: "Luminal B (HER2+)",
      desc: "RE+, HER2+. Double positivité. Pronostic intermédiaire à défavorable.",
      level: "high",
    };
  }
  if (re === "neg" && rp === "neg" && her2 === "pos") {
    return {
      name: "HER2+ enrichi",
      desc: "RE−, RP−, HER2+. Sensible aux thérapies anti-HER2 (trastuzumab).",
      level: "high",
    };
  }
  if (re === "neg" && rp === "neg" && her2 === "neg") {
    return {
      name: "Triple négatif (TNBC)",
      desc: "RE−, RP−, HER2−. Sous-type le plus agressif.",
      level: "critical",
    };
  }
  if (her2 === "low") {
    return {
      name: re === "pos" ? "Luminal B / HER2-low" : "Triple négatif HER2-low",
      desc: "HER2-low : éligible aux ADC (trastuzumab-déruxtécan si indiqué).",
      level: "medium",
    };
  }
  return { name: "Non classé", desc: "Profil à compléter.", level: "medium" };
}

function therapeuticPlan(
  stade: string,
  soustype: string,
  input: SeinInput,
): SeinTherapeuticPlan {
  const { re, her2, meno } = input;
  let chir = "";
  let chemo = "";
  let hormono = "";
  let her2_tt = "";
  let radio = "";

  if (stade === "0") {
    chir =
      "Tumorectomie en berges saines ; mastectomie si lésion étendue ou multifocale. Ganglion sentinelle non systématique (indiqué en cas de mastectomie ou de suspicion de micro-invasion).";
  } else if (["IA", "IB", "IIA", "IIB"].includes(stade)) {
    chir =
      "Chirurgie conservatrice (tumorectomie + GS) si possible. Mastectomie si contre-indication à la conservation.";
  } else if (["IIIA", "IIIB", "IIIC"].includes(stade)) {
    chir =
      "Chimiothérapie néoadjuvante en premier. Réévaluation chirurgicale après réponse.";
  } else if (stade === "IV") {
    chir =
      "Chirurgie palliative uniquement si complications locales. Traitement systémique prioritaire.";
  }

  if (stade === "0") {
    chemo = "Pas de chimiothérapie (carcinome in situ).";
  } else if (soustype.includes("Triple négatif")) {
    chemo =
      "Chimiothérapie, néoadjuvante dès T2 ou N+ (anthracyclines et taxanes ± sel de platine) ; immunothérapie associée à discuter aux stades II–III ; traitement post-néoadjuvant si maladie résiduelle. Décision en RCP.";
  } else if (her2 === "pos") {
    chemo =
      "Chimiothérapie associée à un anti-HER2 (taxane ± anthracycline ou sel de platine), néoadjuvante dès T2 ou N+. Décision en RCP.";
  } else if (soustype.startsWith("Luminal B")) {
    chemo =
      "Chimiothérapie (sans anti-HER2) à discuter selon le stade, le grade, le Ki-67 et, si disponible, une signature génomique. Décision en RCP.";
  } else if (soustype === "Luminal A" && ["IA", "IB"].includes(stade)) {
    chemo =
      "Chimiothérapie non recommandée en routine. Discuter selon risque de récidive (Ki-67, grade).";
  } else {
    chemo =
      "Décision selon RCP — évaluation du risque génomique (Oncotype DX si disponible).";
  }

  if (re === "pos") {
    hormono =
      meno === "post"
        ? "Inhibiteurs de l'aromatase (létrozole, anastrozole, exémestane) 5–10 ans."
        : "Tamoxifène 5–10 ans. Si haut risque : suppression ovarienne + IA ou tamoxifène.";
  } else {
    hormono = "Non applicable (RE−).";
  }

  if (stade === "0") {
    her2_tt = "Non applicable (carcinome in situ).";
  } else if (her2 === "pos") {
    her2_tt =
      "Trastuzumab (Herceptin) ± pertuzumab 1 an. Si résidu post-NAC : T-DM1.";
  } else if (her2 === "low") {
    her2_tt =
      "HER2-low : pas d'anti-HER2 en situation précoce ; trastuzumab-déruxtécan à discuter en situation métastatique après traitement antérieur.";
  } else {
    her2_tt = "Non applicable (HER2−).";
  }

  if (stade === "0") {
    radio = "Radiothérapie mammaire après tumorectomie.";
  } else if (["IA", "IB", "IIA", "IIB"].includes(stade)) {
    radio =
      "Radiothérapie mammaire systématique après chirurgie conservatrice. Post-mastectomie si N+ ou T ≥ 5 cm.";
  } else if (["IIIA", "IIIB", "IIIC"].includes(stade)) {
    radio = "Radiothérapie post-opératoire systématique (paroi + aires ganglionnaires).";
  } else {
    radio = "Radiothérapie palliative si métastases osseuses ou cérébrales.";
  }

  return { chir, chemo, hormono, her2: her2_tt, radio };
}

function stadeLevel(stade: string): ScoreLevel {
  if (stade === "0" || stade === "IA" || stade === "IB") return "ok";
  if (stade === "IIA" || stade === "IIB") return "medium";
  if (["IIIA", "IIIB", "IIIC"].includes(stade)) return "high";
  return "critical";
}

export function calcSein(input: SeinInput): SeinFullResult {
  const stade = stadeTNM(input.T, input.N, input.M);
  const mol = molecularSubtype(input);
  const therapeutic = therapeuticPlan(stade, mol.name, input);
  const remarques: string[] = [];
  if (input.histo === "lobulaire") {
    remarques.push(
      "CLI : souvent bilatéral et multifocal — IRM mammaire bilatérale recommandée.",
    );
  }
  if (input.histo === "ccis") {
    remarques.push(
      "CCIS : lésion pré-invasive pouvant évoluer vers un cancer infiltrant — traitement local (chirurgie ± radiothérapie), pas de simple surveillance hors essai.",
    );
  }
  if (input.T === "T4d") {
    remarques.push(
      "Cancer inflammatoire : urgence thérapeutique — chimiothérapie néoadjuvante.",
    );
  }
  if (stade === "IV") {
    remarques.push("Stade métastatique : traitement palliatif prioritaire.");
  }

  remarques.push(
    "Aide-mémoire non prescriptif : la stratégie est arrêtée en RCP selon les référentiels en vigueur (ESMO, Saint-Paul-de-Vence, INCa).",
  );

  const level = stadeLevel(stade);
  const tnm = `${input.T} · ${input.N} · ${input.M}`;

  return {
    value: stade,
    raw: 0,
    max: 0,
    level,
    label: `${mol.name} — Stade ${stade}`,
    interpretation: `<strong>Stade ${stade}</strong> (${tnm})<br><strong>${mol.name}</strong> — ${mol.desc}<br><br>⚠️ Décision multidisciplinaire obligatoire (RCP oncologie, chirurgie, radiothérapie).`,
    details: [
      { label: "TNM", value: tnm },
      { label: "Sous-type", value: mol.name },
    ],
    stade,
    soustype: mol.name,
    soustypeDesc: mol.desc,
    tnm,
    therapeutic,
    remarques,
  };
}
