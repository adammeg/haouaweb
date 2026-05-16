"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import {
  Field,
  RadioGroup,
  SelectInput,
  TextArea,
  TextInput,
  type FieldPatch,
} from "@/components/dossier/form-primitives";
import {
  EC_CONSISTANCE,
  EC_DILATATION,
  EC_EFFACEMENT,
  EC_HPRES,
  EC_PRESENTATION,
  EXAM_CHIP_SECTIONS,
  defaultEcChips,
  parseEcChips,
  stringifyEcChips,
} from "@/lib/dossier/examen-clinique-config";

function calcImc(poids?: string, taille?: string): string {
  const p = parseFloat(poids ?? "");
  const t = parseFloat(taille ?? "");
  if (!p || !t || t <= 0) return "";
  const m = t / 100;
  const imc = p / (m * m);
  return Number.isFinite(imc) ? imc.toFixed(1) : "";
}

function ExamChipRow({
  section,
  selected,
  onToggle,
}: {
  section: (typeof EXAM_CHIP_SECTIONS)[number];
  selected: Set<string>;
  onToggle: (label: string) => void;
}) {
  return (
    <div className="exam-row">
      <div className="exam-row-label">
        {section.label}
        {section.sub ? <div className="exam-sub">{section.sub}</div> : null}
      </div>
      <div>
        <div className="exam-chip-group">
          {section.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`exam-chip ${selected.has(chip) ? "sel" : ""}`}
              onClick={() => onToggle(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExamenCliniqueTab({
  draft,
  onField,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });

  const [chips, setChips] = useState<Set<string>>(() => {
    const parsed = parseEcChips(draft.ec_chips);
    return parsed.size > 0 ? parsed : defaultEcChips();
  });

  useEffect(() => {
    const parsed = parseEcChips(draft.ec_chips);
    if (parsed.size > 0) {
      setChips(parsed);
    } else if (!draft.ec_chips) {
      setChips(defaultEcChips());
    }
  }, [draft.id, draft.ec_chips]);

  const imcDisplay = useMemo(
    () => calcImc(draft.ec_poids, draft.ec_taille),
    [draft.ec_poids, draft.ec_taille],
  );

  const toggleChip = (label: string) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      onField({ ec_chips: stringifyEcChips(next) });
      return next;
    });
  };

  return (
    <div className="space-y-0">
      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>⚖️ Constantes générales</h3>
          <span className="ar">القياسات العامة</span>
        </div>
        <div className="dossier-card-body">
          <div className="dossier-form-grid triple">
            <Field label="TA (mmHg)">
              <TextInput
                value={draft.ec_ta}
                placeholder="120/80"
                onChange={(v) => p("ec_ta", v)}
              />
            </Field>
            <Field label="Pouls (bpm)">
              <TextInput
                type="number"
                value={draft.ec_pouls}
                placeholder="75"
                onChange={(v) => p("ec_pouls", v)}
              />
            </Field>
            <Field label="Temp. (°C)">
              <TextInput
                type="number"
                value={draft.ec_temp}
                placeholder="37.2"
                onChange={(v) => p("ec_temp", v)}
              />
            </Field>
            <Field label="Poids (kg)">
              <TextInput
                type="number"
                value={draft.ec_poids}
                placeholder="68"
                onChange={(v) => p("ec_poids", v)}
              />
            </Field>
            <Field label="Taille (cm)">
              <TextInput
                type="number"
                value={draft.ec_taille}
                placeholder="165"
                onChange={(v) => p("ec_taille", v)}
              />
            </Field>
            <Field label="IMC calculé">
              <input
                type="text"
                readOnly
                className="hawae-input dossier-imc-readonly"
                value={imcDisplay || "—"}
                aria-readonly
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🫀 Examen général</h3>
          <span className="ar">الفحص العام</span>
        </div>
        <div className="dossier-card-body">
          {EXAM_CHIP_SECTIONS.slice(0, 3).map((sec) => (
            <ExamChipRow
              key={sec.id}
              section={sec}
              selected={chips}
              onToggle={toggleChip}
            />
          ))}
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🫁 Examen cardio-respiratoire</h3>
          <span className="ar">الفحص القلبي الرئوي</span>
        </div>
        <div className="dossier-card-body">
          {EXAM_CHIP_SECTIONS.slice(3, 5).map((sec) => (
            <ExamChipRow
              key={sec.id}
              section={sec}
              selected={chips}
              onToggle={toggleChip}
            />
          ))}
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🫃 Examen abdomino-pelvien</h3>
          <span className="ar">الفحص البطني الحوضي</span>
        </div>
        <div className="dossier-card-body">
          <ExamChipRow
            section={EXAM_CHIP_SECTIONS[5]}
            selected={chips}
            onToggle={toggleChip}
          />
          <ExamChipRow
            section={EXAM_CHIP_SECTIONS[6]}
            selected={chips}
            onToggle={toggleChip}
          />
          <div className="dossier-form-grid triple" style={{ marginTop: 10 }}>
            <Field label="Hauteur utérine (cm)">
              <TextInput
                type="number"
                value={draft.ec_hu}
                placeholder="28"
                onChange={(v) => p("ec_hu", v)}
              />
            </Field>
            <Field label="Présentation">
              <SelectInput
                value={draft.ec_presentation}
                onChange={(v) => p("ec_presentation", v)}
                options={EC_PRESENTATION.map((x) => ({ value: x, label: x }))}
              />
            </Field>
            <Field label="BCF">
              <RadioGroup
                name="ec-bcf"
                value={draft.ec_bcf || "pos"}
                onChange={(v) => p("ec_bcf", v)}
                options={[
                  { value: "pos", label: "✅ Positifs" },
                  { value: "abs", label: "❌ Absents" },
                ]}
              />
            </Field>
          </div>
          <ExamChipRow
            section={EXAM_CHIP_SECTIONS[7]}
            selected={chips}
            onToggle={toggleChip}
          />
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🔍 Examen au spéculum</h3>
          <span className="ar">فحص المنظار المهبلي</span>
        </div>
        <div className="dossier-card-body">
          {EXAM_CHIP_SECTIONS.slice(8, 10).map((sec) => (
            <ExamChipRow
              key={sec.id}
              section={sec}
              selected={chips}
              onToggle={toggleChip}
            />
          ))}
          <div className="exam-row">
            <div className="exam-row-label">Toucher vaginal</div>
            <div>
              <div className="dossier-form-grid">
                <Field label="Dilatation">
                  <SelectInput
                    value={draft.ec_dil}
                    onChange={(v) => p("ec_dil", v)}
                    options={EC_DILATATION.map((x) => ({ value: x, label: x }))}
                  />
                </Field>
                <Field label="Effacement">
                  <SelectInput
                    value={draft.ec_eff}
                    onChange={(v) => p("ec_eff", v)}
                    options={EC_EFFACEMENT.map((x) => ({ value: x, label: x }))}
                  />
                </Field>
                <Field label="Consistance">
                  <SelectInput
                    value={draft.ec_cons}
                    onChange={(v) => p("ec_cons", v)}
                    options={EC_CONSISTANCE.map((x) => ({ value: x, label: x }))}
                  />
                </Field>
                <Field label="Hauteur présentation">
                  <SelectInput
                    value={draft.ec_hpres}
                    onChange={(v) => p("ec_hpres", v)}
                    options={EC_HPRES.map((x) => ({ value: x, label: x }))}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>🩺 Examen des seins</h3>
          <span className="ar">فحص الثديين</span>
        </div>
        <div className="dossier-card-body">
          <ExamChipRow
            section={EXAM_CHIP_SECTIONS[10]}
            selected={chips}
            onToggle={toggleChip}
          />
        </div>
      </div>

      <div className="dossier-card">
        <div className="dossier-card-header">
          <h3>📝 Conclusion de l&apos;examen clinique</h3>
          <span className="ar">خلاصة الفحص السريري</span>
        </div>
        <div className="dossier-card-body">
          <Field label="Résumé sémiologique libre">
            <TextArea
              rows={4}
              placeholder="Résumé de l'examen clinique, éléments sémiologiques marquants, hypothèses diagnostiques…"
              value={draft.ec_conclusion}
              onChange={(v) => p("ec_conclusion", v)}
            />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="dossier-score-btn"
              onClick={() => {
                const parts: string[] = [];
                if (draft.ec_ta) parts.push(`TA ${draft.ec_ta}`);
                if (draft.ec_poids) parts.push(`Poids ${draft.ec_poids} kg`);
                if (imcDisplay) parts.push(`IMC ${imcDisplay}`);
                const chipList = [...chips].slice(0, 8).join(", ");
                if (chipList) parts.push(chipList);
                if (parts.length) {
                  p(
                    "ec_conclusion",
                    `Examen clinique : ${parts.join(" · ")}.`,
                  );
                }
              }}
            >
              ✨ Synthèse rapide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
