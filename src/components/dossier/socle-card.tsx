"use client";

import { useMemo, useRef, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { Field, SelectInput, TextArea, TextInput, type FieldPatch } from "@/components/dossier/form-primitives";
import { PillGroup } from "@/components/dossier/anamnese-shared";
import { O_INDCS } from "@/lib/dossier/anamnese-config";
import {
  SOCLE_EVENTS,
  SOCLE_SECTIONS,
  appendSocleLog,
  applySocleEvent,
  eventIsValid,
  planSocleMigration,
  sectionSummary,
  socleValue,
  suggestGpa,
  type SocleConflict,
  type SocleEventInput,
  type SocleEventKind,
  type SocleField,
  type SocleSection,
} from "@/lib/dossier/socle";

type Props = {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
};

const frDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");

function FieldInput({ f, draft, onField }: { f: SocleField; draft: PatientSnapshot; onField: Props["onField"] }) {
  const value = socleValue(draft, f.key);
  const set = (v: string) => onField({ [f.key]: v });
  const input =
    f.type === "pills" ? (
      <PillGroup name={`socle-${f.key}`} value={value} options={f.options ?? []} onChange={set} />
    ) : f.type === "select" ? (
      <SelectInput value={value} options={f.options ?? []} onChange={set} />
    ) : f.type === "textarea" ? (
      <TextArea value={value} rows={3} placeholder={f.placeholder} onChange={set} />
    ) : (
      <TextInput type={f.type} value={value} placeholder={f.placeholder} onChange={set} />
    );
  return (
    <Field label={f.label} className={f.wide ? "span3" : ""}>
      {input}
    </Field>
  );
}

function Conflicts({ conflicts, onChoose }: { conflicts: SocleConflict[]; onChoose: (c: SocleConflict, v: string) => void }) {
  return (
    <div className="socle-conflicts" role="alert">
      <p>
        <strong>À vérifier :</strong> ces informations avaient été saisies différemment selon les rubriques. Choisissez
        la bonne valeur ; aucune n&apos;a été retenue automatiquement.
      </p>
      <ul>
        {conflicts.map((c) => (
          <li key={c.key}>
            <span>{c.label}</span>
            <div>
              {c.values.map((v) => (
                <button key={v.source + v.value} type="button" className="pb-btn" onClick={() => onChoose(c, v.value)}>
                  {v.value} <small>({v.source})</small>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventForm({
  draft,
  kind,
  onCancel,
  onSave,
}: {
  draft: PatientSnapshot;
  kind: SocleEventKind;
  onCancel: () => void;
  onSave: (input: SocleEventInput) => void;
}) {
  const obstetric = ["accouchement", "fausse_couche", "ivg", "geu"].includes(kind);
  const [input, setInput] = useState<SocleEventInput>(() => ({
    date: new Date().toISOString().slice(0, 10),
    ...(obstetric ? suggestGpa(draft, kind) : {}),
    ...(kind === "accouchement" ? { voie: "voie basse" as const } : {}),
  }));
  const set = (p: Partial<SocleEventInput>) => setInput((s) => ({ ...s, ...p }));
  const label = SOCLE_EVENTS.find((e) => e.kind === kind)?.label;
  const textLabel: Partial<Record<SocleEventKind, string>> = {
    chirurgie: "Intervention",
    diagnostic: "Diagnostic",
    traitement: "Traitement (molécule, dose)",
    allergie: "Allergie et réaction",
  };

  return (
    <form
      className="socle-event"
      onSubmit={(e) => {
        e.preventDefault();
        if (eventIsValid(kind, input)) onSave(input);
      }}
    >
      <h3>{label}</h3>
      <div className="dossier-form-grid triple">
        <Field label="Date">
          <TextInput type="date" value={input.date} onChange={(v) => set({ date: v })} />
        </Field>
        {obstetric ? (
          <Field label="Terme (SA)">
            <TextInput type="number" value={input.terme} placeholder="39" onChange={(v) => set({ terme: v })} />
          </Field>
        ) : null}
        {kind === "accouchement" ? (
          <Field label="Voie">
            <PillGroup
              name="socle-voie"
              value={input.voie}
              options={[
                { value: "voie basse", label: "Voie basse" },
                { value: "césarienne", label: "Césarienne" },
              ]}
              onChange={(v) => set({ voie: v as SocleEventInput["voie"] })}
            />
          </Field>
        ) : null}
        {input.voie === "césarienne" && kind === "accouchement" ? (
          <Field label="Indication">
            <SelectInput value={input.indication} options={O_INDCS} onChange={(v) => set({ indication: v })} />
          </Field>
        ) : null}
        <Field label={textLabel[kind] ?? "Précisions"} className="span3">
          <TextInput value={input.text} onChange={(v) => set({ text: v })} />
        </Field>
        {obstetric ? (
          <Field label="G / P / A après cet événement (vérifiez)" className="span3">
            <div className="gpa-row">
              <TextInput type="number" value={input.g} placeholder="G" onChange={(v) => set({ g: v })} />
              <TextInput type="number" value={input.p} placeholder="P" onChange={(v) => set({ p: v })} />
              <TextInput type="number" value={input.a} placeholder="A" onChange={(v) => set({ a: v })} />
            </div>
          </Field>
        ) : null}
      </div>
      <div className="socle-actions">
        <button type="button" className="pb-btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="pb-btn primary" disabled={!eventIsValid(kind, input)}>
          Enregistrer l&apos;événement
        </button>
      </div>
    </form>
  );
}

/** Anamnèse commune : saisie une fois, relue d'un coup d'œil à chaque consultation. */
export function SocleCard({ draft, onField, patchDraft }: Props) {
  const isNew = !draft.nom?.trim() && !draft.prenom?.trim();
  const [editing, setEditing] = useState<string | null>(isNew ? "identite" : null);
  const [eventKind, setEventKind] = useState<SocleEventKind | null>(null);
  const before = useRef<PatientSnapshot | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);

  const conflicts = useMemo(
    () => (draft.socleMigrated ? [] : planSocleMigration(draft).conflicts),
    [draft],
  );

  function startEdit(id: string) {
    finishEdit();
    before.current = { ...draft };
    setEditing(id);
  }

  function finishEdit() {
    const id = editing;
    setEditing(null);
    const prev = before.current;
    before.current = null;
    if (!id || !prev) return;
    const section = SOCLE_SECTIONS.find((s) => s.id === id)!;
    const changed = section.fields.filter((f) => (socleValue(prev, f.key) || "") !== (socleValue(draft, f.key) || ""));
    if (!changed.length) return;
    patchDraft({
      socleLog: appendSocleLog(draft, `${section.title} : ${changed.map((f) => f.short ?? f.label).join(", ")} modifié(s)`),
    });
  }

  function choose(c: SocleConflict, value: string) {
    const rejected = c.values.filter((v) => v.value !== value).map((v) => `${v.value} (${v.source})`);
    const remaining = conflicts.filter((x) => x.key !== c.key);
    patchDraft({
      [c.key]: value,
      socleLog: appendSocleLog(draft, `${c.label} : « ${value} » retenu ; écarté : ${rejected.join(", ")}`),
      ...(remaining.length ? {} : { socleMigrated: "1" }),
    });
  }

  const disputed = new Set(conflicts.map((c) => c.key));
  const empty = (s: SocleSection) => !sectionSummary(s, draft, disputed);
  const log = draft.socleLog ?? [];

  return (
    <section className="dossier-card socle" aria-labelledby="socle-title">
      <div className="dossier-card-header socle-head">
        <div>
          <h3 id="socle-title">Anamnèse commune</h3>
          <p className="socle-sub">
            Reprise à chaque consultation.{" "}
            {draft.socleConfirmedAt ? `Revue le ${frDate(draft.socleConfirmedAt)}.` : "Jamais revue."}
          </p>
        </div>
        <div className="socle-actions">
          <button
            type="button"
            className="pb-btn"
            onClick={() => {
              finishEdit();
              patchDraft({ socleConfirmedAt: new Date().toISOString() });
            }}
          >
            Rien de nouveau
          </button>
          <details ref={menu} className="pb-menu">
            <summary className="pb-btn primary">Nouvel événement</summary>
            <div>
              {SOCLE_EVENTS.map((e) => (
                <button
                  key={e.kind}
                  type="button"
                  onClick={() => {
                    if (menu.current) menu.current.open = false;
                    finishEdit();
                    setEventKind(e.kind);
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
      <div className="dossier-card-body">
        {conflicts.length ? <Conflicts conflicts={conflicts} onChoose={choose} /> : null}
        {eventKind ? (
          <EventForm
            key={eventKind}
            draft={draft}
            kind={eventKind}
            onCancel={() => setEventKind(null)}
            onSave={(input) => {
              patchDraft(applySocleEvent(draft, eventKind, input));
              setEventKind(null);
            }}
          />
        ) : null}
        <ul className="socle-list">
          {SOCLE_SECTIONS.map((s) => {
            const open = editing === s.id;
            const summary = sectionSummary(s, draft, disputed);
            return (
              <li key={s.id} className={open ? "open" : ""}>
                <div className="socle-row">
                  <div>
                    <h4>
                      {s.title} <span className="ar">{s.ar}</span>
                    </h4>
                    {!open ? <p className={summary ? "" : "muted"}>{summary || "Non renseigné"}</p> : null}
                  </div>
                  <button
                    type="button"
                    className={open ? "pb-btn primary" : "pb-btn"}
                    aria-expanded={open}
                    onClick={() => (open ? finishEdit() : startEdit(s.id))}
                  >
                    {open ? "Terminé" : empty(s) ? "Renseigner" : "Modifier"}
                  </button>
                </div>
                {open ? (
                  <div className="dossier-form-grid triple socle-form">
                    {s.fields.map((f) => (
                      <FieldInput key={f.key} f={f} draft={draft} onField={onField} />
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {log.length ? (
          <details className="socle-log">
            <summary>Journal des modifications ({log.length})</summary>
            <ul>
              {log.slice(0, 30).map((e, i) => (
                <li key={e.date + i}>
                  <time dateTime={e.date}>{frDate(e.date)}</time> {e.text}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
