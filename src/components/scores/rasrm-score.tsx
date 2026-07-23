"use client";

import { useMemo, useState } from "react";
import { RASRM_DEFAULT, calcRASRM, type RASRMInput } from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreSelect,
  ScoreShell,
} from "./score-shell";

const FIELDS: { key: keyof RASRMInput; label: string; options: { value: number; label: string }[] }[] = [
  { key: "periS", label: "Péritoine — lésions superficielles", options: [{ value: 0, label: "Aucune (0)" }, { value: 1, label: "< 1 cm (+1)" }, { value: 2, label: "1–3 cm (+2)" }, { value: 4, label: "> 3 cm (+4)" }] },
  { key: "periP", label: "Péritoine — lésions profondes", options: [{ value: 0, label: "Aucune (0)" }, { value: 2, label: "< 1 cm (+2)" }, { value: 4, label: "1–3 cm (+4)" }, { value: 6, label: "> 3 cm (+6)" }] },
  { key: "ovdS", label: "Ovaire droit — lésions superficielles", options: [{ value: 0, label: "Aucune (0)" }, { value: 1, label: "< 1 cm (+1)" }, { value: 2, label: "1–3 cm (+2)" }, { value: 4, label: "> 3 cm (+4)" }] },
  { key: "ovdE", label: "Ovaire droit — endométriome", options: [{ value: 0, label: "Aucun (0)" }, { value: 4, label: "< 1 cm (+4)" }, { value: 16, label: "1–3 cm (+16)" }, { value: 20, label: "> 3 cm (+20)" }] },
  { key: "ovgS", label: "Ovaire gauche — lésions superficielles", options: [{ value: 0, label: "Aucune (0)" }, { value: 1, label: "< 1 cm (+1)" }, { value: 2, label: "1–3 cm (+2)" }, { value: 4, label: "> 3 cm (+4)" }] },
  { key: "ovgE", label: "Ovaire gauche — endométriome", options: [{ value: 0, label: "Aucun (0)" }, { value: 4, label: "< 1 cm (+4)" }, { value: 16, label: "1–3 cm (+16)" }, { value: 20, label: "> 3 cm (+20)" }] },
  { key: "trd", label: "Trompe droite — adhérences", options: [{ value: 0, label: "Aucune (0)" }, { value: 4, label: "Légères < 1/3 (+4)" }, { value: 8, label: "Modérées 1/3–2/3 (+8)" }, { value: 16, label: "Sévères > 2/3 (+16)" }] },
  { key: "trg", label: "Trompe gauche — adhérences", options: [{ value: 0, label: "Aucune (0)" }, { value: 4, label: "Légères < 1/3 (+4)" }, { value: 8, label: "Modérées 1/3–2/3 (+8)" }, { value: 16, label: "Sévères > 2/3 (+16)" }] },
  { key: "cds", label: "Cul-de-sac de Douglas — oblitération", options: [{ value: 0, label: "Absente (0)" }, { value: 4, label: "Partielle (+4)" }, { value: 40, label: "Complète (+40)" }] },
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
          <ScoreSelect
            value={input[f.key]}
            onChange={(v) => patch(f.key, v)}
            options={f.options}
          />
        </ScoreCriterion>
      ))}
    </ScoreShell>
  );
}
