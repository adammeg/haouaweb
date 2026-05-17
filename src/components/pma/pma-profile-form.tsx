"use client";

import type { ReactNode } from "react";
import type { IvfPatientProfile } from "@/lib/pma/ivf-types";

type Patch = <K extends keyof IvfPatientProfile>(
  key: K,
  value: IvfPatientProfile[K],
) => void;

function NumField({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="pma-field">
      <label>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : parseFloat(e.target.value))
        }
      />
      {hint ? <span className="pma-field-hint">{hint}</span> : null}
    </div>
  );
}

function SelField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="pma-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldWrap({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="pma-field">
      <label>{label}</label>
      {children}
      {hint ? <span className="pma-field-hint">{hint}</span> : null}
    </div>
  );
}

export function PmaProfileForm({
  section,
  profile,
  onPatch,
}: {
  section: string;
  profile: IvfPatientProfile;
  onPatch: Patch;
}) {
  const p = onPatch;

  if (section === "profil") {
    return (
      <>
        <div className="pma-card">
          <div className="pma-card-header">
            <div className="pma-card-title">👤 Profil de base</div>
          </div>
          <div className="pma-form-grid triple">
            <NumField
              label="Âge (ans) *"
              value={profile.age}
              onChange={(v) => p("age", v)}
              min={18}
              max={55}
            />
            <NumField
              label="IMC (kg/m²)"
              value={profile.bmi}
              onChange={(v) => p("bmi", v)}
              step={0.1}
            />
            <NumField
              label="Durée infertilité (mois)"
              value={profile.dureeInf}
              onChange={(v) => p("dureeInf", v)}
            />
            <SelField
              label="Type d'infertilité"
              value={profile.typeInf}
              onChange={(v) => p("typeInf", v)}
              options={[
                { value: "", label: "—" },
                { value: "primaire", label: "Primaire" },
                { value: "secondaire", label: "Secondaire" },
              ]}
            />
            <SelField
              label="Cause principale"
              value={profile.cause}
              onChange={(v) => p("cause", v)}
              options={[
                { value: "", label: "—" },
                { value: "ovulatoire", label: "Ovulatoire / SOPK" },
                { value: "tubaire", label: "Tubaire" },
                { value: "masculin", label: "Masculin" },
                { value: "endometriose", label: "Endométriose" },
                { value: "uterin", label: "Utérin" },
                { value: "mixte", label: "Mixte" },
                { value: "idiopathique", label: "Inexpliquée" },
              ]}
            />
            <SelField
              label="Indication FIV"
              value={profile.indication}
              onChange={(v) => p("indication", v)}
              options={[
                { value: "", label: "—" },
                { value: "fiv", label: "FIV classique" },
                { value: "icsi", label: "ICSI" },
                { value: "preservation", label: "Préservation fertilité" },
              ]}
            />
          </div>
        </div>
        <div className="pma-card">
          <div className="pma-card-header">
            <div className="pma-card-title">📋 Antécédents pertinents</div>
          </div>
          <div className="pma-form-grid triple">
            <SelField
              label="SOPK"
              value={profile.sopk}
              onChange={(v) => p("sopk", v)}
              options={[
                { value: "non", label: "Non" },
                { value: "oui", label: "Oui" },
                { value: "probable", label: "Probable" },
              ]}
            />
            <SelField
              label="Endométriose"
              value={profile.endo}
              onChange={(v) => p("endo", v)}
              options={[
                { value: "non", label: "Non" },
                { value: "stade12", label: "Stade I–II" },
                { value: "stade34", label: "Stade III–IV" },
              ]}
            />
            <SelField
              label="Chirurgie ovarienne"
              value={profile.chirOv}
              onChange={(v) => p("chirOv", v)}
              options={[
                { value: "non", label: "Non" },
                { value: "kyste", label: "Kystectomie" },
                { value: "monolateral", label: "Ovariectomie unilat." },
              ]}
            />
            <SelField
              label="ATCD OHSS"
              value={profile.ohssAtcd}
              onChange={(v) => p("ohssAtcd", v)}
              options={[
                { value: "non", label: "Non" },
                { value: "modere", label: "Modéré" },
                { value: "severe", label: "Sévère" },
              ]}
            />
          </div>
        </div>
      </>
    );
  }

  if (section === "reserve") {
    return (
      <div className="pma-card">
        <div className="pma-card-header">
          <div className="pma-card-title">🔬 Réserve ovarienne</div>
        </div>
        <div className="pma-form-grid">
          <NumField
            label="AMH (ng/mL)"
            value={profile.amh}
            onChange={(v) => p("amh", v)}
            step={0.01}
            hint="Diminuée < 1.2 · Très basse < 0.5"
          />
          <NumField
            label="CFA / AFC"
            value={profile.afc}
            onChange={(v) => p("afc", v != null ? Math.round(v) : null)}
            hint="Bas < 7 · Très bas < 5"
          />
        </div>
      </div>
    );
  }

  if (section === "hormones") {
    return (
      <div className="pma-card">
        <div className="pma-card-header">
          <div className="pma-card-title">🧪 Hormones J2–J3</div>
        </div>
        <div className="pma-form-grid">
          <NumField label="FSH (UI/L)" value={profile.fsh} onChange={(v) => p("fsh", v)} />
          <NumField label="LH (UI/L)" value={profile.lh} onChange={(v) => p("lh", v)} />
          <NumField label="E2 (pg/mL)" value={profile.e2} onChange={(v) => p("e2", v)} />
          <NumField label="TSH (mUI/L)" value={profile.tsh} onChange={(v) => p("tsh", v)} />
        </div>
      </div>
    );
  }

  if (section === "historique") {
    return (
      <div className="pma-card">
        <div className="pma-card-header">
          <div className="pma-card-title">📂 Historique FIV</div>
        </div>
        <div className="pma-form-grid triple">
          <NumField
            label="Cycles FIV antérieurs"
            value={profile.prevCycles}
            onChange={(v) => p("prevCycles", v != null ? Math.max(0, Math.round(v)) : 0)}
            min={0}
          />
          <NumField
            label="Ovocytes (dernier cycle)"
            value={profile.prevOocytes}
            onChange={(v) => p("prevOocytes", v != null ? Math.round(v) : null)}
          />
          <NumField
            label="Dose FSH précédente (UI/j)"
            value={profile.prevDose}
            onChange={(v) => p("prevDose", v)}
          />
        </div>
        <FieldWrap label="Notes historique">
          <textarea
            rows={3}
            value={profile.historyNotes}
            onChange={(e) => p("historyNotes", e.target.value)}
          />
        </FieldWrap>
      </div>
    );
  }

  return null;
}
