"use client";

import { useMemo, useState } from "react";
import {
  GREENE_CAT_LABELS,
  GREENE_ITEMS,
  KUPPERMAN_ITEMS,
  calcGreene,
  calcKupperman,
  greeneDefault,
  kuppermanDefault,
  type GreeneInput,
  type KuppermanInput,
} from "@/lib/scores";
import { ScoreShell, ScoreSelect } from "./score-shell";

const LEVEL_OPTS = [
  { value: 0, label: "0 — Absent" },
  { value: 1, label: "1 — Léger" },
  { value: 2, label: "2 — Modéré" },
  { value: 3, label: "3 — Sévère" },
];

export function GreeneScore() {
  const [input, setInput] = useState<GreeneInput>(() => greeneDefault());
  const result = useMemo(() => calcGreene(input), [input]);

  function patch(id: string, val: number) {
    setInput((s) => ({ ...s, [id]: val as 0 | 1 | 2 | 3 }));
  }

  let lastCat = "";
  return (
    <ScoreShell
      title="🌸 Score de Greene"
      tag="Ménopause"
      description="Évaluation symptomatique en 21 items, 5 catégories. Score total 0–63."
      result={result}
      resultIdSuffix="greene"
    >
      {GREENE_ITEMS.map((item) => {
        const isNewCat = item.cat !== lastCat;
        lastCat = item.cat;
        return (
          <div key={item.id}>
            {isNewCat ? (
              <div className="mt-3 border-t border-[var(--border)] pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-[var(--teal)]">
                {GREENE_CAT_LABELS[item.cat]}
              </div>
            ) : null}
            <label className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)]/70 bg-[var(--surface-raised)]/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="text-[12px] font-semibold text-[var(--ink)]">
                {item.label}
              </span>
              <ScoreSelect
                value={input[item.id] ?? 0}
                onChange={(v) => patch(item.id, v)}
                options={LEVEL_OPTS}
              />
            </label>
          </div>
        );
      })}
    </ScoreShell>
  );
}

export function KuppermanScore() {
  const [input, setInput] = useState<KuppermanInput>(() => kuppermanDefault());
  const result = useMemo(() => calcKupperman(input), [input]);

  function patch(id: string, val: number) {
    setInput((s) => ({ ...s, [id]: val as 0 | 1 | 2 | 3 }));
  }

  return (
    <ScoreShell
      title="💗 Index de Kupperman"
      tag="Ménopause pondérée"
      description="Score pondéré (coefficients) de 11 symptômes — score 0–51."
      result={result}
      resultIdSuffix="kupperman"
    >
      {KUPPERMAN_ITEMS.map((item) => (
        <label
          key={item.id}
          className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)]/70 bg-[var(--surface-raised)]/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        >
          <span className="text-[12px] font-semibold text-[var(--ink)]">
            {item.label}{" "}
            <span className="ml-1 text-[10px] font-medium text-[var(--muted)]">
              (×{item.coef})
            </span>
          </span>
          <ScoreSelect
            value={input[item.id] ?? 0}
            onChange={(v) => patch(item.id, v)}
            options={LEVEL_OPTS}
          />
        </label>
      ))}
    </ScoreShell>
  );
}
