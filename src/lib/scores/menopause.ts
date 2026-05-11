import type { ScoreResult } from "./types";

/**
 * Scores Ménopause : Greene (21 items, 4 catégories) et Kupperman (11 items pondérés).
 * Port fidèle de v50 (lignes 22369–22468).
 */

export type GreeneCat =
  | "vasomoteur"
  | "somatique"
  | "anxiete"
  | "depression"
  | "sexuel";

export const GREENE_ITEMS: { id: string; label: string; cat: GreeneCat }[] = [
  { id: "gr-1", label: "Battements de cœur", cat: "vasomoteur" },
  {
    id: "gr-2",
    label: "Sensation de chaleur dans la tête ou le corps (bouffées)",
    cat: "vasomoteur",
  },
  { id: "gr-3", label: "Sudation nocturne", cat: "vasomoteur" },
  { id: "gr-4", label: "Difficultés à vous endormir", cat: "somatique" },
  { id: "gr-5", label: "Sensation de manque d'air", cat: "somatique" },
  {
    id: "gr-6",
    label: "Fourmillements dans les mains ou les pieds",
    cat: "somatique",
  },
  { id: "gr-7", label: "Maux de tête", cat: "somatique" },
  {
    id: "gr-8",
    label: "Sensations musculaires ou articulaires",
    cat: "somatique",
  },
  {
    id: "gr-9",
    label: "Impression de perdre le contrôle de soi",
    cat: "anxiete",
  },
  { id: "gr-10", label: "Anxiété, nervosité", cat: "anxiete" },
  { id: "gr-11", label: "Attaques de panique", cat: "anxiete" },
  { id: "gr-12", label: "Difficultés à se concentrer", cat: "anxiete" },
  { id: "gr-13", label: "Fatigue ou manque d'énergie", cat: "depression" },
  {
    id: "gr-14",
    label: "Manque d'intérêt pour les choses",
    cat: "depression",
  },
  { id: "gr-15", label: "Sentiment de tristesse ou déprime", cat: "depression" },
  { id: "gr-16", label: "Pleurs", cat: "depression" },
  { id: "gr-17", label: "Irritabilité", cat: "depression" },
  { id: "gr-18", label: "Sécheresse vaginale", cat: "sexuel" },
  { id: "gr-19", label: "Diminution du désir sexuel", cat: "sexuel" },
  { id: "gr-20", label: "Douleurs lors des rapports sexuels", cat: "sexuel" },
  { id: "gr-21", label: "Sensation de gonflement", cat: "somatique" },
];

export const GREENE_CAT_LABELS: Record<GreeneCat, string> = {
  vasomoteur: "🔥 Symptômes vasomoteurs",
  somatique: "🩺 Symptômes somatiques",
  anxiete: "😰 Anxiété",
  depression: "😔 Humeur / dépression",
  sexuel: "💙 Symptômes sexuels",
};

export type GreeneInput = Record<string, 0 | 1 | 2 | 3>;

export function greeneDefault(): GreeneInput {
  return Object.fromEntries(GREENE_ITEMS.map((i) => [i.id, 0])) as GreeneInput;
}

export function calcGreene(input: GreeneInput): ScoreResult {
  const total = GREENE_ITEMS.reduce((s, i) => s + (input[i.id] ?? 0), 0);
  const vasomo = ["gr-1", "gr-2", "gr-3"].reduce(
    (s, id) => s + (input[id] ?? 0),
    0,
  );
  const anxiete = ["gr-9", "gr-10", "gr-11", "gr-12"].reduce(
    (s, id) => s + (input[id] ?? 0),
    0,
  );
  const depot = ["gr-13", "gr-14", "gr-15", "gr-16", "gr-17"].reduce(
    (s, id) => s + (input[id] ?? 0),
    0,
  );

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (total < 15) {
    level = "low";
    label = "Symptômes légers";
    interpretation = "Réassurance + mode de vie.";
  } else if (total < 30) {
    level = "medium";
    label = "Symptômes modérés";
    interpretation = "Suivi clinique + mesures hygiéno-diététiques.";
  } else {
    level = "high";
    label = "Symptômes sévères";
    interpretation = "THM à discuter selon bilan cardio-vasculaire.";
  }

  return {
    value: `${total} / 63`,
    raw: total,
    max: 63,
    level,
    label,
    interpretation,
    details: [
      { label: "Vasomoteur", value: `${vasomo}/9` },
      { label: "Anxiété", value: `${anxiete}/12` },
      { label: "Humeur", value: `${depot}/15` },
    ],
  };
}

export interface KuppermanItem {
  id: string;
  label: string;
  coef: number;
}

export const KUPPERMAN_ITEMS: KuppermanItem[] = [
  { id: "kp-1", label: "Bouffées de chaleur", coef: 4 },
  { id: "kp-2", label: "Sudation", coef: 2 },
  { id: "kp-3", label: "Troubles du sommeil", coef: 2 },
  { id: "kp-4", label: "Nervosité", coef: 2 },
  { id: "kp-5", label: "Dépression / irritabilité", coef: 1 },
  { id: "kp-6", label: "Vertiges", coef: 1 },
  { id: "kp-7", label: "Fatigue", coef: 1 },
  { id: "kp-8", label: "Arthralgie / myalgie", coef: 1 },
  { id: "kp-9", label: "Céphalées", coef: 1 },
  { id: "kp-10", label: "Palpitations", coef: 1 },
  { id: "kp-11", label: "Paresthésies", coef: 1 },
];

export type KuppermanInput = Record<string, 0 | 1 | 2 | 3>;

export function kuppermanDefault(): KuppermanInput {
  return Object.fromEntries(
    KUPPERMAN_ITEMS.map((i) => [i.id, 0]),
  ) as KuppermanInput;
}

export function calcKupperman(input: KuppermanInput): ScoreResult {
  const total = KUPPERMAN_ITEMS.reduce(
    (s, i) => s + (input[i.id] ?? 0) * i.coef,
    0,
  );

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (total < 15) {
    level = "low";
    label = "Léger (< 15)";
    interpretation =
      "Pas de traitement hormonal requis en première intention. Conseils hygiéno-diététiques.";
  } else if (total < 35) {
    level = "medium";
    label = "Modéré (15–34)";
    interpretation =
      "THM à discuter selon bilan et contre-indications. Phytothérapie envisageable.";
  } else {
    level = "high";
    label = "Sévère (≥ 35)";
    interpretation =
      "THM recommandé si pas de contre-indication. Bilan cardio-vasculaire préalable.";
  }

  return {
    value: `${total} / 51`,
    raw: total,
    max: 51,
    level,
    label,
    interpretation,
  };
}
