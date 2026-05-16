import { insufficient, scoreOut } from "./helpers";
import type { AssistProfile, RiskLevel } from "./types";
import { DOMAIN, RISK } from "./types";

export function scoreROMA(p: AssistProfile) {
  if (!p.ca125 || !p.he4) return null;
  const post = p.is_postmenopause || (p.age != null && p.age >= 51);
  const pi = post
    ? -8.09 + 1.04 * Math.log(p.he4) + 0.732 * Math.log(p.ca125)
    : -12.0 + 2.38 * Math.log(p.he4) + 0.0626 * Math.log(p.ca125);
  const roma = (Math.exp(pi) / (1 + Math.exp(pi))) * 100;
  const thr = post ? 25.3 : 11.4;
  const mnm = post ? "post" : "pré";
  if (roma >= thr)
    return scoreOut(
      "ROMA",
      DOMAIN.GYN,
      `${roma.toFixed(1)}%`,
      RISK.HIGH,
      `🔴 ROMA ÉLEVÉ ${roma.toFixed(1)}% ≥ seuil ${thr}% (${mnm}-ménopause)`,
      "high",
      ["🔴 RCP oncologique dans les 2 semaines", "IRM pelvienne si non faite"],
      [],
      { roma: +roma.toFixed(2), threshold: thr },
    );
  return scoreOut(
    "ROMA",
    DOMAIN.GYN,
    `${roma.toFixed(1)}%`,
    RISK.LOW,
    `✅ ROMA faible ${roma.toFixed(1)}% < ${thr}% (${mnm}-ménopause)`,
    "high",
    ["Suivi échographique 3 mois"],
  );
}

export function scoreADNEX(p: AssistProfile) {
  if (!p.ca125 || !p.cyst_max_diameter_mm) return null;
  const ca125 = Math.log(Math.max(1, p.ca125));
  const diam = Math.log(Math.max(1, p.cyst_max_diameter_mm));
  const solid = (p.cyst_solid_pct || 0) / 100;
  const pap = Math.min(4, p.cyst_papillary_projections || 0);
  const shadow = p.cyst_acoustic_shadows ? 1 : 0;
  const ascite = p.cyst_ascites ? 1 : 0;
  const center = p.oncology_center ? 1 : 0;
  const logit =
    -5.303 +
    0.0222 * (p.age || 50) +
    0.618 * ca125 +
    0.328 * diam +
    1.54 * solid +
    0.537 * pap -
    0.959 * shadow +
    1.023 * ascite +
    0.48 * center;
  const prob = 1 / (1 + Math.exp(-logit));
  const pct = (prob * 100).toFixed(1);
  const conf =
    p.cyst_solid_pct != null && p.cyst_papillary_projections != null
      ? "high"
      : "moderate";

  if (prob >= 0.3)
    return scoreOut(
      "ADNEX_Simplified",
      DOMAIN.GYN,
      `${pct}%`,
      RISK.HIGH,
      `🔴 ADNEX — Risque malignité ${pct}%`,
      conf,
      ["🔴 RCP oncogynécologique URGENT", "IRM pelvienne"],
      [],
      { prob_pct: +pct },
      "Score simplifié IOTA — confirmer sur calculateur officiel.",
    );
  if (prob >= 0.1)
    return scoreOut(
      "ADNEX_Simplified",
      DOMAIN.GYN,
      `${pct}%`,
      RISK.INTERMEDIATE,
      `⚠️ ADNEX — Risque intermédiaire ${pct}%`,
      conf,
      ["Centre de référence oncogynécologie"],
    );
  return scoreOut(
    "ADNEX_Simplified",
    DOMAIN.GYN,
    `${pct}%`,
    RISK.LOW,
    `✅ ADNEX — Risque faible ${pct}%`,
    conf,
    ["Suivi écho 3 mois"],
  );
}

export function scorePOPQ(p: AssistProfile) {
  if (!p.is_prolapse && p.popq_ba == null) return null;
  const REQ = [
    "popq_aa",
    "popq_ba",
    "popq_c",
    "popq_gh",
    "popq_pb",
    "popq_tvl",
    "popq_ap",
    "popq_bp",
    "popq_d",
  ] as const;
  const missing = REQ.filter((f) => p[f] == null);
  if (missing.length) return insufficient("POP_Q", DOMAIN.GYN, [...missing]);
  const tvl = p.popq_tvl!;
  const dis = Math.max(
    ...[p.popq_aa, p.popq_ba, p.popq_c, p.popq_ap, p.popq_bp].filter(
      (v): v is number => v != null,
    ),
  );
  let stage = 0;
  if (dis >= tvl - 2) stage = 4;
  else if (dis > 1) stage = 3;
  else if (dis >= -1) stage = 2;
  else if (dis > -tvl) stage = 1;
  const SD: Record<number, [RiskLevel, string, string[]]> = {
    0: [RISK.LOW, "Stade 0", ["Rééducation préventive"]],
    1: [RISK.LOW, "Stade I", ["Rééducation", "Surveillance annuelle"]],
    2: [
      RISK.INTERMEDIATE,
      "Stade II",
      ["Rééducation intensifiée", "Pessaire", "PFDI-20"],
    ],
    3: [
      RISK.HIGH,
      "Stade III",
      ["Pessaire correction", "Évaluation chirurgicale"],
    ],
    4: [
      RISK.CRITICAL,
      "Stade IV",
      ["Chirurgie quasi systématique", "Centre expert"],
    ],
  };
  const [risk, label, actions] = SD[stage];
  return scoreOut(
    "POP_Q",
    DOMAIN.GYN,
    `Stade ${stage}`,
    risk,
    `POP-Q ${label}`,
    "high",
    actions,
    [],
    { stage },
  );
}

export function scorePFDI20(p: AssistProfile) {
  const items = p.pfdi20_items;
  if (!items || !Array.isArray(items)) return null;
  if (items.length !== 20)
    return scoreOut(
      "PFDI_20_Scorer",
      DOMAIN.GYN,
      null,
      RISK.UNKNOWN,
      `PFDI-20: ${items.length} items fournis, 20 requis`,
      "low",
      [],
      ["pfdi20_items"],
    );
  const sub = (arr: number[]) => {
    const answered = arr.filter((v) => v != null);
    if (!answered.length) return 0;
    const mean = answered.reduce((a, b) => a + b, 0) / arr.length;
    return +(mean * 25).toFixed(1);
  };
  const popdi = sub(items.slice(0, 6));
  const cradi = sub(items.slice(6, 14));
  const udi = sub(items.slice(14, 20));
  const total = +(popdi + cradi + udi).toFixed(1);
  if (total >= 150)
    return scoreOut(
      "PFDI_20_Scorer",
      DOMAIN.GYN,
      `${total}/300`,
      RISK.HIGH,
      `🔴 PFDI-20 SÉVÈRE — ${total}/300`,
      "high",
      ["Chirurgie à programmer si échec pessaire"],
      [],
      { total },
    );
  if (total >= 75)
    return scoreOut(
      "PFDI_20_Scorer",
      DOMAIN.GYN,
      `${total}/300`,
      RISK.INTERMEDIATE,
      `⚠️ PFDI-20 Modéré — ${total}/300`,
      "high",
      ["Rééducation périnéale 20 séances"],
    );
  return scoreOut(
    "PFDI_20_Scorer",
    DOMAIN.GYN,
    `${total}/300`,
    RISK.LOW,
    `🟢 PFDI-20 léger-normal — ${total}/300`,
    "high",
    ["Rééducation périnéale 10 séances"],
  );
}
