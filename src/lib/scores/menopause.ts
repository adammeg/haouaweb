import type { ScoreResult } from "./types";

/**
 * Échelles de symptômes de la ménopause.
 * - Greene Climacteric Scale (Greene 1998) : 21 items cotés 0–3, sous-échelles publiées.
 * - Indice de Kupperman (Kupperman 1953) : 11 symptômes pondérés.
 * Outils de suivi : aucun seuil ne dicte à lui seul l'indication d'un traitement hormonal.
 */

export type GreeneCat =
  | "anxiete"
  | "depression"
  | "somatique"
  | "vasomoteur"
  | "sexuel";

export const GREENE_ITEMS: { id: string; label: string; cat: GreeneCat }[] = [
  { id: "gr-1", label: "Cœur qui bat vite ou fort", cat: "anxiete" },
  { id: "gr-2", label: "Sensation de tension ou de nervosité", cat: "anxiete" },
  { id: "gr-3", label: "Difficultés à dormir", cat: "anxiete" },
  { id: "gr-4", label: "Excitabilité", cat: "anxiete" },
  { id: "gr-5", label: "Crises de panique", cat: "anxiete" },
  { id: "gr-6", label: "Difficultés à se concentrer", cat: "anxiete" },
  { id: "gr-7", label: "Fatigue ou manque d'énergie", cat: "depression" },
  { id: "gr-8", label: "Perte d'intérêt pour la plupart des choses", cat: "depression" },
  { id: "gr-9", label: "Sentiment de tristesse ou de dépression", cat: "depression" },
  { id: "gr-10", label: "Crises de larmes", cat: "depression" },
  { id: "gr-11", label: "Irritabilité", cat: "depression" },
  { id: "gr-12", label: "Vertiges ou sensation de malaise", cat: "somatique" },
  { id: "gr-13", label: "Sensation de pression ou de tension dans la tête ou le corps", cat: "somatique" },
  { id: "gr-14", label: "Engourdissements ou fourmillements dans certaines parties du corps", cat: "somatique" },
  { id: "gr-15", label: "Maux de tête", cat: "somatique" },
  { id: "gr-16", label: "Douleurs musculaires et articulaires", cat: "somatique" },
  { id: "gr-17", label: "Perte de sensibilité des mains ou des pieds", cat: "somatique" },
  { id: "gr-18", label: "Difficultés à respirer", cat: "somatique" },
  { id: "gr-19", label: "Bouffées de chaleur", cat: "vasomoteur" },
  { id: "gr-20", label: "Sueurs nocturnes", cat: "vasomoteur" },
  { id: "gr-21", label: "Perte d'intérêt pour la sexualité", cat: "sexuel" },
];

export const GREENE_CAT_LABELS: Record<GreeneCat, string> = {
  anxiete: "😰 Psychologique — anxiété (items 1–6)",
  depression: "😔 Psychologique — dépression (items 7–11)",
  somatique: "🩺 Somatique (items 12–18)",
  vasomoteur: "🔥 Vasomoteur (items 19–20)",
  sexuel: "💙 Sexuel (item 21)",
};

export type GreeneInput = Record<string, 0 | 1 | 2 | 3>;

export function greeneDefault(): GreeneInput {
  return Object.fromEntries(GREENE_ITEMS.map((i) => [i.id, 0])) as GreeneInput;
}

function greeneSub(input: GreeneInput, cat: GreeneCat): number {
  return GREENE_ITEMS.filter((i) => i.cat === cat).reduce(
    (s, i) => s + (input[i.id] ?? 0),
    0,
  );
}

export function calcGreene(input: GreeneInput): ScoreResult {
  const anxiete = greeneSub(input, "anxiete");
  const depression = greeneSub(input, "depression");
  const somatique = greeneSub(input, "somatique");
  const vasomoteur = greeneSub(input, "vasomoteur");
  const sexuel = greeneSub(input, "sexuel");
  const total = anxiete + depression + somatique + vasomoteur + sexuel;
  const severeItems = GREENE_ITEMS.filter((i) => (input[i.id] ?? 0) === 3).length;

  let level: ScoreResult["level"];
  let label: string;
  if (total === 0) {
    level = "low";
    label = "Aucun symptôme rapporté";
  } else if (severeItems > 0 || vasomoteur >= 4) {
    level = "medium";
    label = "Symptômes marqués";
  } else {
    level = "low";
    label = "Symptômes présents";
  }

  return {
    value: `${total} / 63`,
    raw: total,
    max: 63,
    level,
    label,
    interpretation:
      "Échelle de Greene : outil de description et de suivi des symptômes, sans seuil de sévérité validé. Comparer les scores dans le temps et par sous-échelle. L'indication d'un traitement hormonal repose sur la gêne ressentie, les contre-indications et la balance bénéfice-risque (CNGOF/GEMVi 2021).",
    details: [
      { label: "Anxiété", value: `${anxiete}/18` },
      { label: "Dépression", value: `${depression}/15` },
      { label: "Somatique", value: `${somatique}/21` },
      { label: "Vasomoteur", value: `${vasomoteur}/6` },
      { label: "Sexuel", value: `${sexuel}/3` },
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
  { id: "kp-2", label: "Paresthésies", coef: 2 },
  { id: "kp-3", label: "Insomnie", coef: 2 },
  { id: "kp-4", label: "Nervosité", coef: 2 },
  { id: "kp-5", label: "Mélancolie", coef: 1 },
  { id: "kp-6", label: "Vertiges", coef: 1 },
  { id: "kp-7", label: "Fatigue", coef: 1 },
  { id: "kp-8", label: "Arthralgies / myalgies", coef: 1 },
  { id: "kp-9", label: "Céphalées", coef: 1 },
  { id: "kp-10", label: "Palpitations", coef: 1 },
  { id: "kp-11", label: "Fourmillements", coef: 1 },
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
  if (total < 15) {
    level = "low";
    label = "Léger (< 15)";
  } else if (total < 35) {
    level = "medium";
    label = "Modéré (15–34)";
  } else {
    level = "high";
    label = "Sévère (≥ 35)";
  }

  return {
    value: `${total} / 51`,
    raw: total,
    max: 51,
    level,
    label,
    interpretation:
      "Indice de Kupperman : classes de sévérité d'usage courant, sans validation psychométrique moderne ; il ne mesure ni les symptômes génito-urinaires ni la sexualité. Le traitement hormonal se discute selon la gêne, les contre-indications et la balance bénéfice-risque (CNGOF/GEMVi 2021), pas sur ce seul chiffre.",
  };
}
