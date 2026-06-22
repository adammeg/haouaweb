"use client";

import { useMemo, useState } from "react";
import {
  calcCTG,
  CTG_DEFAULT,
  type CTGInput,
  type CtgAccel,
  type CtgDecel,
  type CtgVaria,
} from "@/lib/scores/ctg";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

const SELECT_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[200px]";

export function CTGScore() {
  const [input, setInput] = useState<CTGInput>(CTG_DEFAULT);
  const result = useMemo(() => calcCTG(input), [input]);

  function patch<K extends keyof CTGInput>(k: K, v: CTGInput[K]) {
    setInput((s) => ({ ...s, [k]: v }));
  }

  return (
    <ScoreShell
      title="🫀 CTG — FIGO 2015"
      tag="Monitoring fœtal"
      description="Classification cardiotocographique intrapartum."
      result={result}
    >
      <ScoreCriterion label="FCF (bpm)">
        <ScoreInput value={input.fcf} onChange={(v) => patch("fcf", v)} min={60} max={220} />
      </ScoreCriterion>
      <ScoreCriterion label="Variabilité">
        <select
          className={SELECT_CLS}
          value={input.varia}
          onChange={(e) => patch("varia", e.target.value as CtgVaria)}
        >
          <option value="5_25">5–25 bpm (normale)</option>
          <option value="lt5">&lt; 5 bpm</option>
          <option value="sinusoidal">Sinusoïdal</option>
        </select>
      </ScoreCriterion>
      {input.varia === "lt5" ? (
        <ScoreCriterion label="Durée variabilité &lt; 5 (min)">
          <ScoreInput
            value={input.dureeVariaLt5}
            onChange={(v) => patch("dureeVariaLt5", v)}
            min={0}
            max={120}
          />
        </ScoreCriterion>
      ) : null}
      <ScoreCriterion label="Accélérations">
        <select
          className={SELECT_CLS}
          value={input.accel}
          onChange={(e) => patch("accel", e.target.value as CtgAccel)}
        >
          <option value="presentes">Présentes</option>
          <option value="absentes">Absentes</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Décélérations">
        <select
          className={SELECT_CLS}
          value={input.decel}
          onChange={(e) => patch("decel", e.target.value as CtgDecel)}
        >
          <option value="aucune">Aucune</option>
          <option value="variables_legeres">Variables légères</option>
          <option value="variables_severes">Variables sévères</option>
          <option value="tardives">Tardives</option>
          <option value="prolongees">Prolongées</option>
        </select>
      </ScoreCriterion>
    </ScoreShell>
  );
}
