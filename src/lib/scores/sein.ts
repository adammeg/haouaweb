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
  if (M === "M1") return "IV";
  if (["T4a", "T4b", "T4c", "T4d"].includes(T)) {
    return N === "N3a" || N === "N3b" || N === "N3c" ? "IIIC" : "IIIB";
  }
  if (T === "T3" && (N === "N0" || N === "N1")) {
    return N === "N0" ? "IIB" : "IIIA";
  }
  if (N === "N2a" || N === "N2b") return "IIIA";
  if (N === "N3a" || N === "N3b" || N === "N3c") return "IIIC";
  if (T === "Tis") return "0";
  if (["T1mi", "T1a", "T1b", "T1c"].includes(T) && N === "N0") return "IA";
  if (T === "T1c" && (N === "N1mi" || N === "N1")) return "IB";
  if (T === "T2" && N === "N0") return "IIA";
  if (T === "T2" && (N === "N1mi" || N === "N1")) return "IIB";
  if (T === "T3" && N === "N0") return "IIB";
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
      "Tumorectomie + curage ganglionnaire sentinelle. Mastectomie si lésion étendue/multifocale.";
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

  if (soustype.includes("Triple négatif")) {
    chemo =
      "Chimiothérapie néoadjuvante recommandée (AC-T ou TC). Capécitabine si résidu post-NAC. Pembrolizumab si PD-L1+.";
  } else if (soustype.includes("HER2+") || soustype.includes("Luminal B")) {
    chemo =
      "Chimiothérapie ± néoadjuvante selon stade (AC-TH ou TCH). Évaluation oncologique multidisciplinaire.";
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

  if (her2 === "pos") {
    her2_tt =
      "Trastuzumab (Herceptin) ± pertuzumab 1 an. Si résidu post-NAC : T-DM1.";
  } else if (her2 === "low" && re === "neg") {
    her2_tt = "HER2-low métastatique : trastuzumab-déruxtécan (T-DXd) si ligne ≥2.";
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
    remarques.push("CCIS : risque évolutif faible — surveillance rapprochée.");
  }
  if (input.T === "T4d") {
    remarques.push(
      "Cancer inflammatoire : urgence thérapeutique — chimiothérapie néoadjuvante.",
    );
  }
  if (stade === "IV") {
    remarques.push("Stade métastatique : traitement palliatif prioritaire.");
  }

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
