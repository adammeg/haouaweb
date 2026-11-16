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
      description="Score additif (0–10) évalué à l'admission en travail, estimant le succès d'une tentative de voie basse après césarienne (Flamm & Geiger 1997)."
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
      <ScoreCriterion label="Accouchement par voie basse antérieur">
        <ScoreSelect
          value={input.avb}
          onChange={(v) => patch("avb", v as FlammInput["avb"])}
          options={[
            { value: 0, label: "Aucun (0)" },
            { value: 1, label: "Avant la césarienne (+1)" },
            { value: 2, label: "Après la césarienne (+2)" },
            { value: 4, label: "Avant et après la césarienne (+4)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="1re césarienne pour un motif autre que stagnation de la dilatation">
        <ScoreSelect
          value={input.ind}
          onChange={(v) => patch("ind", v as FlammInput["ind"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Effacement du col à l'admission">
        <ScoreSelect
          value={input.effacement}
          onChange={(v) => patch("effacement", v as FlammInput["effacement"])}
          options={[
            { value: 0, label: "< 25 % (0)" },
            { value: 1, label: "25–75 % (+1)" },
            { value: 2, label: "> 75 % (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Dilatation à l'admission">
        <ScoreSelect
          value={input.dilatation}
          onChange={(v) => patch("dilatation", v as FlammInput["dilatation"])}
          options={[
            { value: 0, label: "< 4 cm (0)" },
            { value: 1, label: "≥ 4 cm (+1)" },
          ]}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
