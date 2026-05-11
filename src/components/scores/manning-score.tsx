"use client";

import { useMemo, useState } from "react";
import {
  MANNING_DEFAULT,
  calcManning,
  type ManningInput,
} from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreSelect,
  ScoreShell,
} from "./score-shell";

const BIN_OPTS = (zero: string, two: string) => [
  { value: 0, label: zero + " (0)" },
  { value: 2, label: two + " (2)" },
];

export function ManningScore() {
  const [input, setInput] = useState<ManningInput>(MANNING_DEFAULT);
  const result = useMemo(() => calcManning(input), [input]);

  function patch<K extends keyof ManningInput>(key: K, val: ManningInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="👶 Score de Manning"
      tag="Bien-être fœtal"
      description="Profil biophysique du fœtus : RCF, mouvements respiratoires, mouvements actifs, tonus, liquide amniotique."
      result={result}
      resultIdSuffix="manning"
    >
      <ScoreCriterion label="RCF non stressant">
        <ScoreSelect
          value={input.rcf}
          onChange={(v) => patch("rcf", v as ManningInput["rcf"])}
          options={BIN_OPTS("Anormal / non réactif", "Réactif (≥2 accélérations)")}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Mouvements respiratoires">
        <ScoreSelect
          value={input.resp}
          onChange={(v) => patch("resp", v as ManningInput["resp"])}
          options={BIN_OPTS("Absents / <30 s", "≥1 épisode de 30 s en 30 min")}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Mouvements actifs">
        <ScoreSelect
          value={input.mov}
          onChange={(v) => patch("mov", v as ManningInput["mov"])}
          options={BIN_OPTS("<3 mouvements", "≥3 mouvements en 30 min")}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Tonus fœtal">
        <ScoreSelect
          value={input.tonus}
          onChange={(v) => patch("tonus", v as ManningInput["tonus"])}
          options={BIN_OPTS("Absent / hypotonie", "≥1 extension/flexion active")}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Liquide amniotique">
        <ScoreSelect
          value={input.la}
          onChange={(v) => patch("la", v as ManningInput["la"])}
          options={BIN_OPTS("Oligoamnios (citerne <2 cm)", "Normal (citerne ≥2 cm)")}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
