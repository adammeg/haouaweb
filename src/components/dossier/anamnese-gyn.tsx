"use client";

import { useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import {
  Field,
  SelectInput,
  TextArea,
  type FieldPatch,
} from "@/components/dossier/form-primitives";
import { DEBUT_OPTIONS, GYN_MOTIFS } from "@/lib/dossier/anamnese-config";
import { AnaCard, AnaSubTabs, useAnaPatch } from "@/components/dossier/anamnese-shared";
import { ExamsCard } from "@/components/dossier/exams-card";
import { GynCycleCard } from "@/components/dossier/gyn-cycle";

// Antécédents, cycle habituel, contraception, frottis, mode de vie : dans l'anamnèse commune.
// Poids, taille et IMC : dans l'examen clinique. Masse ovarienne : dans l'échographie pelvienne.
const GYN_TABS = [
  { id: "motif", label: "💬 Motif" },
  { id: "cycles", label: "🔵 Cycle actuel" },
  { id: "echo", label: "🔊 Échographie" },
];

export function GynAnamnese({
  draft,
  onField,
  patchDraft,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
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

      {sub === "cycles" && <GynCycleCard draft={draft} patch={patch} />}

      {sub === "echo" && (
        <ExamsCard
          draft={draft}
          patchDraft={patchDraft}
          kind="echo"
          panels={["echo_pelvienne"]}
          title="🔊 Échographie pelvienne"
          sub="Rédigez le compte rendu, ajoutez les mesures utiles et joignez vos clichés. Chaque échographie garde sa date."
        />
      )}
    </div>
  );
}
