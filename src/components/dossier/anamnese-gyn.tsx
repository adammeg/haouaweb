"use client";

import { useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  type FieldPatch,
} from "@/components/dossier/form-primitives";
import { DEBUT_OPTIONS, GYN_LEUCO, GYN_MOTIFS } from "@/lib/dossier/anamnese-config";
import { AnaCard, AnaSubTabs, PillGroup, useAnaPatch } from "@/components/dossier/anamnese-shared";

// Antécédents, cycle habituel, contraception, frottis, mode de vie : dans l'anamnèse commune.
// Poids, taille et IMC : dans l'examen clinique.
const GYN_TABS = [
  { id: "motif", label: "💬 Motif" },
  { id: "cycles", label: "🔵 Cycle actuel" },
  { id: "masse", label: "🔎 Masse ovarienne" },
];

export function GynAnamnese({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const [sub, setSub] = useState("motif");
  const patch = useAnaPatch(onField);

  return (
    <div className="ana-spec-block">
      <AnaSubTabs tabs={GYN_TABS} active={sub} onChange={setSub} />

      {sub === "motif" && (
        <AnaCard title="💬 Motif gynécologique" ar="سبب الاستشارة">
          <div className="dossier-form-grid full">
            <Field label="Motif principal *">
              <SelectInput
                value={draft.motif}
                onChange={(v) => patch("motif", v)}
                options={GYN_MOTIFS}
              />
            </Field>
            <Field label="Description détaillée">
              <TextArea
                value={draft.symptomes}
                rows={3}
                placeholder="Localisation, intensité, irradiation, évolution…"
                onChange={(v) => patch("symptomes", v)}
              />
            </Field>
            <Field label="Début">
              <SelectInput
                value={draft.debut}
                onChange={(v) => patch("debut", v)}
                options={DEBUT_OPTIONS}
              />
            </Field>
            <Field label="Intensité (EVA 0–10)">
              <div className="eva-row">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={draft.eva ?? "0"}
                  className="eva-slider"
                  onChange={(e) => patch("eva", e.target.value)}
                />
                <span className="eva-value">{draft.eva ?? "0"}</span>
                <span className="eva-max">/10</span>
              </div>
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "cycles" && (
        <AnaCard title="🔵 Cycle actuel et symptômes" ar="الدورة الحالية">
          <div className="dossier-form-grid triple">
            <Field label="DDR">
              <TextInput
                type="date"
                value={draft.g_ddr}
                onChange={(v) => patch("g_ddr", v)}
              />
            </Field>
            <Field label="Métrorragies intermenstruelles">
              <PillGroup
                name="g-metro"
                value={draft.g_metro || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                  { value: "contact", label: "De contact" },
                ]}
                onChange={(v) => patch("g_metro", v)}
              />
            </Field>
            <Field label="Leucorrhées">
              <SelectInput
                value={draft.g_leuco}
                onChange={(v) => patch("g_leuco", v)}
                options={GYN_LEUCO}
              />
            </Field>
            <Field label="Activité sexuelle">
              <PillGroup
                name="g-sex"
                value={draft.g_sex || "oui"}
                options={[
                  { value: "oui", label: "Active" },
                  { value: "non", label: "Non active" },
                ]}
                onChange={(v) => patch("g_sex", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "masse" && (
        <AnaCard title="🔎 Masse ovarienne" ar="كتلة المبيض">
          <div className="dossier-form-grid triple">
            <Field label="Masse ovarienne max (mm)">
              <TextInput
                type="number"
                value={draft.g_kyste_diam}
                placeholder="55"
                onChange={(v) => patch("g_kyste_diam", v)}
              />
            </Field>
            <Field label="HE4 (pmol/L)">
              <TextInput
                type="number"
                value={draft.g_he4}
                placeholder="70"
                onChange={(v) => patch("g_he4", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}
    </div>
  );
}
