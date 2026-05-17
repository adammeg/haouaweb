/**
 * IVF / PMA Engine — porté depuis hawaemd_v50.html (IVFEngineService).
 */
import type {
  BolognaResult,
  IvfAnalysis,
  IvfCalendarDay,
  IvfPatientProfile,
  IvfProtocolOption,
  OhssRiskResult,
  OvarianResponseResult,
  PoseidonResult,
} from "./ivf-types";

export function classifyPoseidon(p: IvfPatientProfile): PoseidonResult {
  const lowR =
    (p.amh !== null && p.amh < 1.2) || (p.afc !== null && p.afc < 5);
  const adR = !lowR;
  const poorPrev =
    p.prevCycles > 0 && p.prevOocytes !== null && p.prevOocytes < 4;
  let group: number;
  let desc: string;
  let sub: string | null = null;

  if (!p.prevCycles || p.prevCycles === 0) {
    if (p.age != null && p.age < 35 && lowR) {
      group = 3;
      desc = "Jeune patiente à réserve ovarienne diminuée";
    } else if (p.age != null && p.age >= 35 && lowR) {
      group = 4;
      desc = "Patiente ≥ 35 ans à réserve ovarienne diminuée";
    } else if (p.age != null && p.age < 35) {
      group = 1;
      desc = "Jeune patiente, bonne réserve prédite";
      sub = "1a";
    } else {
      group = 2;
      desc = "Patiente ≥ 35 ans, bonne réserve";
      sub = "2a";
    }
  } else {
    if (p.age != null && p.age < 35 && adR && poorPrev) {
      group = 1;
      desc = "Mauvaise répondante inattendue < 35 ans";
      sub = "1b";
    } else if (p.age != null && p.age >= 35 && adR && poorPrev) {
      group = 2;
      desc = "Mauvaise répondante inattendue ≥ 35 ans";
      sub = "2b";
    } else if (p.age != null && p.age < 35 && lowR) {
      group = 3;
      desc = "Jeune patiente à réserve diminuée";
    } else if (p.age != null && p.age >= 35 && lowR) {
      group = 4;
      desc = "Patiente âgée à réserve diminuée";
    } else if (p.age != null && p.age < 35) {
      group = 1;
      desc = "Bonne réponse attendue < 35 ans";
      sub = "1a";
    } else {
      group = 2;
      desc = "Bonne réponse attendue ≥ 35 ans";
      sub = "2a";
    }
  }
  return {
    group,
    desc,
    subgroup: sub,
    lowReserve: lowR,
    adequateReserve: adR,
    poorPrevResponse: poorPrev,
  };
}

export function classifyBologna(p: IvfPatientProfile): BolognaResult {
  let c = 0;
  const d: string[] = [];
  const risk =
    p.chirOv !== "non" || p.sopk !== "non" || p.endo === "stade34";
  if ((p.age != null && p.age >= 40) || risk) {
    c++;
    if (p.age != null && p.age >= 40) d.push("Âge ≥ 40 ans");
    if (p.chirOv !== "non") d.push("Chirurgie ovarienne");
    if (p.endo === "stade34") d.push("Endométriose III–IV");
  }
  if (p.prevCycles > 0 && p.prevOocytes !== null && p.prevOocytes <= 3) {
    c++;
    d.push("Réponse pauvre antérieure (≤3 ovocytes)");
  }
  const abnOrt =
    (p.amh !== null && p.amh < 1.1) || (p.afc !== null && p.afc < 7);
  if (abnOrt) {
    c++;
    if (p.amh !== null && p.amh < 1.1) d.push("AMH < 1.1 ng/mL");
    if (p.afc !== null && p.afc < 7) d.push("AFC < 7");
  }
  return {
    positive: c >= 2,
    criteria: c,
    details: d,
    extremePor: c >= 2 && p.amh !== null && p.amh < 0.5,
  };
}

