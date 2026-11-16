"use client";

import { useMemo, useState } from "react";
import { ROMA_DEFAULT, calcROMA, type ROMAInput } from "@/lib/scores";
import { ROMA_THRESHOLDS, type RomaAssay } from "@/lib/scores/roma";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

export function ROMAScore() {
  const [input, setInput] = useState<ROMAInput>(ROMA_DEFAULT);
  const result = useMemo(() => calcROMA(input), [input]);

  function patch<K extends keyof ROMAInput>(key: K, val: ROMAInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🔬 ROMA"
      tag="Risque malignité ovarienne"
      description="Risk of Ovarian Malignancy Algorithm (CA-125 + HE4). Le seuil dépend de la technique de dosage : choisir celle du laboratoire."
      result={result}
      resultIdSuffix="roma"
    >
      <ScoreCriterion label="CA-125 (U/mL)">
        <ScoreInput
          value={input.ca125}
          onChange={(v) => patch("ca125", v)}
          min={1}
          max={5000}
        />
      </ScoreCriterion>
      <ScoreCriterion label="HE4 (pmol/L)">
        <ScoreInput value={input.he4} onChange={(v) => patch("he4", v)} min={1} max={2000} />
      </ScoreCriterion>
      <ScoreCriterion label="Statut ménopausique">
        <select
          value={input.postmenopause ? "post" : "pre"}
          onChange={(e) => patch("postmenopause", e.target.value === "post")}
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm sm:min-w-[200px]"
        >
          <option value="post">Post-ménopause</option>
          <option value="pre">Pré-ménopause</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Technique de dosage">
        <select
          value={input.assay ?? "roche"}
          onChange={(e) => patch("assay", e.target.value as RomaAssay)}
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm sm:min-w-[200px]"
        >
          {(Object.keys(ROMA_THRESHOLDS) as RomaAssay[]).map((k) => (
            <option key={k} value={k}>
              {ROMA_THRESHOLDS[k].label} ({ROMA_THRESHOLDS[k].pre}% / {ROMA_THRESHOLDS[k].post}%)
            </option>
          ))}
        </select>
      </ScoreCriterion>
    </ScoreShell>
  );
}
