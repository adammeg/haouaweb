"use client";

import { useEffect, useState } from "react";
import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { Field, SelectInput, TextArea, TextInput } from "@/components/dossier/form-primitives";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { compressImage } from "@/lib/dossier/read-document";
import {
  BIO_PANELS,
  ECHO_PANELS,
  MEASURES,
  deleteExam,
  examSummary,
  newExamId,
  panelById,
  saveExam,
  sortExams,
  termeAt,
} from "@/lib/dossier/examens";

type Kind = ExamEntry["kind"];

type Props = {
  draft: PatientSnapshot;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
  kind: Kind;
  /** Examen prérempli par l'import d'un document, à faire vérifier. */
  incoming?: { exam: ExamEntry; notes: string[] } | null;
  onIncomingDone?: () => void;
  /** Limite la carte à certains types (ex. écho pelvienne dans l'anamnèse gynécologique). */
  panels?: string[];
  title?: string;
  sub?: string;
};

const PANEL_ORDER: Record<string, string[]> = {
  obst: ["prenatal_t1", "hgpo", "t2_t3", "pre_eclampsie", "grossesse", "echo_datation", "echo_croissance", "echo_doppler_bpp", "echo_col"],
  inf: ["hormonal", "thyroide", "marqueurs", "grossesse", "echo_infertilite", "echo_monitorage", "echo_pelvienne"],
  gyn: ["nfs", "hormonal", "marqueurs", "preop", "thyroide", "echo_pelvienne"],
};