export function classifyOvarianResponse(
  p: IvfPatientProfile,
): OvarianResponseResult {
  const sopk = p.sopk === "oui" || p.sopk === "probable";
  let exp: number | null = null;
  if (p.amh !== null) {
    exp = Math.round(p.amh * 5.4);
    if (p.age != null && p.age >= 40) exp = Math.round(exp * 0.75);
    else if (p.age != null && p.age >= 38) exp = Math.round(exp * 0.85);
    if (sopk) exp = Math.round(exp * 1.4);
  }
  if (p.prevOocytes !== null && p.prevOocytes > 0) exp = p.prevOocytes;
  let rt: string;
  let oh: string;
  let prog: number | null = null;
  if (exp === null) {
    rt = "Indéterminée";
    oh = "low";
  } else if (exp < 4) {
    rt = "Mauvaise répondante (Poor responder)";
    oh = "low";
    prog = Math.max(5, 20 - ((p.age ?? 35) - 35) * 2);
  } else if (exp < 10) {
    rt = "Répondante sous-optimale (Suboptimal)";
    oh = "low";
    prog = Math.max(10, 40 - ((p.age ?? 35) - 35) * 1.5);
  } else if (exp < 18) {
    rt = "Répondante normale (Normal responder)";
    oh = "medium";
    prog = Math.max(20, 60 - ((p.age ?? 35) - 35) * 1.5);
  } else {
    rt = "Hyper-répondante (OHSS risk élevé)";
    oh = sopk ? "critical" : "high";
    prog = Math.max(25, 65 - ((p.age ?? 35) - 35) * 1.5);
  }
  if (sopk && oh === "low") oh = "medium";
  if (p.ohssAtcd === "severe") oh = "critical";
  if (p.ohssAtcd === "modere" && oh !== "critical") oh = "high";
  if (prog !== null) prog = Math.min(85, Math.max(5, Math.round(prog)));
  return {
    responseType: rt,
    expectedOocytes: exp,
    ohssRisk: oh,
    prognosis: prog,
  };
}

function calcStartDose(p: IvfPatientProfile): number {
  let dose = 225;
  if (p.amh !== null) {
    if (p.amh < 0.5) dose = 450;
    else if (p.amh < 1.0) dose = 375;
    else if (p.amh < 1.5) dose = 300;
    else if (p.amh < 2.5) dose = 225;
    else if (p.amh < 3.5) dose = 150;
    else dose = 100;
  }
  if (p.afc !== null) {
    if (p.afc < 5) dose = Math.max(dose, 375);
    else if (p.afc > 20) dose = Math.min(dose, 150);
  }
  if (p.age != null && p.age >= 40) dose = Math.max(dose, 300);
  else if (p.age != null && p.age >= 38) dose = Math.max(dose, 250);
  if (p.bmi != null) {
    if (p.bmi > 30) dose = Math.round(dose * 1.15);
    if (p.bmi < 19) dose = Math.round(dose * 0.9);
  }
  if (p.prevOocytes !== null && p.prevOocytes < 4) dose = Math.max(dose, 375);
  if (
    p.prevDose !== null &&
    p.prevOocytes !== null &&
    p.prevOocytes < 4
  )
    dose = Math.min(Math.max(p.prevDose + 75, dose), 450);
  if (p.sopk === "oui") dose = Math.min(dose, 150);
  return Math.round(dose / 25) * 25;
}

export function calcOhssRisk(p: IvfPatientProfile): OhssRiskResult {
  let s = 0;
  const f: string[] = [];
  if (p.afc !== null && p.afc > 20) {
    s += 3;
    f.push("CFA > 20 follicules");
  } else if (p.afc != null && p.afc > 15) {
    s += 1;
    f.push("CFA > 15");
  }
  if (p.amh !== null && p.amh > 3.5) {
    s += 2;
    f.push("AMH > 3.5 ng/mL");
  }
  if (p.age != null && p.age < 35) {
    s += 1;
    f.push("Âge < 35 ans");
  }
  if (p.sopk !== "non") {
    s += 3;
    f.push("SOPK");
  }
  if (p.ohssAtcd === "modere") {
    s += 2;
    f.push("ATCD OHSS modéré");
  }
  if (p.ohssAtcd === "severe") {
    s += 4;
    f.push("ATCD OHSS sévère");
  }
  if (p.bmi != null && p.bmi < 20) {
    s += 1;
    f.push("IMC bas < 20");
  }
  let lv: string;
  let lb: string;
  let st: string;
  if (s === 0) {
    lv = "low";
    lb = "Faible";
    st = "Protocole standard";
  } else if (s <= 3) {
    lv = "medium";
    lb = "Modéré";
    st = "Antagoniste + surveillance E2 rapprochée";
  } else if (s <= 6) {
    lv = "high";
    lb = "Élevé";
    st = "Trigger agoniste + Freeze-all recommandé";
  } else {
    lv = "critical";
    lb = "Très élevé";
    st =
      "PPOS ou dose minimale + trigger agoniste obligatoire + Freeze-all";
  }
  return { score: s, level: lv, label: lb, strategy: st, factors: f };
}

