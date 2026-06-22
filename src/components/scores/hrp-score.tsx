"use client";

import { useMemo, useState } from "react";
import {
  calcHRP,
  HRP_DEFAULT,
  type HRPInput,
  type HrpFoetal,
} from "@/lib/scores/hrp";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

const SELECT_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[180px]";

export function HRPScore() {
  const [input, setInput] = useState<HRPInput>(HRP_DEFAULT);
  const result = useMemo(() => calcHRP(input), [input]);

  function patch<K extends keyof HRPInput>(k: K, v: HRPInput[K]) {
    setInput((s) => ({ ...s, [k]: v }));
  }

  return (
    <ScoreShell
      title="🩸 HRP"
      tag="Grades Sher 1985"
      description="Hématome rétroplacentaire — classification et urgence."
      result={result}
    >
      <ScoreCriterion label="État fœtal">
        <select
          className={SELECT_CLS}
          value={input.foetal}
          onChange={(e) => patch("foetal", e.target.value as HrpFoetal)}
        >
          <option value="normal">Normal</option>
          <option value="bradycardie">Bradycardie / SFA</option>
          <option value="mfiu">MFIU</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Fibrinogène (g/L)">
        <ScoreInput value={input.fibrinogen} onChange={(v) => patch("fibrinogen", v)} min={0} max={10} step={0.1} />
      </ScoreCriterion>
      <ScoreCriterion label="Plaquettes (G/L)">
        <ScoreInput value={input.platelets} onChange={(v) => patch("platelets", v)} min={0} max={500} />
      </ScoreCriterion>
      <ScoreCriterion label="TP (%)">
        <ScoreInput value={input.tp} onChange={(v) => patch("tp", v)} min={0} max={100} />
      </ScoreCriterion>
    </ScoreShell>
  );
}
