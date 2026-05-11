import type { ScoreResult } from "./types";

/**
 * Score d'Apgar (1 et 5 minutes).
 * Port fidèle de v50 (`APGAR_PARAMS` et `calcApgar`, lignes 13291–13331).
 */

export const APGAR_PARAMS = [
  {
    key: "rcf",
    label: "Fréquence cardiaque",
    opts: [
      "Absente (0)",
      "<100 bpm (1)",
      "≥100 bpm (2)",
    ],
  },
  {
    key: "resp",
    label: "Respiration",
    opts: [
      "Absente (0)",
      "Lente/irrégulière (1)",
      "Bonne / pleurs (2)",
    ],
  },
  {
    key: "tonus",
    label: "Tonus musculaire",
    opts: ["Nul (0)", "Léger (1)", "Actif (2)"],
  },
  {
    key: "react",
    label: "Réactivité (stimulus)",
    opts: ["Aucune (0)", "Grimace (1)", "Pleurs/retrait (2)"],
  },
  {
    key: "color",
    label: "Coloration cutanée",
    opts: ["Bleu/pâle (0)", "Acrocyanose (1)", "Rose (2)"],
  },
] as const;

export type ApgarParamKey = (typeof APGAR_PARAMS)[number]["key"];

export interface ApgarInput {
  /** Valeurs 0..2 par paramètre, à 1 et 5 minutes. */
  one: Record<ApgarParamKey, 0 | 1 | 2>;
  five: Record<ApgarParamKey, 0 | 1 | 2>;
}

export const APGAR_DEFAULT: ApgarInput = {
  one: { rcf: 2, resp: 2, tonus: 2, react: 2, color: 2 },
  five: { rcf: 2, resp: 2, tonus: 2, react: 2, color: 2 },
};

function sumApgar(map: Record<ApgarParamKey, 0 | 1 | 2>): number {
  return APGAR_PARAMS.reduce((s, p) => s + (map[p.key] ?? 0), 0);
}

function levelFor(score: number): {
  level: ScoreResult["level"];
  text: string;
} {
  if (score >= 7) return { level: "low", text: "Normal ✅" };
  if (score >= 4)
    return { level: "medium", text: "Dépression modérée ⚠️" };
  return { level: "high", text: "Dépression sévère 🚨" };
}

export function calcApgar(input: ApgarInput): ScoreResult {
  const s1 = sumApgar(input.one);
  const s5 = sumApgar(input.five);
  const l1 = levelFor(s1);
  const l5 = levelFor(s5);

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (s1 >= 7 && s5 >= 7) {
    level = "low";
    label = "Adaptation normale";
    interpretation =
      "<strong>Nouveau-né en bonne adaptation ✅</strong><br>Soins de routine. Surveillance standard.";
  } else if (s5 >= 7) {
    level = "medium";
    label = "Récupération satisfaisante";
    interpretation =
      "<strong>Récupération satisfaisante ⚠️</strong><br>Dépression initiale mais récupération à 5 min. Surveillance rapprochée recommandée.";
  } else if (s5 >= 4) {
    level = "high";
    label = "Dépression persistante";
    interpretation =
      "<strong>Dépression persistante ❌</strong><br>Réanimation néonatale nécessaire. Transfert en néonatologie à envisager.";
  } else {
    level = "critical";
    label = "Dépression sévère";
    interpretation =
      "<strong>Dépression sévère 🚨</strong><br>Réanimation néonatale urgente. Pédiatre / néonatologiste en urgence.";
  }

  return {
    value: `${s1}/10 (1min) — ${s5}/10 (5min)`,
    raw: s5,
    max: 10,
    level,
    label,
    interpretation,
    details: [
      { label: `1 min — ${l1.text}`, value: `${s1}/10` },
      { label: `5 min — ${l5.text}`, value: `${s5}/10` },
    ],
  };
}