export function generateProtocols(
  p: IvfPatientProfile,
  poseidon: PoseidonResult,
  _bologna: BolognaResult,
  response: OvarianResponseResult,
): IvfProtocolOption[] {
  const sopk = p.sopk !== "non";
  const poor =
    poseidon.group >= 3 || response.responseType.includes("Poor");
  const extremePoor =
    (p.amh !== null && p.amh < 0.5) ||
    (p.afc !== null && p.afc < 3);
  const endoSev = p.endo === "stade34";
  const ohssHigh =
    response.ohssRisk === "high" || response.ohssRisk === "critical";
  const ohssCrit = response.ohssRisk === "critical";
  const prevPoorResp =
    p.prevCycles > 0 && p.prevOocytes !== null && p.prevOocytes <= 3;
  const preservation = p.indication === "preservation";
  const dose = calcStartDose(p);
  const doseCourt = Math.min(dose + 75, 450);

  const r1_ohssCrit =
    ohssCrit || (sopk && p.afc !== null && p.afc > 20);
  const r2_extremePoor =
    extremePoor && ((p.age != null && p.age >= 40) || prevPoorResp);
  const r2_poor = poor && !extremePoor;
  const r2_duostim = poor && prevPoorResp && p.prevCycles >= 2;
  const r3_endo = endoSev && !poor && !ohssHigh;
  const r4_preservation = preservation && !r1_ohssCrit;

  const protos: IvfProtocolOption[] = [
    {
      id: "antagoniste",
      icon: "⚡",
      name: "Protocole Antagoniste GnRH",
      type: "1re intention — Flexible — Adaptable",
      dose,
      trigger: ohssHigh
        ? "Agoniste GnRH (Décapeptyl 0.2mg) — Freeze-all obligatoire"
        : "hCG (Ovitrelle 250µg)",
      strategy:
        "Démarrage J2–J3 · Antagoniste dès follicule ≥ 14mm ou J5–J6 · Très flexible · Cycle court (14–16j)",
      meds: [
        "rFSH " + dose + " UI/j J2–J3",
        "Orgalutran / Cetrotide 0.25mg/j dès J5–J6",
        ohssHigh
          ? "Décapeptyl 0.2mg trigger + Freeze-all"
          : "hCG Ovitrelle 250µg trigger",
      ],
      pros: "Protocole le plus étudié · Sécuritaire · Idéal si risque OHSS · Cycle court · Facilement adaptable",
      cons: "Légèrement moins synchrone que le long protocole en endométriose sévère",
      indication:
        "Indiqué pour la majorité des patientes. Protocole de référence ESHRE.",
      freezeAll: ohssHigh,
      ohssStrategy: ohssHigh
        ? "Trigger agoniste + Freeze-all — contreindique transfert frais"
        : null,
    },
    {
      id: "ppos",
      icon: "💊",
      name: "PPOS — Progestin-Primed Ovarian Stimulation",
      type: r1_ohssCrit
        ? "★ RECOMMANDÉ — SOPK / OHSS critique"
        : "Blocage LH oral — Freeze-all",
      dose,
      trigger: "Agoniste GnRH (Décapeptyl 0.2mg) — Freeze-all systématique",
      strategy:
        "Progestérone 200mg ×2/j dès J2 (ou MPA 10mg/j) + FSH · Pas d'antagoniste injecté · Blocage LH oral",
      meds: [
        "rFSH " + dose + " UI/j J2",
        "Progestérone 200mg ×2/j OU MPA 10mg/j (blocage LH)",
        "Décapeptyl 0.2mg trigger — Freeze-all obligatoire",
      ],
      pros: "Très bien toléré · Prise orale (pas d'antagoniste injecté) · Idéal SOPK · Zéro risque OHSS sévère",
      cons: "Freeze-all obligatoire — pas de transfert frais · TEC différé 4–8 semaines",
      indication: r1_ohssCrit
        ? "SOPK + CFA > 20 ou ATCD OHSS sévère → PPOS est la stratégie de choix (ESHRE 2023)"
        : "Option chez les patientes SOPK ou préférant la prise orale",
      freezeAll: true,
      ohssStrategy: r1_ohssCrit
        ? "PPOS = stratégie de prévention OHSS — Freeze-all systématique"
        : "Freeze-all par protocole",
    },
    {
      id: "long",
      icon: "⏳",
      name: "Protocole Long Agoniste GnRH",
      type: r3_endo
        ? "★ RECOMMANDÉ — Endométriose sévère"
        : "Synchronisation forte — Cycle prévisible",
      dose,
      trigger: ohssHigh
        ? "Agoniste GnRH — Freeze-all"
        : "hCG (Ovitrelle 250µg)",
      strategy:
        "Décapeptyl 3.75mg LP J21 du cycle précédent · Désensibilisation 10–14j · Stimulation J2",
      meds: [
        "Décapeptyl 3.75mg LP J21 (cycle précédent)",
        "rFSH " + dose + " UI/j J2 (après désensibilisation)",
        ohssHigh ? "Trigger agoniste + Freeze-all" : "hCG Ovitrelle trigger",
      ],
      pros: "Synchronisation parfaite · Suppression kyste endométriosique · Contrôle optimal · Endométriose sévère",
      cons: "Durée totale ~6 semaines · Effets climatériques transitoires · Contre-indiqué si réserve basse",
      indication: r3_endo
        ? "Endométriose stade III–IV sans mauvaise réponse → Long protocole recommandé (CNGOF 2021)"
        : "À considérer si synchronisation importante ou endométriose modérée",
      freezeAll: ohssHigh,
      ohssStrategy: ohssHigh
        ? "Risque OHSS élevé sous long protocole — préférer antagoniste"
        : null,
    },
    {
      id: "duostim",
      icon: "🔁",
      name: "DuoStim — Double Stimulation",
      type:
        r2_duostim || r4_preservation
          ? "★ RECOMMANDÉ — Accumulation ovocytes"
          : "Option — Poor responders sévères",
      dose,
      trigger:
        "Agoniste GnRH ×2 (ponction 1 + ponction 2) — Freeze-all obligatoire",
      strategy:
        "Stimulation phase folliculaire → Ponction 1 (J14–J16) → Stimulation phase lutéale → Ponction 2 (J28–J32)",
      meds: [
        "rFSH " + dose + " UI/j phase folliculaire (J2–J14)",
        "Antagoniste GnRH J5–J6 (phase folliculaire)",
        "rFSH " + dose + " UI/j phase lutéale (J16–J28)",
        "Décapeptyl trigger ×2 · Freeze-all",
      ],
      pros: "Double production ovocytaire en 1 seul cycle · Optimal pour accumulation · Préservation fertilité",
      cons: "Complexe · Freeze-all obligatoire · Nécessite centre expérimenté · Durée ~5 semaines",
      indication:
        r2_duostim || r4_preservation
          ? preservation
            ? "Préservation fertilité → DuoStim maximise le nombre d'ovocytes"
            : "≥ 2 cycles FIV avec ≤ 3 ovocytes → DuoStim pour accumulation"
          : "Mauvaises répondantes avec cycles FIV antérieurs décevants",
      freezeAll: true,
      ohssStrategy: null,
    },
    {
      id: "court",
      icon: "🏃",
      name: "Protocole Court Agoniste (Flare-up)",
      type:
        r2_poor && !sopk && !ohssHigh
          ? "★ Option — Mauvaises répondantes"
          : "Boost FSH endogène — Usage limité",
      dose: doseCourt,
      trigger: ohssHigh
        ? "Agoniste GnRH — Freeze-all"
        : "hCG (Ovitrelle 250µg)",
      strategy:
        "J2 : agoniste 0.1mg + FSH simultanément · Effet flare-up FSH endogène J1–J3 · Cycle court",
      meds: [
        "Décapeptyl 0.1mg/j dès J2",
        "rFSH " + doseCourt + " UI/j dès J2 (dose augmentée)",
        ohssHigh ? "Trigger agoniste + Freeze-all" : "hCG trigger",
      ],
      pros: "Boost FSH endogène utile en mauvaise réponse · Cycle court · Peu coûteux",
      cons: "Résultats controversés vs antagoniste · Risque pic LH prématuré · Déconseillé si SOPK",
      indication:
        r2_poor && !sopk
          ? "Option chez mauvaise répondante sans SOPK après échec antagoniste"
          : "Usage de seconde intention — préférer antagoniste ou DuoStim",
      freezeAll: ohssHigh,
      ohssStrategy: ohssHigh
        ? "Déconseillé si OHSS — préférer PPOS ou antagoniste"
        : null,
    },
    {
      id: "naturel",
      icon: "🌱",
      name: "Cycle Naturel Modifié (CNM)",
      type: r2_extremePoor
        ? "★ Option — Réserve extrêmement basse"
        : "Très faible réserve / AMH critique",
      dose: 0,
      trigger: "hCG ou Agoniste GnRH selon follicule dominant",
      strategy:
        "Suivi follicule dominant naturel · FSH 75–150 UI/j J5–J7 (CNM modifié) · 1 ovocyte attendu · Répétable",
      meds: [
        "FSH 75–150 UI/j J5–J7 (CNM modifié)",
        "hCG ou Décapeptyl trigger selon contexte",
      ],
      pros: "Aucun risque OHSS · Peu contraignant · Répétable cycles consécutifs · Accumulation progressive",
      cons: "1 seul ovocyte par cycle · Taux annulation élevé (30–40%) · Nécessite plusieurs cycles",
      indication: r2_extremePoor
        ? "AMH < 0.5 ng/mL + âge ≥ 40 → CNM ou mini-FIV sont les seules options raisonnables"
        : "AMH effondrée après échec de stimulation standard",
      freezeAll: false,
      ohssStrategy: null,
    },
    {
      id: "mini",
      icon: "🌿",
      name: "Mini-FIV — Stimulation Douce",
      type: "Faible réserve / Confort patient / Accumulation progressive",
      dose: 75,
      trigger: "hCG ou Agoniste GnRH (selon nombre follicules)",
      strategy:
        "Clomifène 50mg/j J2–J6 + FSH 75–150 UI/j J5 · Objectif 2–4 follicules · Bien toléré · Répétable",
      meds: [
        "Clomifène 50mg/j J2–J6",
        "FSH 75–150 UI/j J5",
        "hCG ou Agoniste trigger",
      ],
      pros: "Très bien toléré · Moins coûteux · Répétable · Accumulation progressive · IMC élevé",
      cons: "Moins d'ovocytes par cycle · Nécessite plusieurs tentatives pour accumuler",
      indication:
        "Faible réserve modérée, préférence patiente, ou IMC > 30 avec mauvaise accessibilité",
      freezeAll: false,
      ohssStrategy: null,
    },
  ];

  let recommendedId: string;
  if (r1_ohssCrit) recommendedId = "ppos";
  else if (r2_extremePoor)
    recommendedId = prevPoorResp ? "duostim" : "naturel";
  else if (r2_duostim) recommendedId = "duostim";
  else if (r4_preservation) recommendedId = "duostim";
  else if (r3_endo) recommendedId = "long";
  else if (ohssHigh && sopk) recommendedId = "ppos";
  else recommendedId = "antagoniste";

  protos.forEach((pt) => {
    pt.recommended = pt.id === recommendedId;
  });
  protos.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return 0;
  });
  return protos;
}

