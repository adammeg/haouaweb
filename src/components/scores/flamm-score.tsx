"use client";

import { useMemo, useState } from "react";
import { FLAMM_DEFAULT, calcFlamm, type FlammInput } from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreSelect,
  ScoreShell,
} from "./score-shell";

export function FlammScore() {
  const [input, setInput] = useState<FlammInput>(FLAMM_DEFAULT);
  const result = useMemo(() => calcFlamm(input), [input]);

  function patch<K extends keyof FlammInput>(key: K, val: FlammInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🟢 Score de Flamm & Geiger"
      tag="Pronostic AVAC"
      description="Score additif (0–7) prédisant le succès d'une épreuve du travail après césarienne."
      result={result}
      resultIdSuffix="flamm"
    >
      <ScoreCriterion label="Âge < 40 ans">
        <ScoreSelect
          value={input.age}
          onChange={(v) => patch("age", v as FlammInput["age"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 2, label: "Oui (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="AVB antérieur">
        <ScoreSelect
          value={input.avb}
          onChange={(v) => patch("avb", v as FlammInput["avb"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 2, label: "Oui (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Indication non récurrente">
        <ScoreSelect
          value={input.ind}
          onChange={(v) => patch("ind", v as FlammInput["ind"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Effacement à l'admission">
        <ScoreSelect
          value={input.col}
          onChange={(v) => patch("col", v as FlammInput["col"])}
          options={[
            { value: 0, label: "< 25 % (0)" },
            { value: 1, label: "25–75 % (+1)" },
            { value: 2, label: "> 75 % (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Travail spontané">
        <ScoreSelect
          value={input.travail}
          onChange={(v) => patch("travail", v as FlammInput["travail"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
