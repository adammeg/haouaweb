"use client";

import { useMemo, useState } from "react";
import { calcLUS } from "@/lib/scores/lus";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

export function LUSScore() {
  const [mm, setMm] = useState(3);
  const result = useMemo(() => calcLUS(mm), [mm]);
  const pct = result ? Math.min(100, Math.max(0, (mm / 6) * 100)) : 0;

  return (
    <ScoreShell
      title="📏 LUS Cicatriciel"
      tag="CNGOF 2020"
      description="Épaisseur du segment inférieur utérin (mm) — risque déhiscence / AVAC."
      result={result}
    >
      <ScoreCriterion label="LUS (mm)">
        <ScoreInput
          value={mm}
          onChange={setMm}
          min={0.5}
          max={6}
          step={0.1}
        />
      </ScoreCriterion>
      {result ? (
        <div className="mt-2 sm:col-span-2">
          <div className="relative h-3 overflow-hidden rounded-full bg-[var(--cream-dark)]">
            <div
              className="absolute top-0 h-full w-0.5 bg-[var(--teal)]"
              style={{ left: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Position LUS sur l&apos;échelle 0–6 mm</p>
        </div>
      ) : null}
    </ScoreShell>
  );
}
