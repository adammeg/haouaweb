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
import {
  DEBUT_OPTIONS,
  GYN_ABOND,
  GYN_CONTRA,
  GYN_DYSMEN,
  GYN_FCV_RES,
  GYN_LEUCO,
  GYN_MOTIFS,
  GYN_REG,
  calcImc,
} from "@/lib/dossier/anamnese-config";
import {
  AnaCard,
  AnaSubTabs,
  AtcdCommun,
  GpaRow,
  PillGroup,
  SectionDivider,
  useAnaPatch,
} from "@/components/dossier/anamnese-shared";

const GYN_TABS = [
  { id: "motif", label: "💬 Motif" },
  { id: "cycles", label: "🔵 Cycles" },
  { id: "sexo", label: "❤️ Sexualité" },
  { id: "atcd", label: "📜 ATCD" },
  { id: "vie", label: "🌿 Mode de vie" },
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

  const syncImc = (poids: string, taille: string) => {
    const imc = calcImc(poids, taille);
    if (imc) onField({ ec_poids: poids, ec_taille: taille, imc });
    else onField({ ec_poids: poids, ec_taille: taille });
  };

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
        <AnaCard title="🔵 Cycles menstruels" ar="الدورة الشهرية">
          <div className="dossier-form-grid triple">
            <Field label="DDR">
              <TextInput
                type="date"
                value={draft.g_ddr}
                onChange={(v) => patch("g_ddr", v)}
              />
            </Field>
            <Field label="Durée cycle (j)">
              <TextInput
                type="number"
                value={draft.g_cycle}
                placeholder="28"
                onChange={(v) => patch("g_cycle", v)}
              />
            </Field>
            <Field label="Durée règles (j)">
              <TextInput
                type="number"
                value={draft.g_regles}
                placeholder="5"
                onChange={(v) => patch("g_regles", v)}
              />
            </Field>
            <Field label="Régularité">
              <SelectInput
                value={draft.g_reg}
                onChange={(v) => patch("g_reg", v)}
                options={GYN_REG}
              />
            </Field>
            <Field label="Abondance">
              <SelectInput
                value={draft.g_abond}
                onChange={(v) => patch("g_abond", v)}
                options={GYN_ABOND}
              />
            </Field>
            <Field label="Dysménorrhée">
              <SelectInput
                value={draft.g_dysmen}
                onChange={(v) => patch("g_dysmen", v)}
                options={GYN_DYSMEN}
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
            <Field label="Âge ménarche">
              <TextInput
                type="number"
                value={draft.g_menarche}
                placeholder="13"
                onChange={(v) => patch("g_menarche", v)}
              />
            </Field>
            <Field label="Ménopause">
              <PillGroup
                name="g-meno-cycles"
                value={draft.g_meno || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "peri", label: "Péri" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("g_meno", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "sexo" && (
        <AnaCard title="❤️ Vie sexuelle & Contraception" ar="الحياة الجنسية">
          <div className="dossier-form-grid">
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
            <Field label="Dyspareunie">
              <PillGroup
                name="g-dysp"
                value={draft.g_dysp || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "sup", label: "Superficielle" },
                  { value: "prof", label: "Profonde" },
                ]}
                onChange={(v) => patch("g_dysp", v)}
              />
            </Field>
            <Field label="Contraception actuelle">
              <SelectInput
                value={draft.g_contra}
                onChange={(v) => patch("g_contra", v)}
                options={GYN_CONTRA}
              />
            </Field>
            <Field label="Dernier FCV — Date">
              <TextInput
                type="date"
                value={draft.g_fcv}
                onChange={(v) => patch("g_fcv", v)}
              />
            </Field>
            <Field label="Résultat FCV">
              <SelectInput
                value={draft.g_fcv_res}
                onChange={(v) => patch("g_fcv_res", v)}
                options={GYN_FCV_RES}
              />
            </Field>
            <Field label="ATCD IST">
              <PillGroup
                name="g-ist"
                value={draft.g_ist || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("g_ist", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "atcd" && (
        <AnaCard title="📜 Antécédents gynéco-médicaux" ar="السوابق المرضية">
          <SectionDivider>Gynécologiques</SectionDivider>
          <div className="dossier-form-grid">
            <Field label="G / P / A">
              <GpaRow
                g={draft.g_gest}
                p={draft.g_par}
                a={draft.g_abort}
                onG={(v) => patch("g_gest", v)}
                onP={(v) => patch("g_par", v)}
                onA={(v) => patch("g_abort", v)}
              />
            </Field>
            <Field label="Chirurgie pelvienne">
              <TextInput
                value={draft.chir}
                placeholder="myomectomie, hystéroscopie…"
                onChange={(v) => patch("chir", v)}
              />
            </Field>
            <Field label="Pathologies gynéco connues">
              <TextInput
                value={draft.g_patho}
                placeholder="fibrome, kyste, endométriose…"
                onChange={(v) => patch("g_patho", v)}
              />
            </Field>
          </div>
          <SectionDivider>Médicaux généraux</SectionDivider>
          <AtcdCommun draft={draft} patch={patch} />
          <SectionDivider>Contexte gynécologique spécifique</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="Endométriose confirmée">
              <PillGroup
                name="g-endo"
                value={draft.g_endometriose || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("g_endometriose", v)}
              />
            </Field>
            <Field label="Prolapsus génital">
              <PillGroup
                name="g-prolapsus"
                value={draft.g_prolapsus || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("g_prolapsus", v)}
              />
            </Field>
            <Field label="Contexte oncologique">
              <PillGroup
                name="g-onco"
                value={draft.g_oncologie || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("g_oncologie", v)}
              />
            </Field>
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

      {sub === "vie" && (
        <AnaCard title="🌿 Mode de vie & Traitements">
          <div className="dossier-form-grid triple">
            <Field label="Poids (kg)">
              <TextInput
                type="number"
                value={draft.ec_poids}
                placeholder="65"
                onChange={(v) =>
                  syncImc(v, draft.ec_taille ?? "")
                }
              />
            </Field>
            <Field label="Taille (cm)">
              <TextInput
                type="number"
                value={draft.ec_taille}
                placeholder="163"
                onChange={(v) =>
                  syncImc(draft.ec_poids ?? "", v)
                }
              />
            </Field>
            <Field label="IMC (kg/m²)">
              <TextInput
                type="number"
                value={draft.imc}
                placeholder="23.5"
                onChange={(v) => patch("imc", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}
    </div>
  );
}
