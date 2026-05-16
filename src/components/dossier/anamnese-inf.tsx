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
  GYN_DYSMEN,
  GYN_REG,
  I_COELIO,
  I_HSG,
  I_HYSTERO,
  I_SPERMO_RES,
  INF_MOTIFS,
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

const INF_TABS = [
  { id: "motif", label: "💬 Motif" },
  { id: "cycles", label: "🔵 Cycles" },
  { id: "bilan", label: "🔬 Bilan réalisé" },
  { id: "homme", label: "👨 Facteur ♂" },
  { id: "atcd", label: "📜 ATCD" },
];

export function InfAnamnese({
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
      <AnaSubTabs tabs={INF_TABS} active={sub} onChange={setSub} />

      {sub === "motif" && (
        <AnaCard title="💬 Motif — Infertilité / AMP" ar="سبب الاستشارة">
          <div className="dossier-form-grid full">
            <Field label="Motif *">
              <SelectInput
                value={draft.motif}
                onChange={(v) => patch("motif", v)}
                options={INF_MOTIFS}
              />
            </Field>
            <Field label="Durée d'infertilité (mois)">
              <TextInput
                type="number"
                value={draft.i_duree}
                placeholder="18"
                onChange={(v) => patch("i_duree", v)}
              />
            </Field>
            <Field label="Type d'infertilité">
              <PillGroup
                name="i-type"
                value={draft.i_type || "prim"}
                options={[
                  { value: "prim", label: "Primaire" },
                  { value: "sec", label: "Secondaire" },
                ]}
                onChange={(v) => patch("i_type", v)}
              />
            </Field>
            <Field label="Histoire clinique">
              <TextArea
                value={draft.symptomes}
                rows={3}
                placeholder="Résumé, bilan déjà réalisé, contexte du couple…"
                onChange={(v) => patch("symptomes", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "cycles" && (
        <AnaCard title="🔵 Cycles & Ovulation" ar="الدورة والإباضة">
          <div className="dossier-form-grid triple">
            <Field label="DDR">
              <TextInput type="date" value={draft.i_ddr} onChange={(v) => patch("i_ddr", v)} />
            </Field>
            <Field label="Durée cycle (j)">
              <TextInput type="number" value={draft.i_cycle} placeholder="28" onChange={(v) => patch("i_cycle", v)} />
            </Field>
            <Field label="Régularité">
              <SelectInput value={draft.i_reg} onChange={(v) => patch("i_reg", v)} options={GYN_REG} />
            </Field>
            <Field label="Dysménorrhée">
              <SelectInput value={draft.i_dysmen} onChange={(v) => patch("i_dysmen", v)} options={GYN_DYSMEN} />
            </Field>
            <Field label="Dyspareunie profonde">
              <PillGroup
                name="i-dysp"
                value={draft.i_dysp || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("i_dysp", v)}
              />
            </Field>
            <Field label="Signes SOPK">
              <PillGroup
                name="i-sopk"
                value={draft.i_sopk || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("i_sopk", v)}
              />
            </Field>
            <Field label="Âge ménarche">
              <TextInput type="number" value={draft.i_menarche} onChange={(v) => patch("i_menarche", v)} />
            </Field>
            <Field label="Contraception ancienne">
              <TextInput value={draft.i_contra} onChange={(v) => patch("i_contra", v)} />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "bilan" && (
        <AnaCard title="🔬 Bilan déjà réalisé" ar="الفحوصات السابقة">
          <div className="dossier-form-grid">
            <Field label="Bilan hormonal J3">
              <TextArea
                value={draft.i_hormones}
                rows={2}
                placeholder="FSH: — LH: — E2: — AMH: —"
                onChange={(v) => patch("i_hormones", v)}
              />
            </Field>
            <Field label="CFA">
              <TextInput type="number" value={draft.i_cfa} onChange={(v) => patch("i_cfa", v)} />
            </Field>
            <Field label="AMH (ng/mL)">
              <TextInput type="number" value={draft.i_amh_ngml} onChange={(v) => patch("i_amh_ngml", v)} />
            </Field>
            <Field label="AMH (pmol/L)">
              <TextInput type="number" value={draft.i_amh_pmol} onChange={(v) => patch("i_amh_pmol", v)} />
            </Field>
            <Field label="HSG">
              <SelectInput value={draft.i_hsg} onChange={(v) => patch("i_hsg", v)} options={I_HSG} />
            </Field>
            <Field label="Hystéroscopie">
              <SelectInput value={draft.i_hystero} onChange={(v) => patch("i_hystero", v)} options={I_HYSTERO} />
            </Field>
            <Field label="Cœlioscopie">
              <SelectInput value={draft.i_coelio} onChange={(v) => patch("i_coelio", v)} options={I_COELIO} />
            </Field>
            <Field label="Tentatives AMP antérieures">
              <TextArea value={draft.i_amp} rows={2} onChange={(v) => patch("i_amp", v)} />
            </Field>
            <Field label="Nombre tentatives FIV / ICSI">
              <TextInput
                type="number"
                value={draft.i_tentatives_fiv}
                onChange={(v) => patch("i_tentatives_fiv", v)}
              />
            </Field>
            <Field label="Mauvaise réponse ovarienne ant.">
              <PillGroup
                name="i-mauvaise-reponse"
                value={draft.i_mauvaise_reponse || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui (<4 ovocytes)" },
                ]}
                onChange={(v) => patch("i_mauvaise_reponse", v)}
              />
            </Field>
            <Field label="ATCD OHSS">
              <PillGroup
                name="i-atcd-ohss"
                value={draft.i_atcd_ohss || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "mod", label: "Modéré" },
                  { value: "sev", label: "Sévère" },
                ]}
                onChange={(v) => patch("i_atcd_ohss", v)}
              />
            </Field>
            <Field label="Cause principale">
              <SelectInput
                value={draft.i_cause_inf}
                onChange={(v) => patch("i_cause_inf", v)}
                options={[
                  { value: "", label: "— Non établie —" },
                  { value: "tubaire", label: "Tubaire" },
                  { value: "ovulatoire", label: "Ovulatoire" },
                  { value: "uterine", label: "Utérine" },
                  { value: "endometriose", label: "Endométriose" },
                  { value: "masculine", label: "Facteur masculin" },
                  { value: "mixte", label: "Mixte" },
                  { value: "inexpliquee", label: "Inexpliquée" },
                ]}
              />
            </Field>
          </div>
          <SectionDivider>Marqueurs tumoraux — si kyste ovarien</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="CA-125 (UI/mL)">
              <TextInput type="number" value={draft.i_ca125} onChange={(v) => patch("i_ca125", v)} />
            </Field>
            <Field label="HE4 (pmol/L)">
              <TextInput type="number" value={draft.i_he4_inf} onChange={(v) => patch("i_he4_inf", v)} />
            </Field>
            <Field label="Diamètre max kyste (mm)">
              <TextInput type="number" value={draft.i_kyste_diam} onChange={(v) => patch("i_kyste_diam", v)} />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "homme" && (
        <AnaCard title="👨 Facteur masculin" ar="العامل الذكوري">
          <div className="dossier-form-grid triple">
            <Field label="Âge du conjoint">
              <TextInput type="number" value={draft.i_age_h} onChange={(v) => patch("i_age_h", v)} />
            </Field>
            <Field label="Spermogramme">
              <PillGroup
                name="i-spermo"
                value={draft.i_spermo || "non"}
                options={[
                  { value: "oui", label: "Réalisé" },
                  { value: "non", label: "Non réalisé" },
                ]}
                onChange={(v) => patch("i_spermo", v)}
              />
            </Field>
            <Field label="Résultat spermogramme">
              <SelectInput
                value={draft.i_spermo_res}
                onChange={(v) => patch("i_spermo_res", v)}
                options={I_SPERMO_RES}
              />
            </Field>
            <Field label="Remarques — facteur masculin" className="span3">
              <TextArea value={draft.i_homme_note} rows={2} onChange={(v) => patch("i_homme_note", v)} />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "atcd" && (
        <AnaCard title="📜 ATCD médicaux & Mode de vie">
          <div className="dossier-form-grid triple">
            <Field label="G / P / A">
              <GpaRow
                g={draft.i_gest}
                p={draft.i_par}
                a={draft.i_abort}
                onG={(v) => patch("i_gest", v)}
                onP={(v) => patch("i_par", v)}
                onA={(v) => patch("i_abort", v)}
              />
            </Field>
            <Field label="ATCD IST / Salpingite">
              <PillGroup
                name="i-ist"
                value={draft.i_ist || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("i_ist", v)}
              />
            </Field>
            <Field label="IMC">
              <TextInput type="number" value={draft.imc} onChange={(v) => patch("imc", v)} />
            </Field>
          </div>
          <AtcdCommun draft={draft} patch={patch} />
        </AnaCard>
      )}
    </div>
  );
}
