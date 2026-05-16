"use client";

import { useMemo, useState } from "react";
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
import {
  checkT2Anomalies,
  getT2Percentiles,
  generateT2MorphoPdf,
} from "@/lib/t2-echo";
import { useHawaeStore } from "@/stores/hawae-store";
import { FetusPreview } from "@/components/echo/fetus-preview";
import { OcrCameraModal } from "@/components/echo/ocr-camera-modal";
import { DicomBridgePanel } from "@/components/echo/dicom-bridge-panel";

const QUALITE = [
  { value: "bonne", label: "Bonne" },
  { value: "moyenne", label: "Moyenne" },
  { value: "limitee", label: "Limitée" },
];
const POSITION = [
  { value: "cepha", label: "Céphalique" },
  { value: "siege", label: "Siège" },
  { value: "transverse", label: "Transverse" },
];
const EDF = [
  { value: "normal", label: "Normale" },
  { value: "absent", label: "Diastole absente" },
  { value: "reverse", label: "Diastole inversée" },
];
const LA = [
  { value: "normal", label: "Normal" },
  { value: "oligo", label: "Oligoamnios" },
  { value: "poly", label: "Hydramnios" },
];
const PLACENTA = [
  { value: "fondal", label: "Fundal" },
  { value: "ant", label: "Antérieur" },
  { value: "post", label: "Postérieur" },
  { value: "bas", label: "Bas inséré" },
  { value: "praevia", label: "Praevia" },
];
const OK_ND = [
  { value: "normal", label: "✓ Normal" },
  { value: "anormal", label: "Anormal" },
  { value: "nd", label: "ND" },
];
const OK_ABS = [
  { value: "normal", label: "✓ Normal" },
  { value: "absent", label: "Absent" },
  { value: "nd", label: "ND" },
];
const OUI_VIS = [
  { value: "visible", label: "✓ Visible" },
  { value: "absent", label: "Non visible" },
];
const INTACT = [
  { value: "intact", label: "✓ Intacte" },
  { value: "defect", label: "Défect" },
];

function PctBadge({ txt, alert }: { txt: string; alert?: boolean }) {
  if (!txt) return null;
  return (
    <span
      className={`mt-1 block text-[11px] font-semibold ${alert ? "text-red-600" : "text-emerald-700"}`}
    >
      {txt}
    </span>
  );
}