export function generateCalendar(
  proto: IvfProtocolOption,
  p: IvfPatientProfile,
  ohss: OhssRiskResult,
): IvfCalendarDay[] {
  const dose = proto.dose;
  const ohssH = ohss.level === "high" || ohss.level === "critical";
  const trigType = ohssH ? "agoniste" : "hcg";
  const fAll = proto.freezeAll || ohssH;
  const days: IvfCalendarDay[] = [];

  if (proto.id === "long") {
    days.push({
      day: "J-21",
      type: "injection",
      title: "Désensibilisation — Agoniste LP",
      detail:
        "Décapeptyl 3.75mg LP injection unique · Ou Synarel nasal 200µg ×2/j dès J21 du cycle précédent",
      tags: ["injection"],
    });
    days.push({
      day: "J1–J2",
      type: "monitoring",
      title: "Contrôle désensibilisation",
      detail:
        "Écho : absence follicule dominant, endomètre fin · E2 < 50 pg/mL · Si ok → FSH J2",
      tags: ["echo", "labo"],
    });
    days.push({
      day: "J2–J3",
      type: "key",
      title: "Début stimulation FSH",
      detail:
        "rFSH " +
        dose +
        " UI/j · Poursuite Décapeptyl 0.1mg/j jusqu'au trigger",
      tags: ["injection"],
    });
  } else if (proto.id === "court") {
    days.push({
      day: "J2",
      type: "key",
      title: "Début flare-up agoniste + FSH",
      detail:
        "Décapeptyl 0.1mg/j + rFSH " +
        dose +
        " UI/j simultanément · Effet flare FSH endogène J1–J3",
      tags: ["injection"],
    });
  } else if (proto.id === "duostim") {
    days.push({
      day: "J2–J3",
      type: "key",
      title: "Phase folliculaire — Stimulation 1",
      detail:
        "rFSH " +
        dose +
        " UI/j · Antagoniste J5–J6 · Ponction 1 → vitrification",
      tags: ["injection"],
    });
  } else if (proto.id === "ppos") {
    days.push({
      day: "J2–J3",
      type: "key",
      title: "Début PPOS — FSH + Progestérone orale",
      detail:
        "rFSH " +
        dose +
        " UI/j + Progestérone 200mg ×2/j (ou MPA 10mg/j) · Pas d'antagoniste injecté",
      tags: ["injection"],
    });
  } else if (proto.id === "naturel") {
    days.push({
      day: "J2–J3",
      type: "monitoring",
      title: "Écho de base — Surveillance follicule naturel",
      detail:
        "Suivi follicule dominant naturel · FSH 75–150 UI/j à J5 si naturel modifié · 1 ovocyte attendu",
      tags: ["echo"],
    });
  } else if (proto.id === "mini") {
    days.push({
      day: "J2–J3",
      type: "key",
      title: "Stimulation douce — Clomifène + FSH",
      detail:
        "Clomifène 50mg/j J2–J6 + FSH 75–150 UI/j J5 · Objectif 2–4 follicules · Bien toléré",
      tags: ["injection"],
    });
  } else {
    days.push({
      day: "J2–J3",
      type: "key",
      title: "Début stimulation FSH",
      detail:
        "rFSH " +
        dose +
        " UI/j (Gonal-F / Puregon / Fostimon) · Démarrage J2–J3 du cycle naturel",
      tags: ["injection"],
    });
  }

  if (proto.id !== "naturel" && proto.id !== "ppos") {
    days.push({
      day: "J5–J6",
      type: "injection",
      title: "Ajout antagoniste GnRH",
      detail:
        "Orgalutran / Cetrotide 0.25mg/j · Quand follicule ≥ 14mm OU systématiquement J5–J6 · Prévention pic LH",
      tags: ["injection"],
    });
  }
  days.push({
    day: "J6–J8",
    type: "monitoring",
    title: "1er monitoring — Écho + E2",
    detail:
      "Écho pelvienne : taille et nombre follicules, endomètre · Dosage E2 · Ajuster dose si besoin",
    tags: ["echo", "labo"],
  });
  days.push({
    day: "J8–J10",
    type: "monitoring",
    title: "Monitoring J8–J10",
    detail:
      "Écho + E2 · Step-up si E2 < 200 pg/mL · Step-down si E2 > 3000 ou > 20 follicules · Alerte OHSS",
    tags: ["echo", "labo"],
  });
  const tDay = proto.id === "naturel" ? "J10–J12" : "J10–J14";
  days.push({
    day: tDay,
    type: "trigger",
    title:
      "🎯 Trigger — " +
      (trigType === "agoniste"
        ? "Agoniste GnRH (Décapeptyl)"
        : "hCG (Ovitrelle)"),
    detail:
      trigType === "agoniste"
        ? "Décapeptyl 0.2mg SC · Critères : ≥ 3 follicules ≥ 18mm + E2 adapté · OHSS élevé → Freeze-all obligatoire"
        : "Ovitrelle 250µg SC · Critères : ≥ 3 follicules ≥ 18mm · E2 < 4000 pg/mL · Ponction H+36",
    tags: ["trigger", "labo"],
  });
  days.push({
    day: "J12–J16",
    type: "ponction",
    title: "🥚 Ponction ovocytaire (H+36)",
    detail:
      "Anesthésie · Aspiration transvaginale échoguidée · Préparation conjoint simultanée · " +
      (fAll
        ? "FREEZE-ALL → vitrification embryonnaire · TEC différé"
        : "Transfert J3 ou J5 planifié"),
    tags: ["ponction"],
  });
  if (proto.id === "duostim") {
    days.push({
      day: "J14–J16",
      type: "key",
      title: "Phase lutéale — Stimulation 2 (DuoStim)",
      detail:
        "Reprise rFSH " +
        dose +
        " UI/j · Antagoniste si nécessaire · 2e trigger + 2e ponction",
      tags: ["injection"],
    });
    days.push({
      day: "J18–J22",
      type: "ponction",
      title: "🥚 Ponction 2 — Accumulation DuoStim",
      detail:
        "Deuxième aspiration en phase lutéale · Accumulation blastos vitrifiés des 2 ponctions",
      tags: ["ponction"],
    });
  }
  days.push({
    day: fAll ? "J+4 semaines (TEC)" : "J+3 ou J+5",
    type: "monitoring",
    title: fAll
      ? "🧊 TEC — Transfert différé"
      : "🤝 Transfert embryonnaire frais",
    detail: fAll
      ? "Préparation endomètre : estrogènes + progestérone · Transfert 4–8 sem après stimulation"
      : "Progestérone vaginale 600mg/j · Transfert J3 clivage ou J5 blastocyste",
    tags: ["echo", "labo"],
  });
  days.push({
    day: "J+12 post-transfert",
    type: "monitoring",
    title: "β-hCG plasmatique",
    detail:
      "Dosage qualitatif et quantitatif · Si positif : contrôle J+15 · Écho de grossesse à 5–6 SA",
    tags: ["labo"],
  });
  return days;
}

