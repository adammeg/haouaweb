"use client";

import type { PatientSnapshot } from "@/types/domain";
import {
  Field,
  RadioGroup,
  SectionTitle,
  SelectInput,
  TextArea,
  TextInput,
  type FieldPatch,
} from "./form-primitives";
import { FmfConverterPanel } from "./fmf-converter";

const OUI_NON = [
  { value: "non", label: "Non" },
  { value: "oui", label: "Oui" },
];

export function GynExtendedFields({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });
  return (
    <div className="space-y-4">
      <SectionTitle>Gynécologie — complément v49</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Régularité">
          <RadioGroup
            name="g-reg"
            value={draft.g_reg}
            onChange={(v) => p("g_reg", v)}
            options={[
              { value: "regulier", label: "Régulier" },
              { value: "irregulier", label: "Irrégulier" },
            ]}
          />
        </Field>
        <Field label="Dysménorrhée">
          <SelectInput
            value={draft.g_dysmen}
            onChange={(v) => p("g_dysmen", v)}
            options={[
              { value: "non", label: "Non" },
              { value: "legere", label: "Légère" },
              { value: "moderee", label: "Modérée" },
              { value: "severe", label: "Sévère" },
            ]}
          />
        </Field>
        <Field label="Ménopause">
          <RadioGroup
            name="g-meno"
            value={draft.g_meno}
            onChange={(v) => p("g_meno", v)}
            options={[
              { value: "non", label: "Non" },
              { value: "peri", label: "Péri" },
              { value: "oui", label: "Oui" },
            ]}
          />
        </Field>
        <Field label="Endométriose confirmée">
          <RadioGroup
            name="g-endometriose"
            value={draft.g_endometriose}
            onChange={(v) => p("g_endometriose", v)}
            options={OUI_NON}
          />
        </Field>
        <Field label="Prolapsus génital">
          <RadioGroup
            name="g-prolapsus"
            value={draft.g_prolapsus}
            onChange={(v) => p("g_prolapsus", v)}
            options={OUI_NON}
          />
        </Field>
        <Field label="Contexte oncologique">
          <RadioGroup
            name="g-oncologie"
            value={draft.g_oncologie}
            onChange={(v) => p("g_oncologie", v)}
            options={OUI_NON}
          />
        </Field>
        <Field label="Masse ovarienne max (mm)">
          <TextInput
            type="number"
            value={draft.g_kyste_diam}
            onChange={(v) => p("g_kyste_diam", v)}
          />
        </Field>
        <Field label="HE4 (pmol/L)">
          <TextInput
            type="number"
            value={draft.g_he4}
            onChange={(v) => p("g_he4", v)}
          />
        </Field>
        <Field label="Contraception" className="sm:col-span-2">
          <SelectInput
            value={draft.g_contra}
            onChange={(v) => p("g_contra", v)}
            options={[
              { value: "sans", label: "Sans" },
              { value: "pilule", label: "Pilule" },
              { value: "diu", label: "DIU" },
              { value: "preservatif", label: "Préservatif" },
              { value: "implant", label: "Implant" },
              { value: "autre", label: "Autre" },
            ]}
          />
        </Field>
        <Field label="Pathologies gynéco" className="sm:col-span-2 lg:col-span-3">
          <TextArea value={draft.g_patho} onChange={(v) => p("g_patho", v)} />
        </Field>
      </div>
    </div>
  );
}