const TEXT: Record<Kind, { title: string; sub: string; add: string; empty: string; save: string; date: string }> = {
  bio: {
    title: "Biologie",
    sub: "Chaque bilan garde sa date. La valeur la plus récente alimente les scores, les alertes et Hawae.",
    add: "+ Biologie",
    empty: "Aucun bilan daté. Ajoutez le premier avec « + Biologie » ou importez un compte rendu.",
    save: "Enregistrer le bilan",
    date: "Date du prélèvement",
  },
  echo: {
    title: "Échographies",
    sub: "Chaque échographie garde sa date et le terme. Les mesures les plus récentes alimentent les scores.",
    add: "+ Échographie",
    empty: "Aucune échographie datée. Ajoutez-en une avec « + Échographie » ou importez un compte rendu.",
    save: "Enregistrer l'échographie",
    date: "Date de l'échographie",
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const frDate = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("fr-FR");
};

function orderedPanels(kind: Kind, spec?: string, only?: string[]) {
  const first = PANEL_ORDER[spec ?? ""] ?? [];
  const list = (kind === "bio" ? BIO_PANELS : ECHO_PANELS).filter((p) => !only || only.includes(p.id));
  return [...list].sort((a, b) => {
    const ia = first.indexOf(a.id);
    const ib = first.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

/** Ouvre le document source dans un nouvel onglet (les liens data: directs sont bloqués). */
function openDataUrl(dataUrl: string) {
  fetch(dataUrl)
    .then((r) => r.blob())
    .then((b) => window.open(URL.createObjectURL(b), "_blank", "noopener"));
}

/** Vignettes des clichés d'un examen ; un clic ouvre l'image en grand. */
function Thumbs({ ids, onRemove }: { ids?: string[]; onRemove?: (id: string) => void }) {
  const ws = useModulesWorkspace();
  const docs = (ids ?? []).map((id) => ws.documents.find((d) => d.id === id)).filter((d) => d !== undefined);
  if (!docs.length) return null;
  return (
    <ul className="exam-thumbs">
      {docs.map((d) => (
        <li key={d.id}>
          <button type="button" onClick={() => openDataUrl(d.dataUrl)} aria-label={`Ouvrir ${d.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- image locale en data: URL */}
            <img src={d.dataUrl} alt={d.name} />
          </button>
          {onRemove ? (
            <button type="button" className="exam-thumb-remove" onClick={() => onRemove(d.id)}>
              Retirer
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ExamForm({
  draft,
  initial,
  notes,
  onCancel,
  onSave,
}: {
  draft: PatientSnapshot;
  initial: ExamEntry;
  notes: string[];
  onCancel: () => void;
  onSave: (e: ExamEntry) => void;
}) {
  const [exam, setExam] = useState(initial);
  const [busy, setBusy] = useState(false);
  const addDocument = useModulesStore((s) => s.addDocument);
  const panel = panelById(exam.panel);

  async function attach(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const ids: string[] = [];
      for (const file of Array.from(files).filter((f) => f.type.startsWith("image/"))) {
        ids.push(
          addDocument({
            patientId: draft.id,
            name: file.name,
            category: "echographie",
            mimeType: "image/jpeg",
            dataUrl: await compressImage(file),
          }),
        );
      }
      setExam((e) => ({ ...e, imageIds: [...(e.imageIds ?? []), ...ids] }));
    } finally {
      setBusy(false);
    }
  }
  const text = TEXT[exam.kind];
  const setValue = (id: string, v: string) => setExam((e) => ({ ...e, values: { ...e.values, [id]: v } }));
  const filled =
    Object.values(exam.values).some((v) => v.trim()) ||
    Boolean(exam.conclusion?.trim()) ||
    Boolean(exam.imageIds?.length);
  const terme = draft.o_ddr ? termeAt(draft.o_ddr, exam.date) : "";
  const ids = [...new Set([...(panel?.analytes ?? []), ...Object.keys(exam.values)])];
  const imported = exam.origin === "import";

  return (
    <form
      className="socle-event"
      onSubmit={(e) => {
        e.preventDefault();
        if (filled && exam.date) onSave({ ...exam, terme: terme || undefined });
      }}
    >
      <h3>{panel?.label ?? text.title}</h3>
      {imported ? (
        <div className="exam-import-note" role="status">
          <p>
            <strong>Valeurs lues automatiquement</strong>
            {exam.documentName ? ` depuis « ${exam.documentName} »` : ""}. Vérifiez chaque valeur et la date avant
            d&apos;enregistrer : rien n&apos;est enregistré sans votre validation.
          </p>
          {notes.length ? (
            <ul>
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="dossier-form-grid triple">
        <Field label={terme ? `${text.date} (${terme})` : text.date}>
          <TextInput type="date" value={exam.date} onChange={(v) => setExam((e) => ({ ...e, date: v }))} />
        </Field>
        {ids.map((id) => {
          const a = MEASURES[id];
          if (!a) return null;
          const label = a.unit ? `${a.label} (${a.unit})` : a.label;
          return (
            <Field key={id} label={label} className={a.text ? "span2" : ""}>
              {a.options ? (
                <SelectInput value={exam.values[id]} options={a.options} onChange={(v) => setValue(id, v)} />
              ) : (
                <TextInput
                  type={a.text ? "text" : "number"}
                  value={exam.values[id]}
                  placeholder={a.placeholder}
                  onChange={(v) => setValue(id, v)}
                />
              )}
            </Field>
          );
        })}
        <Field label={exam.kind === "echo" ? "Compte rendu de l'échographie" : "Commentaire"} className="span3">
          <TextArea
            rows={exam.kind === "echo" ? 5 : 2}
            value={exam.conclusion}
            placeholder={
              exam.kind === "echo"
                ? "Description, mesures complémentaires, conclusion…"
                : "Laboratoire, contexte, conduite à tenir…"
            }
            onChange={(v) => setExam((e) => ({ ...e, conclusion: v }))}
          />
        </Field>
      </div>
      {exam.kind === "echo" ? (
        <div className="exam-attach">
          <label className="pb-btn">
            {busy ? "Ajout du cliché…" : "Joindre un cliché"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void attach(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <Thumbs
            ids={exam.imageIds}
            onRemove={(id) => setExam((e) => ({ ...e, imageIds: (e.imageIds ?? []).filter((x) => x !== id) }))}
          />
        </div>
      ) : null}
      <div className="socle-actions">
        <button type="button" className="pb-btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="pb-btn primary" disabled={!filled || !exam.date}>
          {text.save}
        </button>
      </div>
    </form>
  );
}

const SOCLE_FIELDS = new Set(["o_grp", "o_toxo", "o_rubeo"]);
const OLD_ONLY: Record<Kind, { key: keyof PatientSnapshot & string; label: string }[]> = {
  bio: [
    { key: "bio_infect", label: "Ag HBs / VIH" },
    { key: "bio_rai", label: "RAI" },
  ],
  echo: [{ key: "bio_imagerie", label: "Résultats d'échographie (texte)" }],
};

/**
 * Valeurs saisies avant les examens datés : affichées en lecture pour ne rien perdre. Deux copies
 * différentes de la même mesure sont montrées toutes deux.
 */
function LegacyValues({ draft, kind }: { draft: PatientSnapshot; kind: Kind }) {
  const panels = kind === "bio" ? BIO_PANELS : ECHO_PANELS;
  const ids = new Set(panels.flatMap((p) => p.analytes));
  const measured = new Set((draft.examens ?? []).flatMap((e) => Object.keys(e.values)));
  const rows: { key: string; label: string; value: string }[] = [];
  for (const id of ids) {
    const a = MEASURES[id];
    if (!a || measured.has(id) || !a.targets.length) continue;
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
  for (const o of OLD_ONLY[kind]) {
    const v = String(draft[o.key] ?? "").trim();
    if (v) rows.push({ key: o.key, label: o.label, value: v });
  }
  if (!rows.length) return null;
  return (
    <details className="socle-log">
      <summary>Valeurs saisies avant les examens datés, sans date ({rows.length})</summary>
      <ul>
        {rows.map((r) => (
          <li key={r.key} className="legacy-row">
            {r.label} : {r.value}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ExamsCard({ draft, patchDraft, kind, incoming, onIncomingDone, panels, title, sub }: Props) {
  const [editing, setEditing] = useState<ExamEntry | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const ws = useModulesWorkspace();
  const exams = sortExams(
    (draft.examens ?? []).filter((e) => e.kind === kind && (!panels || panels.includes(e.panel ?? ""))),
  );
  const text = TEXT[kind];
  const choices = orderedPanels(kind, draft.specialite, panels);
  const cardId = `exams-${kind}${panels ? `-${panels.join("-")}` : ""}`;

  useEffect(() => {
    if (!incoming || incoming.exam.kind !== kind || panels) return;
    setChoosing(false);
    setEditing(incoming.exam);
    setNotes(incoming.notes);
    onIncomingDone?.();
    document.getElementById(`exams-${kind}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [incoming, kind, onIncomingDone, panels]);

  function start(panelId: string) {
    setChoosing(false);
    setNotes([]);
    setEditing({ id: newExamId(), date: today(), kind, panel: panelId, values: {}, origin: "saisie" });
  }

  function openSource(e: ExamEntry) {
    const doc = ws.documents.find((d) => d.id === e.documentId);
    if (doc) openDataUrl(doc.dataUrl);
    else window.alert("Le document source n'est plus disponible dans le module Documents.");
  }

  return (
    <section id={cardId} className="dossier-card socle" aria-labelledby={`${cardId}-title`}>
      <div className="dossier-card-header socle-head">
        <div>
          <h3 id={`${cardId}-title`}>{title ?? text.title}</h3>
          <p className="socle-sub">{sub ?? text.sub}</p>
        </div>
        <div className="socle-actions">
          <button
            type="button"
            className="pb-btn primary"
            aria-expanded={choosing}
            onClick={() => {
              setEditing(null);
              if (choices.length === 1) start(choices[0].id);
              else setChoosing((v) => !v);
            }}
          >
            {text.add}
          </button>
        </div>
      </div>
      <div className="dossier-card-body">
        {choosing ? (
          <div className="bio-panels" role="group" aria-label="Choisir le type">
            {choices.map((p) => (
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
            notes={notes}
            onCancel={() => setEditing(null)}
            onSave={(e) => {
              patchDraft(saveExam(draft, e));
              setEditing(null);
              setNotes([]);
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
                      {e.terme ? ` · ${e.terme}` : ""} · {panelById(e.panel)?.label ?? text.title}
                    </h4>
                    {examSummary(e) ? <p>{examSummary(e)}</p> : null}
                    {e.conclusion ? <p className="muted">{e.conclusion}</p> : null}
                    <Thumbs ids={e.imageIds} />
                  </div>
                  <div className="socle-actions">
                    {e.documentId ? (
                      <button type="button" className="pb-btn" onClick={() => openSource(e)}>
                        Document
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="pb-btn"
                      onClick={() => {
                        setNotes([]);
                        setEditing(e);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="pb-btn"
                      onClick={() => {
                        if (window.confirm(`Supprimer l'examen du ${frDate(e.date)} ?`)) {
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
          <p className="socle-empty">{text.empty}</p>
        ) : null}
        {panels ? null : <LegacyValues draft={draft} kind={kind} />}
      </div>
    </section>
  );
}
