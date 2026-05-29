"use client";

import { useMemo, useState } from "react";
import { ADNEX_DEFAULT, calcADNEX, type ADNEXInput } from "@/lib/scores";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

export function ADNEXScore() {
  const [input, setInput] = useState<ADNEXInput>(ADNEX_DEFAULT);
  const result = useMemo(() => calcADNEX(input), [input]);

  function patch<K extends keyof ADNEXInput>(key: K, val: ADNEXInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🧪 ADNEX (IOTA simplifié)"
      tag="Masse annexielle"
      description="Estimation du risque de malignité d'une masse ovarienne (modèle simplifié Van Calster / IOTA)."
      result={result}
      resultIdSuffix="adnex"
    >
      <ScoreCriterion label="Âge (ans)">
        <ScoreInput value={input.age} onChange={(v) => patch("age", v)} min={15} max={90} />
      </ScoreCriterion>
      <ScoreCriterion label="CA-125 (U/mL)">
        <ScoreInput
          value={input.ca125}
          onChange={(v) => patch("ca125", v)}
          min={1}
          max={5000}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Diamètre max. kyste (mm)">
        <ScoreInput
          value={input.cystMaxMm}
          onChange={(v) => patch("cystMaxMm", v)}
          min={5}
          max={300}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Composante solide (%)">
        <ScoreInput
          value={input.solidPct}
          onChange={(v) => patch("solidPct", v)}
          min={0}
          max={100}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Proj. papillaires (0–4)">
        <ScoreInput
          value={input.papillaryProjections}
          onChange={(v) => patch("papillaryProjections", v)}
          min={0}
          max={4}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Ombres acoustiques">
        <select
          value={input.acousticShadows ? "1" : "0"}
          onChange={(e) => patch("acousticShadows", e.target.value === "1")}
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="0">Non</option>
          <option value="1">Oui</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Ascite">
        <select
          value={input.ascites ? "1" : "0"}
          onChange={(e) => patch("ascites", e.target.value === "1")}
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="0">Non</option>
          <option value="1">Oui</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Centre oncologie">
        <select
          value={input.oncologyCenter ? "1" : "0"}
          onChange={(e) => patch("oncologyCenter", e.target.value === "1")}
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="0">Non</option>
          <option value="1">Oui</option>
        </select>
      </ScoreCriterion>
    </ScoreShell>
  );
}
