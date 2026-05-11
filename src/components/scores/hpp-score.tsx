"use client";

import { useMemo, useState } from "react";
import { HPP_DEFAULT, calcHPP, type HPPInput } from "@/lib/scores";
import { ScoreCriterion, ScoreSelect, ScoreShell } from "./score-shell";

export function HPPScore() {
  const [input, setInput] = useState<HPPInput>(HPP_DEFAULT);
  const result = useMemo(() => calcHPP(input), [input]);

  function patch<K extends keyof HPPInput>(key: K, val: HPPInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🩸 Risque HPP"
      tag="Prévention HPP"
      description="Évaluation des facteurs de risque d'HPP avant l'accouchement. Score cumulatif — risque élevé ≥ 3 points."
      result={result}
      resultIdSuffix="hpp"
    >
      <ScoreCriterion label="Utérus cicatriciel">
        <ScoreSelect
          value={input.cicat}
          onChange={(v) => patch("cicat", v as HPPInput["cicat"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "1 césarienne (+1)" },
            { value: 2, label: "≥ 2 césariennes (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Multiparité (≥ 4)">
        <ScoreSelect
          value={input.multi}
          onChange={(v) => patch("multi", v as HPPInput["multi"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Macrosomie / gémellité">
        <ScoreSelect
          value={input.macro}
          onChange={(v) => patch("macro", v as HPPInput["macro"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Macrosomie (+1)" },
            { value: 2, label: "Gémellité (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Placenta praevia / accreta">
        <ScoreSelect
          value={input.placenta}
          onChange={(v) => patch("placenta", v as HPPInput["placenta"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Praevia (+1)" },
            { value: 2, label: "Accreta (+2)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Trouble de la coagulation">
        <ScoreSelect
          value={input.coag}
          onChange={(v) => patch("coag", v as HPPInput["coag"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Anémie sévère">
        <ScoreSelect
          value={input.anemie}
          onChange={(v) => patch("anemie", v as HPPInput["anemie"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Travail prolongé">
        <ScoreSelect
          value={input.travail}
          onChange={(v) => patch("travail", v as HPPInput["travail"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="ATCD d'HPP">
        <ScoreSelect
          value={input.atcd}
          onChange={(v) => patch("atcd", v as HPPInput["atcd"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Chorioamniotite / fièvre">
        <ScoreSelect
          value={input.infection}
          onChange={(v) => patch("infection", v as HPPInput["infection"])}
          options={[
            { value: 0, label: "Non (0)" },
            { value: 1, label: "Oui (+1)" },
          ]}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