export function ObstExtendedFields({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionTitle>Obstétrique — grossesse & risques v49</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Type grossesse">
            <SelectInput
              value={draft.o_type}
              onChange={(v) => p("o_type", v)}
              options={[
                { value: "singleton", label: "Singleton" },
                { value: "gemellaire", label: "Gémellaire" },
                { value: "triplets", label: "Triplés" },
              ]}
            />
          </Field>
          <Field label="Mode conception">
            <SelectInput
              value={draft.o_concept}
              onChange={(v) => p("o_concept", v)}
              options={[
                { value: "spontanee", label: "Spontanée" },
                { value: "FIV", label: "FIV" },
                { value: "ICSI", label: "ICSI" },
                { value: "IAC", label: "IAC" },
              ]}
            />
          </Field>
          <Field label="TA (120/80)">
            <TextInput
              value={draft.o_ta}
              onChange={(v) => p("o_ta", v)}
              placeholder="120/80"
            />
          </Field>
          <Field label="MAP (mmHg)">
            <TextInput
              type="number"
              value={draft.o_map}
              onChange={(v) => p("o_map", v)}
            />
          </Field>
          <Field label="ATCD pré-éclampsie">
            <RadioGroup
              name="o-atcd-pe"
              value={draft.o_atcd_pe}
              onChange={(v) => p("o_atcd_pe", v)}
              options={OUI_NON}
            />
          </Field>
          <Field label="Bandelette protéines">
            <SelectInput
              value={draft.o_bandelette}
              onChange={(v) => p("o_bandelette", v)}
              options={[
                { value: "", label: "—" },
                { value: "Neg", label: "Nég" },
                { value: "Traces", label: "Traces" },
                { value: "1+", label: "1+" },
                { value: "2+", label: "2+" },
                { value: "3+", label: "3+" },
              ]}
            />
          </Field>
          <Field label="Céphalées / visuels">
            <RadioGroup
              name="o-cephalees"
              value={draft.o_cephalees}
              onChange={(v) => p("o_cephalees", v)}
              options={OUI_NON}
            />
          </Field>
          <Field label="Douleur épigastrique">
            <RadioGroup
              name="o-epigastre"
              value={draft.o_epigastre}
              onChange={(v) => p("o_epigastre", v)}
              options={OUI_NON}
            />
          </Field>
          <Field label="ATCD VTE">
            <RadioGroup
              name="o-atcd-vte"
              value={draft.o_atcd_vte}
              onChange={(v) => p("o_atcd_vte", v)}
              options={OUI_NON}
            />
          </Field>
          <Field label="Thrombophilie">
            <SelectInput
              value={draft.o_thrombophilie}
              onChange={(v) => p("o_thrombophilie", v)}
              options={[
                { value: "non", label: "Non" },
                { value: "basse", label: "Basse" },
                { value: "haute", label: "Haute" },
              ]}
            />
          </Field>
          <Field label="BIP (mm)">
            <TextInput type="number" value={draft.o_bip} onChange={(v) => p("o_bip", v)} />
          </Field>
          <Field label="PC (mm)">
            <TextInput type="number" value={draft.o_pc} onChange={(v) => p("o_pc", v)} />
          </Field>
          <Field label="CA (mm)">
            <TextInput type="number" value={draft.o_ca} onChange={(v) => p("o_ca", v)} />
          </Field>
          <Field label="LF (mm)">
            <TextInput type="number" value={draft.o_lf} onChange={(v) => p("o_lf", v)} />
          </Field>
          <Field label="PFE (g)">
            <TextInput type="number" value={draft.o_pfe} onChange={(v) => p("o_pfe", v)} />
          </Field>
          <Field label="Col (mm)">
            <TextInput type="number" value={draft.o_col} onChange={(v) => p("o_col", v)} />
          </Field>
          <Field label="IP AO">
            <TextInput type="number" value={draft.o_ip_ao} onChange={(v) => p("o_ip_ao", v)} />
          </Field>
          <Field label="IP ACM">
            <TextInput type="number" value={draft.o_ip_acm} onChange={(v) => p("o_ip_acm", v)} />
          </Field>
          <Field label="Glycémie jeûn (g/L)">
            <TextInput type="number" value={draft.o_gly} onChange={(v) => p("o_gly", v)} />
          </Field>
          <Field label="HGPO T1 (g/L)">
            <TextInput type="number" value={draft.o_hgpo_t1} onChange={(v) => p("o_hgpo_t1", v)} />
          </Field>
          <Field label="HGPO T2 (g/L)">
            <TextInput type="number" value={draft.o_hgpo_t2} onChange={(v) => p("o_hgpo_t2", v)} />
          </Field>
        </div>
      </div>

      <FmfConverterPanel draft={draft} onField={onField} />
    </div>
  );
}

export function InfExtendedFields({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });
  return (
    <div className="space-y-4">
      <SectionTitle>Infertilité / PMA — v49</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="CFA (nombre)">
          <TextInput type="number" value={draft.i_cfa} onChange={(v) => p("i_cfa", v)} />
        </Field>
        <Field label="AMH (ng/mL)">
          <TextInput type="number" value={draft.i_amh_ngml} onChange={(v) => p("i_amh_ngml", v)} />
        </Field>
        <Field label="AMH (pmol/L)">
          <TextInput type="number" value={draft.i_amh_pmol} onChange={(v) => p("i_amh_pmol", v)} />
        </Field>
        <Field label="Tentatives FIV">
          <TextInput
            type="number"
            value={draft.i_tentatives_fiv}
            onChange={(v) => p("i_tentatives_fiv", v)}
          />
        </Field>
        <Field label="Mauvaise réponse ant.">
          <RadioGroup
            name="i-mauvaise-reponse"
            value={draft.i_mauvaise_reponse}
            onChange={(v) => p("i_mauvaise_reponse", v)}
            options={OUI_NON}
          />
        </Field>
        <Field label="ATCD OHSS">
          <SelectInput
            value={draft.i_atcd_ohss}
            onChange={(v) => p("i_atcd_ohss", v)}
            options={[
              { value: "non", label: "Non" },
              { value: "mod", label: "Modéré" },
              { value: "sev", label: "Sévère" },
            ]}
          />
        </Field>
        <Field label="Cause principale">
          <SelectInput
            value={draft.i_cause_inf}
            onChange={(v) => p("i_cause_inf", v)}
            options={[
              { value: "tubaire", label: "Tubaire" },
              { value: "ovulatoire", label: "Ovulatoire" },
              { value: "uterine", label: "Utérine" },
              { value: "endometriose", label: "Endométriose" },
              { value: "masculine", label: "Masculine" },
              { value: "mixte", label: "Mixte" },
              { value: "inexpliquee", label: "Inexpliquée" },
            ]}
          />
        </Field>
        <Field label="CA-125">
          <TextInput type="number" value={draft.i_ca125} onChange={(v) => p("i_ca125", v)} />
        </Field>
        <Field label="HE4 (pmol/L)">
          <TextInput type="number" value={draft.i_he4_inf} onChange={(v) => p("i_he4_inf", v)} />
        </Field>
        <Field label="Bilan hormonal J3" className="sm:col-span-2 lg:col-span-3">
          <TextArea value={draft.i_hormones} onChange={(v) => p("i_hormones", v)} />
        </Field>
      </div>
    </div>
  );
}

export function BilansTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });
  return (
    <div className="space-y-4">
      <SectionTitle>Biologie</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["bio_hb", "Hb (g/dL)"],
            ["bio_plq", "Plaquettes (G/L)"],
            ["bio_ferritine", "Ferritine"],
            ["bio_crp", "CRP"],
            ["bio_amh", "AMH (ng/mL)"],
            ["bio_ca125", "CA-125"],
            ["bio_he4", "HE4 (pmol/L)"],
            ["bio_gly", "Glycémie jeûn (g/L)"],
            ["bio_tsh", "TSH"],
            ["bio_fsh", "FSH"],
            ["bio_lh", "LH"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <TextInput
              type="number"
              value={draft[key]}
              onChange={(v) => p(key, v)}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}
