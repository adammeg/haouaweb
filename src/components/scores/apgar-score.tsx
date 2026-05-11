"use client";

import { useMemo, useState } from "react";
import {
  APGAR_DEFAULT,
  APGAR_PARAMS,
  calcApgar,
  type ApgarInput,
  type ApgarParamKey,
} from "@/lib/scores";
import { ScoreCriterion, ScoreSelect, ScoreShell } from "./score-shell";

export function ApgarScore() {
  const [input, setInput] = useState<ApgarInput>(APGAR_DEFAULT);
  const result = useMemo(() => calcApgar(input), [input]);

  function patch(
    when: "one" | "five",
    key: ApgarParamKey,
    val: number,
  ) {
    setInput((s) => ({
      ...s,
      [when]: { ...s[when], [key]: val as 0 | 1 | 2 },
    }));
  }

  return (
    <ScoreShell
      title="⭐ Score d'Apgar"
      tag="Adaptation néonatale"
      description="Évaluation à 1 et 5 minutes — fréquence cardiaque, respiration, tonus, réactivité, coloration."
      result={result}
      resultIdSuffix="apgar"
    >
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        <span />
        <span className="px-2 text-center">1 min</span>
        <span className="px-2 text-center">5 min</span>
      </div>
      {APGAR_PARAMS.map((p) => {
        const opts = p.opts.map((label, value) => ({ value, label }));
        return (
          <ScoreCriterion key={p.key} label={p.label}>
            <span className="flex gap-2">
              <ScoreSelect
                value={input.one[p.key]}
                onChange={(v) => patch("one", p.key, v)}
                options={opts}
                className="sm:min-w-[150px]"
              />
              <ScoreSelect
                value={input.five[p.key]}
                onChange={(v) => patch("five", p.key, v)}
                options={opts}
                className="sm:min-w-[150px]"
              />
            </span>
          </ScoreCriterion>
        );
      })}
    </ScoreShell>
  );
}
