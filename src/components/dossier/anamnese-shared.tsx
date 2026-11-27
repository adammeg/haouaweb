"use client";

import type { ReactNode } from "react";
import type { PatientSnapshot, Specialty } from "@/types/domain";
import { SPECIALTY_LABELS } from "@/types/domain";
import type { FieldPatch } from "@/components/dossier/form-primitives";

export function AnaCard({
  title,
  ar,
  children,
}: {
  title: string;
  ar?: string;
  children: ReactNode;
}) {
  return (
    <div className="dossier-card">
      <div className="dossier-card-header">
        <h3>{title}</h3>
        {ar ? <span className="ar">{ar}</span> : null}
      </div>
      <div className="dossier-card-body">{children}</div>
    </div>
  );
}

export function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <div className="section-divider">
      <span>{children}</span>
    </div>
  );
}

export function AnaSubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  const scrollable = tabs.length > 6;

  return (
    <div
      className={`ana-sub-tabs${scrollable ? " ana-sub-tabs--scroll" : ""}`}
      role="tablist"
      aria-label="Sections de l'anamnèse"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          title={t.label}
          className={`ana-sub-tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function PillRadio({
  name,
  value,
  current,
  label,
  onChange,
}: {
  name: string;
  value: string;
  current?: string;
  label: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="radio-pill">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
}

export function PillGroup({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="radio-group">
      {options.map((o) => (
        <PillRadio
          key={o.value}
          name={name}
          value={o.value}
          current={value}
          label={o.label}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

const SPEC_META: Record<
  Specialty,
  { icon: string; sub: string; cls: string }
> = {
  gyn: {
    icon: "🔵",
    sub: "Pathologies gynéco, cycles, contraception, chirurgie",
    cls: "sg",
  },
  obst: {
    icon: "🤰",
    sub: "Suivi grossesse, accouchement, urgences, post-partum",
    cls: "so",
  },
  inf: {
    icon: "🔬",
    sub: "Bilan du couple, FIV, SOPK, endométriose, FCR",
    cls: "si",
  },
};

export function SpecChooser({
  spec,
  onSelect,
}: {
  spec: Specialty;
  onSelect: (s: Specialty) => void;
}) {
  return (
    <div className="spec-chooser">
      {(["gyn", "obst", "inf"] as Specialty[]).map((s) => {
        const m = SPEC_META[s];
        return (
          <button
            key={s}
            type="button"
            className={`spec-card ${m.cls} ${spec === s ? "active" : ""}`}
            onClick={() => onSelect(s)}
          >
            <span className="spec-check">✓</span>
            <span className="spec-icon">{m.icon}</span>
            <div className="spec-title">{SPECIALTY_LABELS[s]}</div>
            <div className="spec-sub">{m.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

export type AnaPatch = (k: keyof PatientSnapshot, v: string) => void;

export function useAnaPatch(
  onField: (p: FieldPatch) => void,
): AnaPatch {
  return (k, v) => onField({ [k]: v });
}
