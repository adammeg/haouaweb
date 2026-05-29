"use client";

import { useMemo, useState } from "react";
import {
  RCIU_DEFAULT,
  calcRCIU,
  type RCIUFullResult,
  type RCIUInput,
} from "@/lib/scores";
import { SCORE_LEVEL_COLORS, SCORE_LEVEL_BG } from "@/lib/scores";
import { ScoreCriterion, ScoreInput, ScoreShell } from "./score-shell";

function StrSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--teal)] sm:min-w-[200px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RciuGrowthChart({ result }: { result: RCIUFullResult }) {
  const color = SCORE_LEVEL_COLORS[result.level];
  return (
    <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Courbe de croissance — {result.sa} SA
        </p>
        <div className="relative h-12 overflow-hidden rounded-lg bg-gray-100">
          <div
            className="absolute bottom-0 top-0 w-0.5 rounded"
            style={{ left: `${result.pfeMarkerPct}%`, background: color }}
          />
          <div
            className="absolute top-1 rounded px-2 py-0.5 text-[10px] font-extrabold text-white"
            style={{
              left: `${Math.min(result.pfeMarkerPct, 85)}%`,
              background: color,
            }}
          >
            {result.pfe}g
          </div>
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-[var(--muted)]">
          {result.growthBars.map((b) => (
            <div key={b.label} className="text-center">
              <div>{b.label}</div>
              <div className="font-semibold">{b.poids}g</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Bilan Doppler
        </p>
        <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-white text-xs">
          {result.dopSummary.map((d) => (
            <li
              key={d.label}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="text-[var(--ink)]">{d.label}</span>
              <span
                className="font-semibold"
                style={{ color: d.ok ? "#16a34a" : "#dc2626" }}
              >
                {d.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: color,
          background: SCORE_LEVEL_BG[result.level],
        }}
      >
        <p className="text-[10px] font-bold uppercase" style={{ color }}>
          {result.urgence === "urgent" ? "Urgence" : "Conduite à tenir"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink)]">
          {result.conduite}
        </p>
      </div>
      <p className="text-[10px] text-[var(--muted)]">
        Référence : courbes Hadlock 1991. Décision en RCP selon contexte clinique.
      </p>
    </div>
  );
}

export function RCIUScore() {
  const [input, setInput] = useState<RCIUInput>(RCIU_DEFAULT);
  const result = useMemo(() => calcRCIU(input), [input]);

  function patch<K extends keyof RCIUInput>(key: K, val: RCIUInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <div>
      <ScoreShell
        title="📈 Croissance fœtale — RCIU"
        tag="Hadlock 1991"
        description="Évaluation du percentile de poids fœtal estimé (PFE) et conduite selon Doppler et liquide amniotique."
        result={result}
        resultIdSuffix="rciu"
      >
        <ScoreCriterion label="Âge gestationnel (SA)">
          <ScoreInput
            value={input.sa}
            onChange={(v) => patch("sa", v)}
            min={20}
            max={42}
          />
        </ScoreCriterion>
        <ScoreCriterion label="PFE (g)">
          <ScoreInput
            value={input.pfe}
            onChange={(v) => patch("pfe", v)}
            min={100}
            max={6000}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Doppler ombilicale">
          <StrSelect
            value={input.dopOmb}
            onChange={(v) => patch("dopOmb", v)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "eleve", label: "Résistances élevées" },
              { value: "absent", label: "Diastole absente" },
              { value: "reverse", label: "Reverse flow" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Doppler ACM">
          <StrSelect
            value={input.dopAcm}
            onChange={(v) => patch("dopAcm", v)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "bas", label: "Vasodilatation" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Ratio RCP">
          <StrSelect
            value={input.rcp}
            onChange={(v) => patch("rcp", v)}
            options={[
              { value: "normal", label: "Normal (> 1.0)" },
              { value: "bas", label: "Bas (≤ 1.0)" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Ductus venosus">
          <StrSelect
            value={input.dopDv}
            onChange={(v) => patch("dopDv", v)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "anormal", label: "Anormal" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Liquide amniotique">
          <StrSelect
            value={input.la}
            onChange={(v) => patch("la", v)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "oligo", label: "Oligoamnios" },
              { value: "anhydr", label: "Anhydramnios" },
            ]}
          />
        </ScoreCriterion>
      </ScoreShell>
      {result ? <RciuGrowthChart result={result} /> : null}
    </div>
  );
}
