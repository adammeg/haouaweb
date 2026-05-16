"use client";

import { useEffect, useMemo } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { convertFmfMoM } from "@/lib/assist/fmf-mom";
import { Field, SectionTitle, SelectInput, TextInput, type FieldPatch } from "./form-primitives";

export function FmfConverterPanel({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const ga = parseFloat(draft.o_terme || "12") || 12;
  const eth = draft.ethnie || "caucasian";

  const papp = useMemo(() => {
    const raw = parseFloat(draft.o_papp_a_raw || "");
    if (!raw) return null;
    return convertFmfMoM({
      gaWeeks: ga,
      rawValue: raw,
      marker: "papp_a",
      unit: draft.o_papp_a_unit,
      ethnicity: eth,
    });
  }, [draft.o_papp_a_raw, draft.o_papp_a_unit, ga, eth]);

  const bhcg = useMemo(() => {
    const raw = parseFloat(draft.o_bhcg_raw || "");
    if (!raw) return null;
    return convertFmfMoM({
      gaWeeks: ga,
      rawValue: raw,
      marker: "bhcg",
      unit: draft.o_bhcg_unit,
      ethnicity: eth,
    });
  }, [draft.o_bhcg_raw, draft.o_bhcg_unit, ga, eth]);

  const plgf = useMemo(() => {
    const raw = parseFloat(draft.o_plgf_raw || "");
    if (!raw) return null;
    return convertFmfMoM({
      gaWeeks: ga,
      rawValue: raw,
      marker: "plgf",
      ethnicity: eth,
    });
  }, [draft.o_plgf_raw, ga, eth]);

  useEffect(() => {
    const patch: FieldPatch = {};
    if (papp) patch.o_papp_a_mom = String(papp.mom);
    if (bhcg) patch.o_bhcg_mom = String(bhcg.mom);
    if (plgf) patch.o_plgf_mom = String(plgf.mom);
    if (Object.keys(patch).length) onField(patch);
  }, [papp, bhcg, plgf, onField]);

  const badge = (r: { label: string; level: string } | null) =>
    r ? (
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
          r.level === "high"
            ? "bg-red-100 text-red-800"
            : r.level === "low"
              ? "bg-amber-100 text-amber-900"
              : "bg-green-100 text-green-800"
        }`}
      >
        {r.label}
      </span>
    ) : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/20 p-4">
      <SectionTitle>FMF Converter — MoM T1 (11–14 SA)</SectionTitle>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Terme : {draft.o_terme || "—"} SA · MoM alimentent Hawae Assist (FMF T21/PE)
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="PAPP-A brut">
          <TextInput
            type="number"
            value={draft.o_papp_a_raw}
            onChange={(v) => onField({ o_papp_a_raw: v })}
          />
          <SelectInput
            value={draft.o_papp_a_unit || "mIU/mL"}
            onChange={(v) => onField({ o_papp_a_unit: v })}
            options={[
              { value: "mIU/mL", label: "mIU/mL" },
              { value: "ng/mL", label: "ng/mL" },
            ]}
          />
          {badge(papp)}
        </Field>
        <Field label="βhCG brut">
          <TextInput
            type="number"
            value={draft.o_bhcg_raw}
            onChange={(v) => onField({ o_bhcg_raw: v })}
          />
          <SelectInput
            value={draft.o_bhcg_unit || "ng/mL"}
            onChange={(v) => onField({ o_bhcg_unit: v })}
            options={[
              { value: "ng/mL", label: "ng/mL" },
              { value: "mUI/mL", label: "mUI/mL" },
            ]}
          />
          {badge(bhcg)}
        </Field>
        <Field label="PlGF (pg/mL)">
          <TextInput
            type="number"
            value={draft.o_plgf_raw}
            onChange={(v) => onField({ o_plgf_raw: v })}
          />
          {badge(plgf)}
        </Field>
      </div>
    </div>
  );
}
