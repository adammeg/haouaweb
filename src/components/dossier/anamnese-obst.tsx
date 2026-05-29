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
import { FmfConverterPanel } from "@/components/dossier/fmf-converter";
import {
  O_CONCEPT,
  O_DV_FLUX,
  O_EDF,
  O_GRP,
  O_INDCS,
  O_PRES,
  O_RUBEO,
  O_SUIVI,
  O_TOXO,
  O_TYPE,
  OBST_MOTIFS,
  calcTermeFromDdr,
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
import { ObstCalendrierPanel } from "@/components/dossier/obst-calendrier-panel";
import { ObstPartogramPanel } from "@/components/dossier/obst-partogram-panel";
import { T2MorphoTab } from "@/components/dossier/t2-morpho-tab";

const OBST_TABS = [
  { id: "motif", label: "💬 Motif" },
  { id: "grossesse", label: "🤰 Grossesse" },
  { id: "calendrier", label: "📅 Calendrier" },
  { id: "partogramme", label: "📈 Partogramme" },
  { id: "t1", label: "🔬 T1 / FMF" },
  { id: "echo", label: "📡 Écho & BPP" },
  { id: "morpho", label: "🫀 Morpho T2" },
  { id: "serol", label: "🧪 Séro & Bio" },
  { id: "atcdobs", label: "📋 ATCD obst." },
  { id: "surv", label: "📊 Surveillance" },
  { id: "atcd", label: "📜 ATCD médic." },
];

export function ObstAnamnese({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const [sub, setSub] = useState("motif");
  const patch = useAnaPatch(onField);

  const onDdr = (ddr: string) => {
    const calc = calcTermeFromDdr(ddr);
    if (calc) {
      onField({ o_ddr: ddr, o_terme: calc.terme, o_dpa: calc.dpa });
    } else {
      patch("o_ddr", ddr);
    }
  };

  return (
    <div className="ana-spec-block">
      <AnaSubTabs tabs={OBST_TABS} active={sub} onChange={setSub} />

      {sub === "motif" && (
        <AnaCard title="💬 Motif obstétrical" ar="سبب الاستشارة">
          <div className="dossier-form-grid full">
            <Field label="Motif principal *">
              <SelectInput
                value={draft.motif}
                onChange={(v) => patch("motif", v)}
                options={OBST_MOTIFS}
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={draft.symptomes}
                rows={3}
                placeholder="Début, caractère, évolution…"
                onChange={(v) => patch("symptomes", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "calendrier" && (
        <ObstCalendrierPanel
          draft={draft}
          onDdrChange={(ddr) => {
            const calc = calcTermeFromDdr(ddr);
            if (calc) {
              onField({ o_ddr: ddr, o_terme: calc.terme, o_dpa: calc.dpa });
            } else {
              onField({ o_ddr: ddr });
            }
          }}
        />
      )}

      {sub === "partogramme" && <ObstPartogramPanel draft={draft} />}

      {sub === "grossesse" && (
        <AnaCard title="🤰 Grossesse actuelle" ar="الحمل الحالي">
          <div className="dossier-form-grid triple">
            <Field label="G / P / A">
              <GpaRow
                g={draft.o_gest}
                p={draft.o_par}
                a={draft.o_abort}
                onG={(v) => patch("o_gest", v)}
                onP={(v) => patch("o_par", v)}
                onA={(v) => patch("o_abort", v)}
              />
            </Field>
            <Field label="DDR">
              <TextInput type="date" value={draft.o_ddr} onChange={onDdr} />
            </Field>
            <Field label="DPA calculé">
              <TextInput
                type="date"
                value={draft.o_dpa}
                onChange={(v) => patch("o_dpa", v)}
              />
            </Field>
            <Field label="Terme actuel">
              <TextInput
                value={draft.o_terme}
                placeholder="— SA"
                onChange={(v) => patch("o_terme", v)}
              />
            </Field>
            <Field label="Type de grossesse">
              <SelectInput
                value={draft.o_type}
                onChange={(v) => patch("o_type", v)}
                options={O_TYPE}
              />
            </Field>
            <Field label="Mode de conception">
              <SelectInput
                value={draft.o_concept}
                onChange={(v) => patch("o_concept", v)}
                options={O_CONCEPT}
              />
            </Field>
            <Field label="Suivi prénatal">
              <SelectInput
                value={draft.o_suivi}
                onChange={(v) => patch("o_suivi", v)}
                options={O_SUIVI}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "t1" && (
        <AnaCard title="🔬 Dépistage T1 — Marqueurs FMF" ar="الفحص الأول">
          <p className="ana-hint">
            Valeurs en MoM — saisir la valeur brute du labo ; conversion automatique
            ci-dessous.
          </p>
          <div className="dossier-form-grid triple">
            <Field label="CN / NT (mm)">
              <TextInput
                type="number"
                value={draft.o_nt}
                placeholder="1.8"
                onChange={(v) => patch("o_nt", v)}
              />
            </Field>
            <Field label="Os nasal">
              <PillGroup
                name="o-os-nasal"
                value={draft.o_os_nasal || "present"}
                options={[
                  { value: "present", label: "Présent" },
                  { value: "absent", label: "Absent" },
                  { value: "nd", label: "ND" },
                ]}
                onChange={(v) => patch("o_os_nasal", v)}
              />
            </Field>
            <Field label="Ductus venosus">
              <SelectInput
                value={draft.o_dv_flux}
                onChange={(v) => patch("o_dv_flux", v)}
                options={O_DV_FLUX}
              />
            </Field>
            <Field label="IP UtA gauche">
              <TextInput
                type="number"
                value={draft.o_uta_ip_g}
                placeholder="1.2"
                onChange={(v) => patch("o_uta_ip_g", v)}
              />
            </Field>
            <Field label="IP UtA droit">
              <TextInput
                type="number"
                value={draft.o_uta_ip_d}
                placeholder="1.2"
                onChange={(v) => patch("o_uta_ip_d", v)}
              />
            </Field>
            <Field label="MAP TA (mmHg)">
              <TextInput
                type="number"
                value={draft.o_map}
                placeholder="85"
                onChange={(v) => patch("o_map", v)}
              />
            </Field>
          </div>
          <FmfConverterPanel draft={draft} onField={onField} />
        </AnaCard>
      )}

      {sub === "echo" && (
        <AnaCard title="📡 Biométrie & Doppler fœtal" ar="قياسات الجنين">
          <div className="dossier-form-grid triple">
            <Field label="BIP (mm)">
              <TextInput type="number" value={draft.o_bip} onChange={(v) => patch("o_bip", v)} />
            </Field>
            <Field label="PC / HC (mm)">
              <TextInput type="number" value={draft.o_pc} onChange={(v) => patch("o_pc", v)} />
            </Field>
            <Field label="CA / AC (mm)">
              <TextInput type="number" value={draft.o_ca} onChange={(v) => patch("o_ca", v)} />
            </Field>
            <Field label="LF / FL (mm)">
              <TextInput type="number" value={draft.o_lf} onChange={(v) => patch("o_lf", v)} />
            </Field>
            <Field label="PFE / EFW (g)">
              <TextInput type="number" value={draft.o_pfe} onChange={(v) => patch("o_pfe", v)} />
            </Field>
            <Field label="Longueur col (mm)">
              <TextInput type="number" value={draft.o_col} onChange={(v) => patch("o_col", v)} />
            </Field>
          </div>
          <SectionDivider>Doppler fœtal</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="IP artère ombilicale">
              <TextInput type="number" value={draft.o_ip_ao} onChange={(v) => patch("o_ip_ao", v)} />
            </Field>
            <Field label="EDF ombilicale">
              <SelectInput value={draft.o_edf} onChange={(v) => patch("o_edf", v)} options={O_EDF} />
            </Field>
            <Field label="IP ACM">
              <TextInput type="number" value={draft.o_ip_acm} onChange={(v) => patch("o_ip_acm", v)} />
            </Field>
          </div>
          <SectionDivider>Score BPP</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="RCF / NST">
              <PillGroup
                name="o-bpp-nst"
                value={draft.o_bpp_nst || "1"}
                options={[
                  { value: "1", label: "Réactif" },
                  { value: "0", label: "Non réactif" },
                ]}
                onChange={(v) => patch("o_bpp_nst", v)}
              />
            </Field>
            <Field label="Mouvements respiratoires">
              <PillGroup
                name="o-bpp-resp"
                value={draft.o_bpp_resp || "1"}
                options={[
                  { value: "1", label: "Présents" },
                  { value: "0", label: "Absents" },
                ]}
                onChange={(v) => patch("o_bpp_resp", v)}
              />
            </Field>
            <Field label="Mouvements actifs fœtaux">
              <PillGroup
                name="o-bpp-mvt"
                value={draft.o_bpp_mvt || "1"}
                options={[
                  { value: "1", label: "≥3 mvts" },
                  { value: "0", label: "<3 mvts" },
                ]}
                onChange={(v) => patch("o_bpp_mvt", v)}
              />
            </Field>
            <Field label="Tonus fœtal">
              <PillGroup
                name="o-bpp-tonus"
                value={draft.o_bpp_tonus || "1"}
                options={[
                  { value: "1", label: "Normal" },
                  { value: "0", label: "Absent" },
                ]}
                onChange={(v) => patch("o_bpp_tonus", v)}
              />
            </Field>
            <Field label="Liquide amniotique">
              <PillGroup
                name="o-bpp-la"
                value={draft.o_bpp_la || "1"}
                options={[
                  { value: "1", label: "Normal" },
                  { value: "0", label: "Oligoamnios" },
                ]}
                onChange={(v) => patch("o_bpp_la", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "morpho" && <T2MorphoTab draft={draft} onField={onField} />}

      {sub === "serol" && (
        <AnaCard title="🧪 Sérologies & Biologie" ar="التحاليل البيولوجية">
          <div className="dossier-form-grid triple">
            <Field label="Groupe / Rhésus">
              <SelectInput value={draft.o_grp} onChange={(v) => patch("o_grp", v)} options={O_GRP} />
            </Field>
            <Field label="RAI">
              <PillGroup
                name="o-rai"
                value={draft.o_rai || "neg"}
                options={[
                  { value: "neg", label: "Nég." },
                  { value: "pos", label: "Pos." },
                  { value: "nd", label: "ND" },
                ]}
                onChange={(v) => patch("o_rai", v)}
              />
            </Field>
            <Field label="Toxoplasmose">
              <SelectInput value={draft.o_toxo} onChange={(v) => patch("o_toxo", v)} options={O_TOXO} />
            </Field>
            <Field label="Rubéole">
              <SelectInput value={draft.o_rubeo} onChange={(v) => patch("o_rubeo", v)} options={O_RUBEO} />
            </Field>
            <Field label="Ag HBs">
              <PillGroup
                name="o-hbv"
                value={draft.o_hbv || "neg"}
                options={[
                  { value: "neg", label: "Nég." },
                  { value: "pos", label: "Pos." },
                ]}
                onChange={(v) => patch("o_hbv", v)}
              />
            </Field>
            <Field label="VIH">
              <PillGroup
                name="o-vih"
                value={draft.o_vih || "neg"}
                options={[
                  { value: "neg", label: "Nég." },
                  { value: "pos", label: "Pos." },
                  { value: "nd", label: "ND" },
                ]}
                onChange={(v) => patch("o_vih", v)}
              />
            </Field>
            <Field label="NFS — Hb (g/dL)">
              <TextInput type="number" value={draft.o_hb} onChange={(v) => patch("o_hb", v)} />
            </Field>
            <Field label="Glycémie à jeun (g/L)">
              <TextInput type="number" value={draft.o_gly} onChange={(v) => patch("o_gly", v)} />
            </Field>
            <Field label="HGPO T1h (g/L)">
              <TextInput type="number" value={draft.o_hgpo_t1} onChange={(v) => patch("o_hgpo_t1", v)} />
            </Field>
            <Field label="HGPO T2h (g/L)">
              <TextInput type="number" value={draft.o_hgpo_t2} onChange={(v) => patch("o_hgpo_t2", v)} />
            </Field>
            <Field label="ECBU">
              <PillGroup
                name="o-ecbu"
                value={draft.o_ecbu || "norm"}
                options={[
                  { value: "norm", label: "Normal" },
                  { value: "pos", label: "Positif" },
                ]}
                onChange={(v) => patch("o_ecbu", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "atcdobs" && (
        <AnaCard title="📋 Antécédents obstétricaux" ar="السوابق التوليدية">
          <div className="dossier-form-grid">
            <Field label="Grossesses précédentes — détails">
              <TextArea
                value={draft.o_atcd_gross}
                rows={4}
                placeholder="G1 (2020): AVB 39SA…"
                onChange={(v) => patch("o_atcd_gross", v)}
              />
            </Field>
            <Field label="Complications obstétricales">
              <TextArea
                value={draft.o_complic}
                rows={4}
                placeholder="MAP, HTA gravidique, pré-éclampsie…"
                onChange={(v) => patch("o_complic", v)}
              />
            </Field>
            <Field label="Nombre CS antérieures">
              <TextInput type="number" value={draft.o_ncs} onChange={(v) => patch("o_ncs", v)} />
            </Field>
            <Field label="Indication CS">
              <SelectInput value={draft.o_indcs} onChange={(v) => patch("o_indcs", v)} options={O_INDCS} />
            </Field>
          </div>
          <SectionDivider>Facteurs de risque — PE · VTE · Diabète</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="ATCD pré-éclampsie">
              <PillGroup
                name="o-atcd-pe"
                value={draft.o_atcd_pe || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_atcd_pe", v)}
              />
            </Field>
            <Field label="ATCD prématurité spontanée">
              <PillGroup
                name="o-atcd-prem"
                value={draft.o_atcd_prematurite || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_atcd_prematurite", v)}
              />
            </Field>
            <Field label="ATCD thrombose (TVP/EP)">
              <PillGroup
                name="o-atcd-vte"
                value={draft.o_atcd_vte || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_atcd_vte", v)}
              />
            </Field>
            <Field label="Thrombophilie">
              <SelectInput
                value={draft.o_thrombophilie}
                onChange={(v) => patch("o_thrombophilie", v)}
                options={[
                  { value: "non", label: "Aucune" },
                  { value: "basse", label: "Faible risque" },
                  { value: "haute", label: "Haut risque" },
                ]}
              />
            </Field>
            <Field label="Lupus (LED)">
              <PillGroup
                name="o-led"
                value={draft.o_led || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_led", v)}
              />
            </Field>
            <Field label="SAPL">
              <PillGroup
                name="o-apl"
                value={draft.o_apl || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_apl", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "surv" && (
        <AnaCard title="📊 Constantes du jour" ar="قياسات اليوم">
          <div className="dossier-form-grid triple">
            <Field label="TA (mmHg)">
              <TextInput value={draft.o_ta} placeholder="120/80" onChange={(v) => patch("o_ta", v)} />
            </Field>
            <Field label="Poids (kg)">
              <TextInput type="number" value={draft.o_poids} onChange={(v) => patch("o_poids", v)} />
            </Field>
            <Field label="Prise de poids totale (kg)">
              <TextInput type="number" value={draft.o_pdstot} onChange={(v) => patch("o_pdstot", v)} />
            </Field>
            <Field label="HU (cm)">
              <TextInput type="number" value={draft.o_hu} onChange={(v) => patch("o_hu", v)} />
            </Field>
            <Field label="Présentation">
              <SelectInput value={draft.o_pres} onChange={(v) => patch("o_pres", v)} options={O_PRES} />
            </Field>
            <Field label="BCF">
              <PillGroup
                name="o-bcf"
                value={draft.o_bcf || "pos"}
                options={[
                  { value: "pos", label: "✅ Pos." },
                  { value: "abs", label: "❌ Abs." },
                ]}
                onChange={(v) => patch("o_bcf", v)}
              />
            </Field>
            <Field label="MAF">
              <PillGroup
                name="o-maf"
                value={draft.o_maf || "bien"}
                options={[
                  { value: "bien", label: "Bien perçus" },
                  { value: "dim", label: "Diminués" },
                  { value: "abs", label: "Absents" },
                ]}
                onChange={(v) => patch("o_maf", v)}
              />
            </Field>
            <Field label="Contractions">
              <PillGroup
                name="o-cu"
                value={draft.o_cu || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "bh", label: "Braxton-Hicks" },
                  { value: "reg", label: "Régulières" },
                ]}
                onChange={(v) => patch("o_cu", v)}
              />
            </Field>
            <Field label="Œdèmes">
              <PillGroup
                name="o-oed"
                value={draft.o_oed || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                  { value: "godet", label: "Godet" },
                ]}
                onChange={(v) => patch("o_oed", v)}
              />
            </Field>
          </div>
          <SectionDivider>Signes d&apos;alarme pré-éclampsie</SectionDivider>
          <div className="dossier-form-grid triple">
            <Field label="Bandelette — protéines">
              <SelectInput
                value={draft.o_bandelette}
                onChange={(v) => patch("o_bandelette", v)}
                options={[
                  { value: "", label: "— Non testée —" },
                  { value: "neg", label: "Négative" },
                  { value: "trace", label: "Traces" },
                  { value: "1+", label: "1+" },
                  { value: "2+", label: "2+" },
                  { value: "3+", label: "3+" },
                ]}
              />
            </Field>
            <Field label="Céphalées / Troubles visuels">
              <PillGroup
                name="o-cephalees"
                value={draft.o_cephalees || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_cephalees", v)}
              />
            </Field>
            <Field label="Douleur épigastrique">
              <PillGroup
                name="o-epigastre"
                value={draft.o_epigastre || "non"}
                options={[
                  { value: "non", label: "Non" },
                  { value: "oui", label: "Oui" },
                ]}
                onChange={(v) => patch("o_epigastre", v)}
              />
            </Field>
          </div>
        </AnaCard>
      )}

      {sub === "atcd" && (
        <AnaCard title="📜 ATCD médicaux & Mode de vie" ar="السوابق الطبية">
          <AtcdCommun
            draft={draft}
            patch={patch}
            diabeteExtra={[
              { value: "non", label: "Non" },
              { value: "t1", label: "DT1" },
              { value: "t2", label: "DT2" },
              { value: "gesta", label: "Gesta." },
            ]}
          />
          <Field label="IMC pré-grossesse" className="mt-4 max-w-xs">
            <TextInput type="number" value={draft.imc} onChange={(v) => patch("imc", v)} />
          </Field>
        </AnaCard>
      )}
    </div>
  );
}
