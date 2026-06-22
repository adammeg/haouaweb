import { calcADNEX } from "./adnex";
import { calcROMA } from "./roma";

export type IotaCriteria = {
  b1: boolean;
  b2: boolean;
  b3: boolean;
  b4: boolean;
  b5: boolean;
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  m5: boolean;
};

export type OradsInput = {
  visComplete: boolean;
  ovariesNormal: boolean;
  type:
    | "kyste_simple"
    | "corps_jaune"
    | "kyste_hemorragique_typique"
    | "endometriome_typique"
    | "autre";
  solidComponent: boolean;
  doppler: "faible" | "modere" | "abondant";
  ascite: boolean;
};

export type AnnexeInput = {
  age: number;
  menopause: boolean;
  ca125: number;
  he4: number;
  dmax: number;
  oncologyCenter: boolean;
  iota: IotaCriteria;
  adnex: {
    solidPct: number;
    pap: "0" | "1_3" | "4plus";
    acousticShadows: boolean;
    ascites: boolean;
  };
  orads: OradsInput;
};

export type AnnexeSubResult = {
  iota: { verdict: string; level: "low" | "medium" | "high" };
  adnex: { pMalin: number } | null;
  roma: { prob: number; risk: string } | null;
  orads: { cat: number; label: string; risk: string };
  verdict: string;
  verdictLevel: "low" | "medium" | "high" | "critical";
};

export function calcAnnexeUnified(input: AnnexeInput): AnnexeSubResult {
  const nB = [
    input.iota.b1,
    input.iota.b2,
    input.iota.b3,
    input.iota.b4,
    input.iota.b5,
  ].filter(Boolean).length;
  const nM = [
    input.iota.m1,
    input.iota.m2,
    input.iota.m3,
    input.iota.m4,
    input.iota.m5,
  ].filter(Boolean).length;

  let iotaVerdict = "INDÉTERMINÉ";
  let iotaLevel: AnnexeSubResult["iota"]["level"] = "medium";
  if (nB >= 1 && nM === 0) {
    iotaVerdict = "BÉNIN";
    iotaLevel = "low";
  } else if (nM >= 1 && nB === 0) {
    iotaVerdict = "MALIN";
    iotaLevel = "high";
  }

  let adnexResult: AnnexeSubResult["adnex"] = null;
  if (input.ca125 > 0 && input.dmax > 0) {
    const papMap = { "0": 0, "1_3": 2, "4plus": 4 } as const;
    const adnexScore = calcADNEX({
      age: input.age,
      ca125: input.ca125,
      cystMaxMm: input.dmax,
      solidPct: input.adnex.solidPct,
      papillaryProjections: papMap[input.adnex.pap],
      acousticShadows: input.adnex.acousticShadows,
      ascites: input.adnex.ascites,
      oncologyCenter: input.oncologyCenter,
    });
    if (adnexScore) {
      adnexResult = { pMalin: adnexScore.raw };
    }
  }

  let romaResult: AnnexeSubResult["roma"] = null;
  if (input.ca125 > 0 && input.he4 > 0) {
    const roma = calcROMA({
      postmenopause: input.menopause,
      he4: input.he4,
      ca125: input.ca125,
    });
    if (roma) {
      romaResult = {
        prob: roma.raw,
        risk: roma.level === "high" ? "HAUT RISQUE" : "FAIBLE RISQUE",
      };
    }
  }

  const o = input.orads;
  let oradsResult: AnnexeSubResult["orads"];
  if (!o.visComplete) {
    oradsResult = {
      cat: 0,
      label: "Évaluation incomplète",
      risk: "NA",
    };
  } else if (o.ovariesNormal) {
    oradsResult = { cat: 1, label: "Ovaires normaux", risk: "< 1%" };
  } else {
    const cat2 = [
      "kyste_simple",
      "corps_jaune",
      "kyste_hemorragique_typique",
      "endometriome_typique",
    ];
    if (cat2.includes(o.type) && !o.solidComponent) {
      oradsResult = {
        cat: 2,
        label: "Presque certainement bénin",
        risk: "< 1%",
      };
    } else if (!o.solidComponent && !o.ascite) {
      oradsResult = { cat: 3, label: "Risque faible", risk: "1–5%" };
    } else if (
      o.solidComponent &&
      (o.doppler === "faible" || o.doppler === "modere")
    ) {
      oradsResult = {
        cat: 4,
        label: "Risque intermédiaire",
        risk: "5–50%",
      };
    } else {
      oradsResult = { cat: 5, label: "Risque élevé", risk: "> 50%" };
    }
  }

  const adnexHaut = adnexResult && adnexResult.pMalin >= 30;
  const adnexMoyen =
    adnexResult && adnexResult.pMalin >= 10 && adnexResult.pMalin < 30;
  const romaHaut = romaResult?.risk === "HAUT RISQUE";
  const oradsHaut = oradsResult.cat >= 4;
  const iotaMalin = iotaVerdict === "MALIN";

  let verdict: string;
  let verdictLevel: AnnexeSubResult["verdictLevel"];
  if (adnexHaut || romaHaut || oradsHaut || iotaMalin) {
    verdict = "RCP oncogynécologique recommandée";
    verdictLevel = "critical";
  } else if (adnexMoyen || oradsResult.cat === 3) {
    verdict = "Zone grise — avis oncogynécologique à considérer";
    verdictLevel = "medium";
  } else {
    verdict = "Probablement bénin — surveillance écho + marqueurs 3 mois";
    verdictLevel = "low";
  }

  return {
    iota: { verdict: iotaVerdict, level: iotaLevel },
    adnex: adnexResult,
    roma: romaResult,
    orads: oradsResult,
    verdict,
    verdictLevel,
  };
}
