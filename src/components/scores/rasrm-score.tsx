"use client";

import { useMemo, useState } from "react";
import { RASRM_DEFAULT, calcRASRM, type RASRMInput } from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreInput,
  ScoreShell,
} from "./score-shell";

const FIELDS: { key: keyof RASRMInput; label: string; hint?: string }[] = [
  { key: "periS", label: "Péritoine — superficiel" },
  { key: "periP", label: "Péritoine — profond" },
  { key: "ovdS", label: "Ovaire droit — superficiel" },
  { key: "ovdE", label: "Ovaire droit — profond / endométriome" },
  { key: "ovgS", label: "Ovaire gauche — superficiel" },
  { key: "ovgE", label: "Ovaire gauche — profond / endométriome" },
  { key: "trd", label: "Adhérences trompe droite" },
  { key: "trg", label: "Adhérences trompe gauche" },
  { key: "cds", label: "Oblitération cul-de-sac Douglas" },
];

export function RASRMScore() {
  const [input, setInput] = useState<RASRMInput>(RASRM_DEFAULT);
  const result = useMemo(() => calcRASRM(input), [input]);

  function patch(key: keyof RASRMInput, val: number) {
    setInput((s) => ({ ...s, [key]: Math.max(0, Math.round(val)) }));
  }

  return (
    <ScoreShell
      title="🟣 Classification rASRM"
      tag="Endométriose"
      description="Score additif des lésions endométriosiques (Revised American Society for Reproductive Medicine)."
      result={result}
      resultIdSuffix="rasrm"
    >
      {FIELDS.map((f) => (
        <ScoreCriterion key={f.key} label={f.label}>
          <ScoreInput
            value={input[f.key]}
            onChange={(v) => patch(f.key, v)}
            min={0}
            max={40}
          />
        </ScoreCriterion>
      ))}
    </ScoreShell>
  );
}
