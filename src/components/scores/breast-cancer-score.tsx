"use client";

import { useMemo, useState } from "react";
import {
  SEIN_DEFAULT,
  calcSein,
  type SeinFullResult,
  type SeinInput,
} from "@/lib/scores";
import { SCORE_LEVEL_COLORS } from "@/lib/scores";
import { ScoreCriterion, ScoreShell } from "./score-shell";

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
      className="w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[220px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TherapeuticBlock({
  title,
  text,
  color,
}: {
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border-l-[3px] bg-[var(--surface-raised)] px-3 py-2.5"
      style={{ borderLeftColor: color }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
        {title}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink)]">{text}</p>
    </div>
  );
}

function SeinResultExtras({ result }: { result: SeinFullResult }) {
  const color = SCORE_LEVEL_COLORS[result.level];
  return (
    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
      {result.remarques.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {result.remarques.map((r) => (
            <p key={r}>⚠️ {r}</p>
          ))}
        </div>
      )}
      <TherapeuticBlock title="Chirurgie" text={result.therapeutic.chir} color="#374151" />
      <TherapeuticBlock title="Chimiothérapie" text={result.therapeutic.chemo} color="#7c3aed" />
      <TherapeuticBlock
        title="Hormonothérapie"
        text={result.therapeutic.hormono}
        color="#16a34a"
      />
      <TherapeuticBlock
        title="Thérapie ciblée HER2"
        text={result.therapeutic.her2}
        color="#0891b2"
      />
      <TherapeuticBlock title="Radiothérapie" text={result.therapeutic.radio} color="#ea580c" />
      <p className="text-[10px] leading-relaxed text-[var(--muted)]">
        Décision multidisciplinaire obligatoire — validation en RCP.
      </p>
      <div
        className="rounded-lg px-3 py-2 text-center text-sm font-extrabold"
        style={{ color, border: `2px solid ${color}`, background: `${color}14` }}
      >
        Stade {result.stade} — {result.soustype}
      </div>
    </div>
  );
}

export function BreastCancerScore() {
  const [input, setInput] = useState<SeinInput>(SEIN_DEFAULT);
  const result = useMemo(() => calcSein(input), [input]);

  function patch<K extends keyof SeinInput>(key: K, val: SeinInput[K]) {
    setInput((s) => ({ ...s, [key]: val }));
  }

  return (
    <div>
      <ScoreShell
        title="🎗️ Cancer du sein"
        tag="TNM · Sous-type · Aide thérapeutique"
        description="Classification TNM (AJCC 8) + sous-type moléculaire → stade clinique et orientation thérapeutique."
        result={result}
        resultIdSuffix="sein"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Tumeur primitive (T)
        </p>
        <ScoreCriterion label="Taille tumorale">
          <StrSelect
            value={input.T}
            onChange={(v) => patch("T", v)}
            options={[
              { value: "Tis", label: "Tis — In situ" },
              { value: "T1mi", label: "T1mi — ≤ 1 mm" },
              { value: "T1a", label: "T1a — 1–5 mm" },
              { value: "T1b", label: "T1b — 5–10 mm" },
              { value: "T1c", label: "T1c — 10–20 mm" },
              { value: "T2", label: "T2 — 20–50 mm" },
              { value: "T3", label: "T3 — > 50 mm" },
              { value: "T4a", label: "T4a — Paroi thoracique" },
              { value: "T4b", label: "T4b — Peau / ulcération" },
              { value: "T4c", label: "T4c — T4a + T4b" },
              { value: "T4d", label: "T4d — Cancer inflammatoire" },
            ]}
          />
        </ScoreCriterion>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Ganglions (N)
        </p>
        <ScoreCriterion label="Atteinte ganglionnaire">
          <StrSelect
            value={input.N}
            onChange={(v) => patch("N", v)}
            options={[
              { value: "N0", label: "N0" },
              { value: "N1mi", label: "N1mi — micrométastase" },
              { value: "N1", label: "N1 — 1–3 ganglions" },
              { value: "N2a", label: "N2a — 4–9 ganglions" },
              { value: "N2b", label: "N2b — MI clinique" },
              { value: "N3a", label: "N3a — ≥ 10 ganglions" },
              { value: "N3b", label: "N3b — MI + axillaire" },
              { value: "N3c", label: "N3c — Sus-claviculaires" },
            ]}
          />
        </ScoreCriterion>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Métastases (M)
        </p>
        <ScoreCriterion label="Métastases à distance">
          <StrSelect
            value={input.M}
            onChange={(v) => patch("M", v)}
            options={[
              { value: "M0", label: "M0 — Pas de métastase" },
              { value: "M1", label: "M1 — Métastases" },
            ]}
          />
        </ScoreCriterion>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Profil biologique
        </p>
        <ScoreCriterion label="RE">
          <StrSelect
            value={input.re}
            onChange={(v) => patch("re", v)}
            options={[
              { value: "pos", label: "RE+" },
              { value: "neg", label: "RE−" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="RP">
          <StrSelect
            value={input.rp}
            onChange={(v) => patch("rp", v)}
            options={[
              { value: "pos", label: "RP+" },
              { value: "neg", label: "RP−" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="HER2">
          <StrSelect
            value={input.her2}
            onChange={(v) => patch("her2", v)}
            options={[
              { value: "neg", label: "HER2−" },
              { value: "pos", label: "HER2+" },
              { value: "low", label: "HER2-low" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Ki-67">
          <StrSelect
            value={input.ki67}
            onChange={(v) => patch("ki67", v)}
            options={[
              { value: "low", label: "Faible (< 14%)" },
              { value: "inter", label: "Intermédiaire" },
              { value: "high", label: "Élevé (> 30%)" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Grade SBR">
          <StrSelect
            value={input.grade}
            onChange={(v) => patch("grade", v)}
            options={[
              { value: "1", label: "Grade I" },
              { value: "2", label: "Grade II" },
              { value: "3", label: "Grade III" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Histologie">
          <StrSelect
            value={input.histo}
            onChange={(v) => patch("histo", v)}
            options={[
              { value: "canalaire", label: "Canalaire infiltrant" },
              { value: "lobulaire", label: "Lobulaire infiltrant" },
              { value: "ccis", label: "CCIS" },
              { value: "mucineux", label: "Mucineux / colloïde" },
              { value: "medullaire", label: "Médullaire" },
              { value: "autre", label: "Autre" },
            ]}
          />
        </ScoreCriterion>
        <ScoreCriterion label="Ménopause">
          <StrSelect
            value={input.meno}
            onChange={(v) => patch("meno", v)}
            options={[
              { value: "post", label: "Post-ménopausée" },
              { value: "pre", label: "Pré-ménopausée" },
            ]}
          />
        </ScoreCriterion>
      </ScoreShell>
      {result ? <SeinResultExtras result={result} /> : null}
    </div>
  );
}
