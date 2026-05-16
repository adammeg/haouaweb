"use client";

import type { PatientSnapshot } from "@/types/domain";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  type FieldPatch,
} from "@/components/dossier/form-primitives";

const RAI_OPTIONS = [
  { value: "Négative", label: "Négative" },
  { value: "Positive (préciser)", label: "Positive (préciser)" },
];

const SERO_IMMUNE = [
  { value: "Immune (IgG+)", label: "Immune (IgG+)" },
  { value: "Non immune (IgG−)", label: "Non immune (IgG−)" },
  { value: "Infection active (IgM+)", label: "Infection active (IgM+)" },
];

const INFECT_OPTIONS = [
  { value: "AgHBs− / HIV−", label: "AgHBs− / HIV−" },
  { value: "AgHBs+", label: "AgHBs+" },
  { value: "HIV+", label: "HIV+" },
  { value: "AgHBs+ et HIV+", label: "AgHBs+ et HIV+" },
];

const ECBU_OPTIONS = [
  { value: "Stérile", label: "Stérile" },
  { value: "Infection urinaire", label: "Infection urinaire" },
  { value: "Leucocyturie sans germe", label: "Leucocyturie sans germe" },
];

export function ExamensBilansTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });

  return (
    <div className="space-y-0">
      <div className="dossier-card dossier-card-bio">
        <div className="dossier-card-header">
          <h3>🔬 Bilan biologique complet</h3>
          <span className="rounded-full bg-[var(--teal-pale)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
            Intégré automatiquement dans l&apos;analyse IA
          </span>
        </div>
        <div className="dossier-card-body">
          <div className="bio-section-title">🩸 NFS — Numération formule sanguine</div>
          <div className="dossier-form-grid triple mb-4">
            <Field label="Hémoglobine (g/dL)">
              <TextInput type="number" value={draft.bio_hb} placeholder="12.5" onChange={(v) => p("bio_hb", v)} />
            </Field>
            <Field label="VGM (fl)">
              <TextInput type="number" value={draft.bio_vgm} placeholder="88" onChange={(v) => p("bio_vgm", v)} />
            </Field>
            <Field label="Globules blancs (G/L)">
              <TextInput type="number" value={draft.bio_gb} placeholder="7.5" onChange={(v) => p("bio_gb", v)} />
            </Field>
            <Field label="Plaquettes (G/L)">
              <TextInput type="number" value={draft.bio_plq} placeholder="250" onChange={(v) => p("bio_plq", v)} />
            </Field>
            <Field label="Ferritine (µg/L)">
              <TextInput type="number" value={draft.bio_ferritine} placeholder="45" onChange={(v) => p("bio_ferritine", v)} />
            </Field>
            <Field label="CRP (mg/L)">
              <TextInput type="number" value={draft.bio_crp} placeholder="5" onChange={(v) => p("bio_crp", v)} />
            </Field>
          </div>

          <div className="bio-section-title">⚗️ Hormonologie</div>
          <div className="dossier-form-grid triple mb-4">
            <Field label="FSH (UI/L)">
              <TextInput type="number" value={draft.bio_fsh} placeholder="7.5" onChange={(v) => p("bio_fsh", v)} />
            </Field>
            <Field label="LH (UI/L)">
              <TextInput type="number" value={draft.bio_lh} placeholder="5.2" onChange={(v) => p("bio_lh", v)} />
            </Field>
            <Field label="Estradiol E2 (pg/mL)">
              <TextInput type="number" value={draft.bio_e2} placeholder="120" onChange={(v) => p("bio_e2", v)} />
            </Field>
            <Field label="AMH (ng/mL)">
              <TextInput type="number" value={draft.bio_amh} placeholder="2.8" onChange={(v) => p("bio_amh", v)} />
            </Field>
            <Field label="Progestérone (ng/mL)">
              <TextInput type="number" value={draft.bio_prog} placeholder="15" onChange={(v) => p("bio_prog", v)} />
            </Field>
            <Field label="Prolactine (mUI/L)">
              <TextInput type="number" value={draft.bio_prl} placeholder="350" onChange={(v) => p("bio_prl", v)} />
            </Field>
            <Field label="TSH (mUI/L)">
              <TextInput type="number" value={draft.bio_tsh} placeholder="2.1" onChange={(v) => p("bio_tsh", v)} />
            </Field>
            <Field label="Testostérone (ng/mL)">
              <TextInput type="number" value={draft.bio_testo} placeholder="0.45" onChange={(v) => p("bio_testo", v)} />
            </Field>
            <Field label="DHEAS (µg/dL)">
              <TextInput type="number" value={draft.bio_dheas} placeholder="180" onChange={(v) => p("bio_dheas", v)} />
            </Field>
          </div>

          <div className="bio-section-title">🧪 Glycémie & Biochimie</div>
          <div className="dossier-form-grid triple mb-4">
            <Field label="Glycémie à jeun (g/L)">
              <TextInput type="number" value={draft.bio_gly} placeholder="0.95" onChange={(v) => p("bio_gly", v)} />
            </Field>
            <Field label="HbA1c (%)">
              <TextInput type="number" value={draft.bio_hba1c} placeholder="5.5" onChange={(v) => p("bio_hba1c", v)} />
            </Field>
            <Field label="HGPO T1h (g/L)">
              <TextInput type="number" value={draft.bio_hgpo1} placeholder="1.50" onChange={(v) => p("bio_hgpo1", v)} />
            </Field>
            <Field label="HGPO T2h (g/L)">
              <TextInput type="number" value={draft.bio_hgpo2} placeholder="1.30" onChange={(v) => p("bio_hgpo2", v)} />
            </Field>
            <Field label="Créatinine (mg/L)">
              <TextInput type="number" value={draft.bio_creatinine} placeholder="8.5" onChange={(v) => p("bio_creatinine", v)} />
            </Field>
            <Field label="Acide urique (mg/L)">
              <TextInput type="number" value={draft.bio_urique} placeholder="50" onChange={(v) => p("bio_urique", v)} />
            </Field>
            <Field label="ASAT (UI/L)">
              <TextInput type="number" value={draft.bio_asat} placeholder="25" onChange={(v) => p("bio_asat", v)} />
            </Field>
            <Field label="ALAT (UI/L)">
              <TextInput type="number" value={draft.bio_alat} placeholder="22" onChange={(v) => p("bio_alat", v)} />
            </Field>
          </div>

          <div className="bio-section-title">🩹 Coagulation</div>
          <div className="dossier-form-grid triple mb-4">
            <Field label="TP (%)">
              <TextInput type="number" value={draft.bio_tp} placeholder="90" onChange={(v) => p("bio_tp", v)} />
            </Field>
            <Field label="TCA (ratio)">
              <TextInput type="number" value={draft.bio_tca} placeholder="1.1" onChange={(v) => p("bio_tca", v)} />
            </Field>
            <Field label="Fibrinogène (g/L)">
              <TextInput type="number" value={draft.bio_fibri} placeholder="3.2" onChange={(v) => p("bio_fibri", v)} />
            </Field>
            <Field label="D-Dimères (µg/L)">
              <TextInput type="number" value={draft.bio_ddimeres} placeholder="400" onChange={(v) => p("bio_ddimeres", v)} />
            </Field>
          </div>

          <div className="bio-section-title">🦠 Sérologies & Groupe sanguin</div>
          <div className="dossier-form-grid triple">
            <Field label="Groupe / Rhésus">
              <TextInput value={draft.bio_groupe} placeholder="A+ / O-" onChange={(v) => p("bio_groupe", v)} />
            </Field>
            <Field label="RAI">
              <SelectInput value={draft.bio_rai} onChange={(v) => p("bio_rai", v)} options={RAI_OPTIONS} />
            </Field>
            <Field label="βhCG (UI/L)">
              <TextInput type="number" value={draft.bio_bhcg} placeholder="0" onChange={(v) => p("bio_bhcg", v)} />
            </Field>
            <Field label="CA-125 (UI/mL)">
              <TextInput type="number" value={draft.bio_ca125} placeholder="15" onChange={(v) => p("bio_ca125", v)} />
            </Field>
            <Field label="HE4 (pmol/L)">
              <TextInput type="number" value={draft.bio_he4} placeholder="70" onChange={(v) => p("bio_he4", v)} />
            </Field>
            <Field label="Rubéole">
              <SelectInput value={draft.bio_rubeole} onChange={(v) => p("bio_rubeole", v)} options={SERO_IMMUNE} />
            </Field>
            <Field label="Toxoplasmose">
              <SelectInput value={draft.bio_toxo} onChange={(v) => p("bio_toxo", v)} options={SERO_IMMUNE} />
            </Field>
            <Field label="AgHBs / HIV">
              <SelectInput value={draft.bio_infect} onChange={(v) => p("bio_infect", v)} options={INFECT_OPTIONS} />
            </Field>
            <Field label="Protéinurie 24h (g/j)">
              <TextInput type="number" value={draft.bio_proteinurie} placeholder="0.15" onChange={(v) => p("bio_proteinurie", v)} />
            </Field>
            <Field label="ECBU">
              <SelectInput value={draft.bio_ecbu} onChange={(v) => p("bio_ecbu", v)} options={ECBU_OPTIONS} />
            </Field>
          </div>
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🔊 Imagerie</h3>
          <span className="ar">الفحوصات بالأشعة</span>
        </div>
        <div className="dossier-card-body">
          <div className="dossier-form-grid">
            <Field label="Résultats échographie">
              <TextArea
                rows={5}
                placeholder="Echo T2 (26SA): singleton, céphalique, biométries concordantes…"
                value={draft.bio_imagerie}
                onChange={(v) => p("bio_imagerie", v)}
              />
            </Field>
            <Field label="Joindre un fichier">
              <div
                className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--cream)] px-4 py-8 text-center text-sm text-[var(--muted)]"
                role="button"
                tabIndex={0}
                onClick={() =>
                  alert("Upload de fichiers — disponible dans le module Documents.")
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    alert("Upload de fichiers — disponible dans le module Documents.");
                  }
                }}
              >
                <div className="mb-2 text-2xl">📎</div>
                <p>
                  <strong>Cliquer pour attacher</strong> ou glisser-déposer
                  <br />
                  PDF, JPEG, PNG, DICOM — max 20 Mo
                </p>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
