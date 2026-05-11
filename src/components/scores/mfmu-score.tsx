"use client";

import { useMemo, useState } from "react";
import { MFMU_DEFAULT, calcMFMU, type MFMUInput } from "@/lib/scores";
import {
  ScoreCriterion,
  ScoreInput,
  ScoreSelect,
  ScoreShell,
} from "./score-shell";

const ETHNIE_OPTS = [
  { value: 0, label: "Autre / européenne" },
  { value: 1, label: "Noire" },
  { value: 2, label: "Hispanique" },
] as const;

const AVB_OPTS = [
  { value: 0, label: "Aucun AVB antérieur" },
  { value: 1, label: "AVB avant césarienne" },
  { value: 2, label: "AVB après césarienne" },
] as const;

const INDICATION_OPTS = [
  { value: 0, label: "Autre indication" },
  { value: 1, label: "Disproportion fœto-pelvienne" },
] as const;

function ethnieFromIdx(i: number): MFMUInput["ethnie"] {
  if (i === 1) return "noire";
  if (i === 2) return "hispanique";
  return "autre";
}
function ethnieIdx(e: MFMUInput["ethnie"]): number {
  return e === "noire" ? 1 : e === "hispanique" ? 2 : 0;
}
function avbFromIdx(i: number): MFMUInput["avb"] {
  if (i === 1) return "avant";
  if (i === 2) return "apres";
  return "non";
}
function avbIdx(v: MFMUInput["avb"]): number {
  return v === "avant" ? 1 : v === "apres" ? 2 : 0;
}
function indFromIdx(i: number): MFMUInput["indication"] {
  return i === 1 ? "dfcp" : "autre";
}
function indIdx(v: MFMUInput["indication"]): number {
  return v === "dfcp" ? 1 : 0;
}

export function MFMUScore() {
  const [input, setInput] = useState<MFMUInput>(MFMU_DEFAULT);
  const result = useMemo(() => calcMFMU(input), [input]);

  function patch<K extends keyof MFMUInput>(key: K, val: MFMUInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <ScoreShell
      title="🏥 Score AVAC — MFMU"
      tag="Pronostic AVB"
      description="Estime la probabilité de succès d'une épreuve du travail après césarienne (MFMU Network)."
      result={result}
      resultIdSuffix="mfmu"
    >
      <ScoreCriterion label="Âge maternel">
        <ScoreInput
          value={input.age}
          onChange={(v) => patch("age", v)}
          min={15}
          max={55}
        />
      </ScoreCriterion>
      <ScoreCriterion label="IMC">
        <ScoreInput
          value={input.imc}
          onChange={(v) => patch("imc", v)}
          min={15}
          max={60}
          step="0.1"
        />
      </ScoreCriterion>
      <ScoreCriterion label="Ethnie">
        <ScoreSelect
          value={ethnieIdx(input.ethnie)}
          onChange={(v) => patch("ethnie", ethnieFromIdx(v))}
          options={ETHNIE_OPTS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Antécédent d'AVB">
        <ScoreSelect
          value={avbIdx(input.avb)}
          onChange={(v) => patch("avb", avbFromIdx(v))}
          options={AVB_OPTS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Indication précédente césarienne">
        <ScoreSelect
          value={indIdx(input.indication)}
          onChange={(v) => patch("indication", indFromIdx(v))}
          options={INDICATION_OPTS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </ScoreCriterion>
      <ScoreCriterion label="Terme (SA)">
        <ScoreInput
          value={input.terme}
          onChange={(v) => patch("terme", v)}
          min={24}
          max={42}
        />
      </ScoreCriterion>
    </ScoreShell>
  );
}
