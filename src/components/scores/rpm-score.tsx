"use client";

import { useMemo, useState } from "react";
import {
  calcRPM,
  RPM_DEFAULT,
  type RPMInput,
  type RpmLa,
  type RpmTest,
} from "@/lib/scores/rpm";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

const SELECT_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[180px]";

export function RPMScore() {
  const [input, setInput] = useState<RPMInput>(RPM_DEFAULT);
  const result = useMemo(() => calcRPM(input), [input]);

  function patch<K extends keyof RPMInput>(k: K, v: RPMInput[K]) {
    setInput((s) => ({ ...s, [k]: v }));
  }

  return (
    <ScoreShell
      title="💧 RPM"
      tag="Gibbs · CNGOF"
      description="Rupture prématurée des membranes — conduite selon terme."
      result={result}
    >
      <ScoreCriterion label="Âge gestationnel (SA)">
        <ScoreInput value={input.sa} onChange={(v) => patch("sa", v)} min={20} max={42} />
      </ScoreCriterion>
      <ScoreCriterion label="Test nitrazine">
        <select
          className={SELECT_CLS}
          value={input.nitrazine}
          onChange={(e) => patch("nitrazine", e.target.value as RpmTest)}
        >
          <option value="nonfait">Non fait</option>
          <option value="positif">Positif</option>
          <option value="negatif">Négatif</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Test de Fougère">
        <select
          className={SELECT_CLS}
          value={input.fern}
          onChange={(e) => patch("fern", e.target.value as RpmTest)}
        >
          <option value="nonfait">Non fait</option>
          <option value="positif">Positif</option>
          <option value="negatif">Négatif</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Liquide amniotique">
        <select
          className={SELECT_CLS}
          value={input.la}
          onChange={(e) => patch("la", e.target.value as RpmLa)}
        >
          <option value="absent">Absent</option>
          <option value="normal">Normal</option>
          <option value="oligo">Oligoamnios</option>
          <option value="anhydr">Anhydramnios</option>
        </select>
      </ScoreCriterion>
      <ScoreCriterion label="Température (°C)">
        <ScoreInput value={input.temp} onChange={(v) => patch("temp", v)} min={35} max={42} step={0.1} />
      </ScoreCriterion>
      <ScoreCriterion label="Signes cliniques">
        <div className="flex flex-col gap-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={input.tachyMaternal}
              onChange={(e) => patch("tachyMaternal", e.target.checked)}
            />
            Tachycardie maternelle
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={input.tachyFetal}
              onChange={(e) => patch("tachyFetal", e.target.checked)}
            />
            Tachycardie fœtale
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={input.uterusTender}
              onChange={(e) => patch("uterusTender", e.target.checked)}
            />
            Utérus sensible
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={input.laOdor}
              onChange={(e) => patch("laOdor", e.target.checked)}
            />
            Odeur LA suspecte
          </label>
        </div>
      </ScoreCriterion>
    </ScoreShell>
  );
}
