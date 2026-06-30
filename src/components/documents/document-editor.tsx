"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type { DocumentTemplate } from "@/types/documents";
import type { PatientSnapshot } from "@/types/domain";
import { getDocumentTemplate } from "@/data/document-templates";
import {
  buildDocumentContext,
  defaultFieldsForTemplate,
} from "@/lib/documents/build-context";
import { addDays, computeDpaFromDdr } from "@/lib/documents/smart-fields";
import { usePractitionerStore } from "@/stores/practitioner-store";
import { useModulesStore } from "@/stores/modules-store";
import "@/styles/documents.css";

type Props = {
  templateId: string;
  draft?: PatientSnapshot | null;
  onBack?: () => void;
  initialFields?: Record<string, string>;
};

export function DocumentEditor({
  templateId,
  draft,
  onBack,
  initialFields,
}: Props) {
  const template = getDocumentTemplate(templateId);
  const profile = usePractitionerStore((s) => s.profile);
  const nextDocNumber = useModulesStore((s) => s.nextDocNumber);
  const saveGeneratedDocument = useModulesStore((s) => s.saveGeneratedDocument);
  const saveDocumentFavorite = useModulesStore((s) => s.saveDocumentFavorite);

  const [fields, setFields] = useState<Record<string, string>>(() => ({
    ...defaultFieldsForTemplate(templateId, draft),
    ...initialFields,
  }));
  const [docNumber, setDocNumber] = useState("");
  const [favName, setFavName] = useState("");

  useEffect(() => {
    setDocNumber(nextDocNumber());
    setFields({
      ...defaultFieldsForTemplate(templateId, draft),
      ...initialFields,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const renderedHtml = useMemo(() => {
    if (!template) return "";
    const ctx = buildDocumentContext(fields, docNumber, profile, draft);
    return template.render(ctx);
  }, [template, fields, docNumber, profile, draft]);

  const patch = useCallback((id: string, value: string) => {
    setFields((f) => {
      const next = { ...f, [id]: value };
      if (id === "repos_deb" && next.repos_jours) {
        const j = parseInt(next.repos_jours, 10);
        if (j) next.repos_fin = addDays(value, j);
      }
      if (id === "repos_jours" && next.repos_deb) {
        const j = parseInt(value, 10);
        if (j) next.repos_fin = addDays(next.repos_deb, j);
      }
      if (id === "gro_ddr" && !next.gro_dpa) {
        next.gro_dpa = computeDpaFromDdr(value);
      }
      return next;
    });
  }, []);

  if (!template) {
    return <p className="text-sm text-[var(--muted)]">Modèle introuvable.</p>;
  }

  function saveHistory() {
    if (!template) return;
    const id = "gdoc_" + nanoid(8);
    saveGeneratedDocument({
      id,
      docNumber,
      templateId: template.id,
      category: template.category,
      title: template.title,
      patientId: draft?.id,
      patientName: buildDocumentContext(fields, docNumber, profile, draft).patient
        .fullName,
      fields: { ...fields },
      renderedHtml,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  function saveFavorite() {
    if (!template || !favName.trim()) return;
    saveDocumentFavorite({
      id: "fav_" + nanoid(8),
      templateId: template.id,
      name: favName.trim(),
      fields: { ...fields },
      createdAt: new Date().toISOString(),
    });
    setFavName("");
  }

  function copyText() {
    const tmp = document.createElement("div");
    tmp.innerHTML = renderedHtml;
    const text = tmp.innerText;
    void navigator.clipboard.writeText(text);
  }

  function printDoc() {
    if (!template) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${template.title}</title>
      <style>body{margin:0;font-family:Georgia,serif} @page{margin:12mm}</style></head><body>
      ${renderedHtml}
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
    saveHistory();
  }

  return (
    <div className="doc-editor-root">
      <div className="doc-no-print mb-3 flex flex-wrap items-center gap-2">
        {onBack ? (
          <button type="button" className="doc-btn doc-btn-secondary" onClick={onBack}>
            ← Retour
          </button>
        ) : null}
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          {template.icon} {template.title}
        </h2>
        <span className="ml-auto text-xs font-mono text-[var(--muted)]">{docNumber}</span>
      </div>

      <div className="doc-editor-layout">
        <div className="doc-form-panel doc-no-print">
          <RenderFields template={template} fields={fields} onPatch={patch} />
          <div className="doc-actions">
            <button type="button" className="doc-btn doc-btn-primary" onClick={printDoc}>
              Imprimer / PDF
            </button>
            <button type="button" className="doc-btn doc-btn-secondary" onClick={copyText}>
              Copier le texte
            </button>
            <button type="button" className="doc-btn doc-btn-secondary" onClick={saveHistory}>
              Enregistrer
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-lg border px-2 py-1 text-xs"
              placeholder="Nom du modèle favori…"
              value={favName}
              onChange={(e) => setFavName(e.target.value)}
            />
            <button type="button" className="doc-btn doc-btn-secondary" onClick={saveFavorite}>
              ⭐ Favori
            </button>
          </div>
        </div>

        <div className="doc-preview-panel">
          <p className="doc-no-print mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Aperçu live
          </p>
          <div
            className="doc-preview-paper doc-print-area"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}

function RenderFields({
  template,
  fields,
  onPatch,
}: {
  template: DocumentTemplate;
  fields: Record<string, string>;
  onPatch: (id: string, v: string) => void;
}) {
  const seen = new Set<string>();
  return (
    <div className="doc-field-grid">
      {template.fields.map((fd) => {
        const showSection =
          fd.section && !seen.has(fd.section) ? (seen.add(fd.section), true) : false;
        return (
          <div key={fd.id} className={fd.full ? "doc-field-full" : ""}>
            {showSection && fd.section ? (
              <div className="doc-section-title">{fd.section}</div>
            ) : null}
            <div className="doc-field">
            {fd.type !== "checkbox" ? (
              <label htmlFor={fd.id}>{fd.label}</label>
            ) : null}
              {fd.type === "textarea" ? (
                <textarea
                  id={fd.id}
                  rows={3}
                  placeholder={fd.placeholder}
                  value={fields[fd.id] ?? ""}
                  onChange={(e) => onPatch(fd.id, e.target.value)}
                />
              ) : fd.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id={fd.id}
                    type="checkbox"
                    checked={fields[fd.id] === "1"}
                    onChange={(e) => onPatch(fd.id, e.target.checked ? "1" : "")}
                  />
                  <span>{fd.label}</span>
                </label>
              ) : fd.type === "select" && fd.options ? (
                <select
                  id={fd.id}
                  value={fields[fd.id] ?? ""}
                  onChange={(e) => onPatch(fd.id, e.target.value)}
                >
                  <option value="">—</option>
                  {fd.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={fd.id}
                  type={fd.type === "number" ? "number" : fd.type === "date" ? "date" : fd.type === "time" ? "time" : "text"}
                  placeholder={fd.placeholder}
                  value={fields[fd.id] ?? ""}
                  onChange={(e) => onPatch(fd.id, e.target.value)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