export function T2MorphoTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [iaBusy, setIaBusy] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const currentUser = useHawaeStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });
  const check = useMemo(() => checkT2Anomalies(draft), [draft]);
  const pcts = useMemo(() => getT2Percentiles(draft), [draft]);
  const pctMap = Object.fromEntries(pcts.map((r) => [r.key, r]));

  async function onPdf(withIa = false) {
    setPdfBusy(true);
    try {
      let iaText = draft.t2_ia_conclusion;
      if (withIa && !iaText) {
        iaText = await fetchT2IaReport();
      }
      await generateT2MorphoPdf(draft, currentUser?.name, iaText);
    } finally {
      setPdfBusy(false);
    }
  }

  async function fetchT2IaReport(): Promise<string | undefined> {
    setIaBusy(true);
    try {
      const res = await fetch("/api/ia/t2-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          doctorName: currentUser?.name,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) return undefined;
      p("t2_ia_conclusion", data.reply);
      return data.reply;
    } finally {
      setIaBusy(false);
    }
  }

  async function onIaOnly() {
    const text = await fetchT2IaReport();
    if (text) p("t2_ia_conclusion", text);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--teal)] to-[#0d7a7a] p-5 text-white shadow-md">
        <h2 className="font-display text-lg font-bold">Échographie morphologique T2</h2>
        <p className="mt-1 text-xs text-white/75">20–24 SA · ISUOG 2022 · Percentiles Salomon 2011</p>
      </div>

      <DicomBridgePanel onInject={(patch) => onField(patch)} />

      <FetusPreview draft={draft} doctorName={currentUser?.name} />

      <SectionTitle>Contexte examen</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Date">
          <TextInput type="date" value={draft.t2_date} onChange={(v) => p("t2_date", v)} />
        </Field>
        <Field label="Âge gestationnel (SA)">
          <TextInput type="number" value={draft.t2_ag} onChange={(v) => p("t2_ag", v)} placeholder="22" />
        </Field>
        <Field label="Opérateur">
          <TextInput value={draft.t2_operateur} onChange={(v) => p("t2_operateur", v)} />
        </Field>
        <Field label="Machine">
          <TextInput value={draft.t2_machine} onChange={(v) => p("t2_machine", v)} />
        </Field>
        <Field label="Qualité">
          <SelectInput value={draft.t2_qualite} onChange={(v) => p("t2_qualite", v)} options={QUALITE} />
        </Field>
        <Field label="Position fœtale">
          <SelectInput value={draft.t2_position} onChange={(v) => p("t2_position", v)} options={POSITION} />
        </Field>
      </div>

      <SectionTitle>Biométrie fœtale</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["t2_bip", "BIP (mm)", "bip"],
            ["t2_pc", "PC / HC (mm)", "pc"],
            ["t2_ca", "CA / AC (mm)", "ca"],
            ["t2_lf", "LF / FL (mm)", "lf"],
            ["t2_pfe", "PFE / EFW (g)", "pfe"],
          ] as const
        ).map(([key, label, pk]) => {
          const row = pctMap[pk];
          const res = row?.ref?.result;
          return (
            <Field key={key} label={label}>
              <TextInput
                type="number"
                value={draft[key]}
                onChange={(v) => p(key, v)}
              />
              {res ? (
                <PctBadge
                  txt={res.txt + " pct · P50: " + row!.ref!.ref.p50}
                  alert={res.col === "#dc2626"}
                />
              ) : null}
            </Field>
          );
        })}
        <Field label="Longueur col (mm)">
          <TextInput type="number" value={draft.t2_col} onChange={(v) => p("t2_col", v)} />
        </Field>
      </div>

      <SectionTitle>Doppler</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="IP artère ombilicale">
          <TextInput type="number" value={draft.t2_ip_ao} onChange={(v) => p("t2_ip_ao", v)} />
        </Field>
        <Field label="EDF ombilicale">
          <SelectInput value={draft.t2_edf} onChange={(v) => p("t2_edf", v)} options={EDF} />
        </Field>
        <Field label="IP ACM">
          <TextInput type="number" value={draft.t2_ip_acm} onChange={(v) => p("t2_ip_acm", v)} />
        </Field>
        <Field label="IP UtA gauche / droite">
          <div className="flex gap-2">
            <TextInput type="number" value={draft.t2_uta_g} onChange={(v) => p("t2_uta_g", v)} placeholder="G" />
            <TextInput type="number" value={draft.t2_uta_d} onChange={(v) => p("t2_uta_d", v)} placeholder="D" />
          </div>
        </Field>
        <Field label="Encoche UtA">
          <RadioGroup
            name="t2-encoche"
            value={draft.t2_encoche ?? "non"}
            onChange={(v) => p("t2_encoche", v)}
            options={[
              { value: "non", label: "Non" },
              { value: "uni", label: "Unilat." },
              { value: "bi", label: "Bilat." },
            ]}
          />
        </Field>
      </div>

      <SectionTitle>Liquide amniotique & placenta</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Liquide amniotique">
          <SelectInput value={draft.t2_la} onChange={(v) => p("t2_la", v)} options={LA} />
        </Field>
        <Field label="ILA (cm)">
          <TextInput type="number" value={draft.t2_ila} onChange={(v) => p("t2_ila", v)} />
        </Field>
        <Field label="Placenta">
          <SelectInput value={draft.t2_placenta_loc} onChange={(v) => p("t2_placenta_loc", v)} options={PLACENTA} />
        </Field>
        <Field label="Grade Grannum">
          <SelectInput
            value={draft.t2_placenta_grade}
            onChange={(v) => p("t2_placenta_grade", v)}
            options={["0", "1", "2", "3"].map((v) => ({ value: v, label: "Grade " + v }))}
          />
        </Field>
        <Field label="Distance col → placenta (mm)">
          <TextInput type="number" value={draft.t2_dist_col} onChange={(v) => p("t2_dist_col", v)} />
        </Field>
      </div>

      <SectionTitle>SNC · Cœur · Thorax-abdomen</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="CSP">
          <RadioGroup name="t2-csp" value={draft.t2_csp ?? "normal"} onChange={(v) => p("t2_csp", v)} options={OK_ABS} />
        </Field>
        <Field label="Cervelet">
          <RadioGroup name="t2-cerv" value={draft.t2_cerv ?? "normal"} onChange={(v) => p("t2_cerv", v)} options={OK_ND} />
        </Field>
        <Field label="Citerne magna (mm)">
          <TextInput type="number" value={draft.t2_cist_magna} onChange={(v) => p("t2_cist_magna", v)} />
        </Field>
        <Field label="Atrium ventriculaire (mm)">
          <TextInput type="number" value={draft.t2_atrium} onChange={(v) => p("t2_atrium", v)} />
        </Field>
        <Field label="Profil">
          <RadioGroup name="t2-profil" value={draft.t2_profil ?? "normal"} onChange={(v) => p("t2_profil", v)} options={[{ value: "normal", label: "Normal" }, { value: "anormal", label: "Anormal" }]} />
        </Field>
        <Field label="Lèvres / palais">
          <RadioGroup name="t2-levres" value={draft.t2_levres ?? "normal"} onChange={(v) => p("t2_levres", v)} options={[{ value: "normal", label: "Intacts" }, { value: "fente", label: "Fente" }, { value: "nd", label: "ND" }]} />
        </Field>
        <Field label="Situs">
          <RadioGroup name="t2-situs" value={draft.t2_situs ?? "normal"} onChange={(v) => p("t2_situs", v)} options={[{ value: "normal", label: "Normal" }, { value: "anormal", label: "Anormal" }]} />
        </Field>
        <Field label="4 cavités">
          <RadioGroup name="t2-4cav" value={draft.t2_4cav ?? "normal"} onChange={(v) => p("t2_4cav", v)} options={OK_ND} />
        </Field>
        <Field label="Voies éjection">
          <RadioGroup name="t2-vej" value={draft.t2_vej ?? "normal"} onChange={(v) => p("t2_vej", v)} options={OK_ND} />
        </Field>
        <Field label="3VT">
          <RadioGroup name="t2-3vt" value={draft.t2_3vt ?? "normal"} onChange={(v) => p("t2_3vt", v)} options={OK_ND} />
        </Field>
        <Field label="FCF (bpm)">
          <TextInput type="number" value={draft.t2_fcf} onChange={(v) => p("t2_fcf", v)} />
        </Field>
        <Field label="Rythme">
          <RadioGroup name="t2-rythme" value={draft.t2_rythme ?? "regulier"} onChange={(v) => p("t2_rythme", v)} options={[{ value: "regulier", label: "Régulier" }, { value: "irregulier", label: "Irrégulier" }]} />
        </Field>
        <Field label="Poumons">
          <RadioGroup name="t2-poumons" value={draft.t2_poumons ?? "normal"} onChange={(v) => p("t2_poumons", v)} options={[{ value: "normal", label: "Normaux" }, { value: "anormal", label: "Anormaux" }]} />
        </Field>
        <Field label="Estomac">
          <RadioGroup name="t2-estomac" value={draft.t2_estomac ?? "visible"} onChange={(v) => p("t2_estomac", v)} options={OUI_VIS} />
        </Field>
        <Field label="Paroi abdominale">
          <RadioGroup name="t2-paroi" value={draft.t2_paroi ?? "intact"} onChange={(v) => p("t2_paroi", v)} options={INTACT} />
        </Field>
        <Field label="Reins">
          <RadioGroup name="t2-reins" value={draft.t2_reins ?? "normal"} onChange={(v) => p("t2_reins", v)} options={[{ value: "normal", label: "Normaux" }, { value: "anormal", label: "Anormaux" }]} />
        </Field>
        <Field label="Pyélon (mm)">
          <TextInput type="number" value={draft.t2_pyelon} onChange={(v) => p("t2_pyelon", v)} />
        </Field>
        <Field label="Vessie">
          <RadioGroup name="t2-vessie" value={draft.t2_vessie ?? "oui"} onChange={(v) => p("t2_vessie", v)} options={[{ value: "oui", label: "Visible" }, { value: "non", label: "Non visible" }]} />
        </Field>
        <Field label="Rachis">
          <RadioGroup name="t2-rachis" value={draft.t2_rachis ?? "normal"} onChange={(v) => p("t2_rachis", v)} options={[{ value: "normal", label: "Normal" }, { value: "anormal", label: "Anormal" }]} />
        </Field>
        <Field label="Membres">
          <RadioGroup name="t2-membres" value={draft.t2_membres ?? "normal"} onChange={(v) => p("t2_membres", v)} options={[{ value: "normal", label: "Normaux" }, { value: "anormal", label: "Anormaux" }]} />
        </Field>
        <Field label="Sexe fœtal">
          <SelectInput
            value={draft.t2_sexe}
            onChange={(v) => p("t2_sexe", v)}
            options={[
              { value: "nd", label: "Non déterminé" },
              { value: "m", label: "Masculin" },
              { value: "f", label: "Féminin" },
            ]}
          />
        </Field>
      </div>

      <AnomalyBar check={check} />

      <Field label="Notes & observations">
        <TextArea value={draft.t2_notes} onChange={(v) => p("t2_notes", v)} rows={4} />
      </Field>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pdfBusy}
          onClick={() => void onPdf(false)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          {pdfBusy ? "Génération…" : "Générer compte-rendu PDF"}
        </button>
      </div>
      <Field label="Conclusion IA"><TextArea value={draft.t2_ia_conclusion} onChange={(v) => p("t2_ia_conclusion", v)} rows={6} /></Field>
      <div className="flex flex-wrap gap-3 mt-3">
        <button type="button" disabled={ocrOpen} onClick={() => setOcrOpen(true)} className="rounded-xl border border-[var(--teal)] px-4 py-2 text-sm font-semibold text-[var(--teal)]">OCR camera</button>
        <button type="button" disabled={iaBusy} onClick={() => void onIaOnly()} className="rounded-xl border px-4 py-2 text-sm font-semibold">{iaBusy ? "IA…" : "Rediger CR"}</button>
        <button type="button" disabled={pdfBusy || iaBusy} onClick={() => void onPdf(true)} className="rounded-xl bg-[#0d7a7a] px-4 py-2 text-sm font-bold text-white">IA + PDF</button>
      </div>
      <OcrCameraModal open={ocrOpen} onClose={() => setOcrOpen(false)} onApply={(patch) => onField(patch)} />
    </div>
  );
}

function AnomalyBar({ check }: { check: ReturnType<typeof checkT2Anomalies> }) {
  const cls =
    check.level === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : check.level === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <div className={"flex items-start gap-3 rounded-xl border p-4 text-sm font-medium " + cls}>
      <span className="text-xl" aria-hidden>
        {check.level === "danger" ? "🔴" : check.level === "warn" ? "⚠️" : "✅"}
      </span>
      <div>
        {check.level === "danger" ? (
          <>
            <strong>{check.anomalies.length} anomalie(s) :</strong>{" "}
            {check.anomalies.join(" · ")}
            {check.warnings.length > 0 ? (
              <span className="mt-1 block opacity-80">
                Vigilance : {check.warnings.join(", ")}
              </span>
            ) : null}
          </>
        ) : check.level === "warn" ? (
          <>
            <strong>Vigilance :</strong> {check.warnings.join(" · ")}
          </>
        ) : (
          <strong>Morphologie normale — aucune anomalie détectée</strong>
        )}
      </div>
    </div>
  );
}
