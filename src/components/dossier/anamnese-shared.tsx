"use client";

import type { ReactNode } from "react";
import type { PatientSnapshot, Specialty } from "@/types/domain";
import { SPECIALTY_LABELS } from "@/types/domain";
import {
  Field,
  TextInput,
  type FieldPatch,
} from "@/components/dossier/form-primitives";

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
  return (
    <div className="ana-sub-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
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

export function GpaRow({
  g,
  p,
  a,
  onG,
  onP,
  onA,
}: {
  g?: string;
  p?: string;
  a?: string;
  onG: (v: string) => void;
  onP: (v: string) => void;
  onA: (v: string) => void;
}) {
  return (
    <div className="gpa-row">
      <TextInput value={g} placeholder="G" onChange={onG} />
      <TextInput value={p} placeholder="P" onChange={onP} />
      <TextInput value={a} placeholder="A" onChange={onA} />
    </div>
  );
}

/** ATCD médicaux partagés (HTA, diabète, thyroïde, tabac…). */
export function AtcdCommun({
  draft,
  patch,
  diabeteExtra,
}: {
  draft: PatientSnapshot;
  patch: (k: keyof PatientSnapshot, v: string) => void;
  diabeteExtra?: { value: string; label: string }[];
}) {
  const diabOpts = diabeteExtra ?? [
    { value: "non", label: "Non" },
    { value: "t1", label: "DT1" },
    { value: "t2", label: "DT2" },
  ];

  return (
    <div className="dossier-form-grid triple">
      <Field label="HTA">
        <PillGroup
          name="hta"
          value={draft.hta || "non"}
          options={[
            { value: "non", label: "Non" },
            { value: "oui", label: "Oui" },
            { value: "traite", label: "Traité" },
          ]}
          onChange={(v) => patch("hta", v)}
        />
      </Field>
      <Field label="Diabète">
        <PillGroup
          name="diab"
          value={draft.diabete || "non"}
          options={diabOpts}
          onChange={(v) => patch("diabete", v)}
        />
      </Field>
      <Field label="Thyroïde">
        <PillGroup
          name="thyro"
          value={draft.thyroide || "non"}
          options={[
            { value: "non", label: "Non" },
            { value: "hypo", label: "Hypo" },
            { value: "hyper", label: "Hyper" },
          ]}
          onChange={(v) => patch("thyroide", v)}
        />
      </Field>
      <Field label="Autres ATCD">
        <TextInput
          value={draft.atcdMed}
          placeholder="ex: asthme, coagulopathie…"
          onChange={(v) => patch("atcdMed", v)}
        />
      </Field>
      <Field label="Chirurgies">
        <TextInput
          value={draft.chir}
          placeholder="ex: appendicectomie…"
          onChange={(v) => patch("chir", v)}
        />
      </Field>
      <Field label="Allergies">
        <TextInput
          value={draft.allergies}
          placeholder="médicaments, latex…"
          onChange={(v) => patch("allergies", v)}
        />
      </Field>
      <Field label="Tabac">
        <PillGroup
          name="tabac"
          value={draft.tabac || "non"}
          options={[
            { value: "non", label: "Non" },
            { value: "oui", label: "Oui" },
            { value: "sevré", label: "Sevré" },
          ]}
          onChange={(v) => patch("tabac", v)}
        />
      </Field>
      <Field label="Traitements en cours" className="span2">
        <TextInput
          value={draft.traitements}
          placeholder="médicaments, compléments…"
          onChange={(v) => patch("traitements", v)}
        />
      </Field>
    </div>
  );
}

export type AnaPatch = (k: keyof PatientSnapshot, v: string) => void;

export function useAnaPatch(
  onField: (p: FieldPatch) => void,
): AnaPatch {
  return (k, v) => onField({ [k]: v });
}