function buildExplanation(
  p: IvfPatientProfile,
  pos: PoseidonResult,
  bol: BolognaResult,
  resp: OvarianResponseResult,
  ohss: OhssRiskResult,
): string {
  const pts: string[] = [];
  pts.push(
    "Patiente de " +
      (p.age ?? "?") +
      " ans, POSEIDON Groupe " +
      pos.group +
      " (" +
      pos.desc +
      ").",
  );
  if (p.amh !== null)
    pts.push(
      "AMH " +
        p.amh +
        " ng/mL — " +
        (p.amh < 0.5
          ? "très basse, réserve critique"
          : p.amh < 1.2
            ? "diminuée"
            : p.amh > 3.5
              ? "élevée (SOPK ?)"
              : "normale") +
        ".",
    );
  if (p.afc !== null)
    pts.push(
      "CFA " +
        p.afc +
        " follicules — " +
        (p.afc < 5
          ? "très bas"
          : p.afc < 7
            ? "bas"
            : p.afc > 20
              ? "élevé (hyperréponse probable)"
              : "normal") +
        ".",
    );
  if (bol.positive)
    pts.push(
      "Critères Bologne remplis (" +
        bol.criteria +
        "/3 — POR confirmée) : " +
        bol.details.join(", ") +
        ".",
    );
  if (p.sopk !== "non")
    pts.push(
      "SOPK identifié → stimulation douce recommandée, risque OHSS majoré.",
    );
  if (p.endo === "stade34")
    pts.push(
      "Endométriose sévère → long protocole agoniste ou antagoniste + préparation endomètre.",
    );
  pts.push(
    "Réponse prédite : " +
      resp.responseType +
      ". Risque OHSS : " +
      ohss.label +
      " — " +
      ohss.strategy +
      ".",
  );
  if (resp.prognosis !== null)
    pts.push(
      "Pronostic estimé ~" +
        resp.prognosis +
        "% par cycle (données indicatives, à contextualiser).",
    );
  return pts.join(" ");
}

export function analyzeIVF(
  profile: IvfPatientProfile,
  patientId: string,
): IvfAnalysis {
  const pos = classifyPoseidon(profile);
  const bol = classifyBologna(profile);
  const resp = classifyOvarianResponse(profile);
  const ohss = calcOhssRisk(profile);
  const protos = generateProtocols(profile, pos, bol, resp);
  const rec = protos.find((p) => p.recommended) ?? protos[0]!;
  const cal = generateCalendar(rec, profile, ohss);
  const expl = buildExplanation(profile, pos, bol, resp, ohss);
  return {
    id: "ivf_" + Date.now(),
    patientId,
    poseidon: pos,
    bologna: bol,
    response: resp,
    ohss,
    protocols: protos,
    calendar: cal,
    explanation: expl,
    selectedProtocolId: rec.id,
    createdAt: new Date().toISOString(),
  };
}

export function selectProtocol(
  analysis: IvfAnalysis,
  protocolId: string,
  profile: IvfPatientProfile,
): IvfAnalysis {
  const proto = analysis.protocols.find((p) => p.id === protocolId);
  if (!proto) return analysis;
  return {
    ...analysis,
    selectedProtocolId: protocolId,
    calendar: generateCalendar(proto, profile, analysis.ohss),
  };
}
