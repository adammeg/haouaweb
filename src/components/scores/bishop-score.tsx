"use client";

import { useMemo, useState } from "react";
import { BISHOP_DEFAULT, calcBishop, type BishopInput } from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreSelect,
  ScoreShell,
} from "./score-shell";

const DIL_OPTS = [
  { value: 0, label: "Fermé (0)" },
  { value: 1, label: "1–2 cm (1)" },
  { value: 2, label: "3–4 cm (2)" },
  { value: 3, label: "≥ 5 cm (3)" },
];
const EFF_OPTS = [
  { value: 0, label: "0–30 % (0)" },
  { value: 1, label: "40–50 % (1)" },
  { value: 2, label: "60–70 % (2)" },
  { value: 3, label: "≥ 80 % (3)" },
];
const CONS_OPTS = [
  { value: 0, label: "Ferme (0)" },
  { value: 1, label: "Moyenne (1)" },
  { value: 2, label: "Molle (2)" },
];
const POS_OPTS = [
  { value: 0, label: "Postérieure (0)" },
  { value: 1, label: "Médiane (1)" },
  { value: 2, label: "Antérieure (2)" },
];
const HAUT_OPTS = [
  { value: 0, label: "−3 (0)" },
  { value: 1, label: "−2 (1)" },
  { value: 2, label: "−1 / 0 (2)" },
  { value: 3, label: "+1 / +2 (3)" },
];

export function BishopScore() {
  const [input, setInput] = useState<BishopInput>(BISHOP_DEFAULT);
  const result = useMemo(() => calcBishop(input), [input]);

  function patch<K extends keyof BishopInput>(key: K, val: BishopInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🔵 Score de Bishop"
      tag="Maturité cervicale"
      description="Évalue la maturité du col utérin pour décider d'un déclenchement du travail."
      result={result}
      resultIdSuffix="bishop"
    >
      <ScoreCriterion label="Dilatation">
        <ScoreSelect
          value={input.dil}
          onChange={(v) => patch("dil", v as BishopInput["dil"])}
          options={DIL_OPTS}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Effacement">
        <ScoreSelect
          value={input.eff}
          onChange={(v) => patch("eff", v as BishopInput["eff"])}
          options={EFF_OPTS}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Consistance">
        <ScoreSelect
          value={input.cons}
          onChange={(v) => patch("cons", v as BishopInput["cons"])}
          options={CONS_OPTS}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Position">
        <ScoreSelect
          value={input.pos}
          onChange={(v) => patch("pos", v as BishopInput["pos"])}
          options={POS_OPTS}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Hauteur de la présentation">
        <ScoreSelect
          value={input.haut}
          onChange={(v) => patch("haut", v as BishopInput["haut"])}
          options={HAUT_OPTS}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
