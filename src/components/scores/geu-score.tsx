"use client";

import { useMemo, useState } from "react";
import {
  calcGEU,
  GEU_DEFAULT,
  type GEUInput,
  type GeuHemody,
  type GeuMasse,
  type GeuSiu,
} from "@/lib/scores/geu";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

const SELECT_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[180px]";

export function GEUScore() {
  const [input, setInput] = useState<GEUInput>(GEU_DEFAULT);
  const result = useMemo(() => calcGEU(input), [input]);

  function patch<K extends keyof GEUInput>(k: K, v: GEUInput[K]) {
    setInput((s) => ({ ...s, [k]: v }));
  }

  return (
    <ScoreShell
      title="⚠️ GEU"
      tag="ACOG · CNGOF"
      description="Grossesse extra-utérine — critères MTX vs chirurgie."
      result={result}
    >
      <ScoreCriterion label="βhCG J0 (UI/L)">
        <ScoreInput value={input.bhcg} onChange={(v) => patch("bhcg", v)} min={0} max={100000} />
      </ScoreCriterion>
      <ScoreCriterion label="βhCG J2 (UI/L)">
        <ScoreInput value={input.bhcgJ2} onChange={(v) => patch("bhcgJ2", v)} min={0} max={100000} />
      </ScoreCriterion>
      <ScoreCriterion label="Sac intra-utérin">
        <select
          className={SELECT_CLS}
          value={input.siu}
          onChange={(e) => patch("siu", e.target.value as GeuSiu)}
        >
          <option value="non_visible">Non visible</option>
          <option value="visible">Visible</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Masse annexielle">
        <select
          className={SELECT_CLS}
          value={input.masse}
          onChange={(e) => patch("masse", e.target.value as GeuMasse)}
        >
          <option value="non_visible">Non visible</option>
          <option value="visible">Visible</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Diamètre masse (mm)">
        <ScoreInput value={input.diamMm} onChange={(v) => patch("diamMm", v)} min={0} max={150} />
      </ScoreCriterion>
      <ScoreCriterion label="Activité cardiaque">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.cardiacActivity}
            onChange={(e) => patch("cardiacActivity", e.target.checked)}
          />
          Activité cardiaque embryonnaire
        </label>
      </ScoreCriterion>
      <ScoreCriterion label="Hémodynamique">
        <select
          className={SELECT_CLS}
          value={input.hemody}
          onChange={(e) => patch("hemody", e.target.value as GeuHemody)}
        >
          <option value="stable">Stable</option>
          <option value="instable">Instable</option>
          <option value="choc">Choc</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Surface corporelle (m²)">
        <ScoreInput value={input.bodySurface} onChange={(v) => patch("bodySurface", v)} min={1} max={3} step={0.01} />
      </ScoreCriterion>
    </ScoreShell>
  );
}
