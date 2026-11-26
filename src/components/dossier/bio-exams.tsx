"use client";

import { useState } from "react";
import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { Field, SelectInput, TextArea, TextInput } from "@/components/dossier/form-primitives";
import {
  ANALYTES,
  BIO_PANELS,
  deleteExam,
  examSummary,
  newExamId,
  panelById,
  saveExam,
  sortExams,
  termeAt,
} from "@/lib/dossier/examens";

type Props = {
  draft: PatientSnapshot;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
};

const PANEL_ORDER: Record<string, string[]> = {
  obst: ["prenatal_t1", "hgpo", "t2_t3", "pre_eclampsie", "grossesse"],
  inf: ["hormonal", "thyroide", "marqueurs", "grossesse"],
  gyn: ["nfs", "hormonal", "marqueurs", "preop", "thyroide"],
};

const today = () => new Date().toISOString().slice(0, 10);
const frDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("fr-FR");
};

function orderedPanels(spec?: string) {
  const first = PANEL_ORDER[spec ?? ""] ?? [];
  return [...BIO_PANELS].sort((a, b) => {
    const ia = first.indexOf(a.id);
    const ib = first.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

function ExamForm({
  draft,
  initial,
  onCancel,
  onSave,
}: {
  draft: PatientSnapshot;
  initial: ExamEntry;
  onCancel: () => void;
  onSave: (e: ExamEntry) => void;
}) {
  const [exam, setExam] = useState(initial);
  const panel = panelById(exam.panel);
  const setValue = (id: string, v: string) => setExam((e) => ({ ...e, values: { ...e.values, [id]: v } }));
  const filled = Object.values(exam.values).some((v) => v.trim());
  const terme = draft.o_ddr ? termeAt(draft.o_ddr, exam.date) : "";

  return (
    <form
      className="socle-event"
      onSubmit={(e) => {
        e.preventDefault();
        if (filled && exam.date) onSave({ ...exam, terme: terme || undefined });
      }}
    >
      <h3>{panel?.label ?? "Bilan biologique"}</h3>
      <div className="dossier-form-grid triple">
        <Field label={terme ? `Date du prélèvement (${terme})` : "Date du prélèvement"}>
          <TextInput type="date" value={exam.date} onChange={(v) => setExam((e) => ({ ...e, date: v }))} />
        </Field>
        {(panel?.analytes ?? Object.keys(exam.values)).map((id) => {
          const a = ANALYTES[id];
          if (!a) return null;
          const label = a.unit ? `${a.label} (${a.unit})` : a.label;
          return (
            <Field key={id} label={label}>
              {a.options ? (
                <SelectInput value={exam.values[id]} options={a.options} onChange={(v) => setValue(id, v)} />
              ) : (
                <TextInput
                  type="number"
                  value={exam.values[id]}
                  placeholder={a.placeholder}
                  onChange={(v) => setValue(id, v)}
                />
              )}
            </Field>
          );
        })}
        <Field label="Commentaire" className="span3">
          <TextArea
            rows={2}
            value={exam.conclusion}
            placeholder="Laboratoire, contexte, conduite à tenir…"
            onChange={(v) => setExam((e) => ({ ...e, conclusion: v }))}
          />
        </Field>
      </div>
      <div className="socle-actions">
        <button type="button" className="pb-btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="pb-btn primary" disabled={!filled || !exam.date}>
          Enregistrer le bilan
        </button>
      </div>
    </form>
  );
}

const SOCLE_FIELDS = new Set(["o_grp", "o_toxo", "o_rubeo"]);
const OLD_ONLY: { key: keyof PatientSnapshot & string; label: string }[] = [
  { key: "bio_infect", label: "Ag HBs / VIH" },
  { key: "bio_rai", label: "RAI" },
];

/**
 * Valeurs saisies avant les examens datés (anciens Bilans et anamnèse obstétricale) : affichées en
 * lecture pour ne rien perdre. Deux copies différentes de la même analyse sont montrées toutes deux.
 */
function LegacyValues({ draft }: { draft: PatientSnapshot }) {
  const measured = new Set((draft.examens ?? []).flatMap((e) => Object.keys(e.values)));
  const rows: { key: string; label: string; value: string }[] = [];
  for (const a of Object.values(ANALYTES)) {
    if (measured.has(a.id)) continue;
    const values = [
      ...new Set(
        a.targets
          .filter((t) => !SOCLE_FIELDS.has(t))
          .map((t) => String(draft[t] ?? "").trim())
          .filter(Boolean),
      ),
    ];
    if (!values.length || rows.some((r) => r.key === a.targets.join())) continue;
    const shown = values.map((v) => (a.options ? (a.options.find((o) => o.value === v)?.label ?? v) : v));
    rows.push({
      key: a.targets.join(),
      label: a.label,
      value: `${shown.join(" ou ")}${a.unit && !a.options ? ` ${a.unit}` : ""}${values.length > 1 ? " (valeurs différentes, à vérifier)" : ""}`,
    });
  }
  for (const o of OLD_ONLY) {
    const v = String(draft[o.key] ?? "").trim();
    if (v) rows.push({ key: o.key, label: o.label, value: v });
  }
  if (!rows.length) return null;
  return (
    <details className="socle-log">
      <summary>Valeurs saisies avant les examens datés, sans date ({rows.length})</summary>
      <ul>
        {rows.map((r) => (
          <li key={r.key}>
            {r.label} : {r.value}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function BioExams({ draft, patchDraft }: Props) {
  const [editing, setEditing] = useState<ExamEntry | null>(null);
  const [choosing, setChoosing] = useState(false);
  const exams = sortExams((draft.examens ?? []).filter((e) => e.kind === "bio"));

  function start(panelId: string) {
    setChoosing(false);
    setEditing({ id: newExamId(), date: today(), kind: "bio", panel: panelId, values: {}, origin: "saisie" });
  }

  return (
    <section className="dossier-card socle" aria-labelledby="bio-title">
      <div className="dossier-card-header socle-head">
        <div>
          <h3 id="bio-title">Biologie</h3>
          <p className="socle-sub">
            Chaque bilan garde sa date. La valeur la plus récente alimente les scores, les alertes et Hawae.
          </p>
        </div>
        <div className="socle-actions">
          <button
            type="button"
            className="pb-btn primary"
            aria-expanded={choosing}
            onClick={() => {
              setEditing(null);
              setChoosing((v) => !v);
            }}
          >
            + Biologie
          </button>
        </div>
      </div>
      <div className="dossier-card-body">
        {choosing ? (
          <div className="bio-panels" role="group" aria-label="Choisir le bilan">
            {orderedPanels(draft.specialite).map((p) => (
              <button key={p.id} type="button" className="pb-btn" onClick={() => start(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
        {editing ? (
          <ExamForm
            key={editing.id}
            draft={draft}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(e) => {
              patchDraft(saveExam(draft, e));
              setEditing(null);
            }}
          />
        ) : null}
        {exams.length ? (
          <ul className="socle-list">
            {exams.map((e) => (
              <li key={e.id}>
                <div className="socle-row">
                  <div>
                    <h4>
                      {frDate(e.date)}
                      {e.terme ? ` · ${e.terme}` : ""} · {panelById(e.panel)?.label ?? "Bilan"}
                    </h4>
                    <p>{examSummary(e)}</p>
                    {e.conclusion ? <p className="muted">{e.conclusion}</p> : null}
                  </div>
                  <div className="socle-actions">
                    <button type="button" className="pb-btn" onClick={() => setEditing(e)}>
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="pb-btn"
                      onClick={() => {
                        if (window.confirm(`Supprimer le bilan du ${frDate(e.date)} ?`)) {
                          patchDraft(deleteExam(draft, e.id));
                          if (editing?.id === e.id) setEditing(null);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : !editing && !choosing ? (
          <p className="socle-empty">Aucun bilan daté. Ajoutez le premier avec « + Biologie ».</p>
        ) : null}
        <LegacyValues draft={draft} />
      </div>
    </section>
  );
}
