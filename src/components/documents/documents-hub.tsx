"use client";

import { useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import type { DocumentCategory } from "@/types/documents";
import {
  DOCUMENT_TEMPLATES,
  templatesByCategory,
} from "@/data/document-templates";
import { DocumentEditor } from "@/components/documents/document-editor";
import { useModulesWorkspace } from "@/stores/modules-store";
import { usePractitionerStore } from "@/stores/practitioner-store";
import "@/styles/documents.css";

const CATEGORIES: { id: DocumentCategory | "actions"; label: string }[] = [
  { id: "cr_op", label: "CR opératoires" },
  { id: "ordonnance", label: "Ordonnances" },
  { id: "certificat", label: "Certificats" },
  { id: "lettre", label: "Lettres & courriers" },
  { id: "pma", label: "PMA" },
  { id: "actions", label: "Actions rapides" },
];

type Props = {
  draft?: PatientSnapshot | null;
  onOpenOrdonnance?: () => void;
  onOpenCrOp?: () => void;
};

export function DocumentsHub({ draft, onOpenOrdonnance, onOpenCrOp }: Props) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [reopenFields, setReopenFields] = useState<Record<string, string> | undefined>();
  const [cat, setCat] = useState<DocumentCategory | "actions">("certificat");
  const ws = useModulesWorkspace();
  const profile = usePractitionerStore((s) => s.profile);

  if (activeTemplate) {
    return (
      <DocumentEditor
        templateId={activeTemplate}
        draft={draft}
        initialFields={reopenFields}
        onBack={() => {
          setActiveTemplate(null);
          setReopenFields(undefined);
        }}
      />
    );
  }

  const templates =
    cat === "actions"
      ? []
      : templatesByCategory(cat as DocumentCategory);

  const practitionerOk =
    profile.nom.trim() || profile.etablissement.trim();

  return (
    <div className="doc-editor-root space-y-6">
      {!practitionerOk ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Complétez votre{" "}
          <a href="/settings" className="font-semibold underline">
            profil praticien
          </a>{" "}
          pour personnaliser l&apos;entête de tous les documents.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-semibold " +
              (cat === c.id
                ? "bg-[var(--teal)] text-white"
                : "border border-[var(--border)] bg-white")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {cat === "actions" ? (
        <div className="doc-hub-grid">
          <button type="button" className="doc-hub-btn" onClick={onOpenOrdonnance}>
            <span className="icon">💊</span>
            <span className="label">Ordonnance structurée</span>
          </button>
          <button type="button" className="doc-hub-btn" onClick={onOpenCrOp}>
            <span className="icon">🏥</span>
            <span className="label">CR opératoire (modal)</span>
          </button>
        </div>
      ) : (
        <div className="doc-hub-grid">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className="doc-hub-btn"
              onClick={() => setActiveTemplate(t.id)}
            >
              <span className="icon">{t.icon}</span>
              <span className="label">{t.title}</span>
            </button>
          ))}
          {templates.length === 0 ? (
            <p className="text-sm text-[var(--muted)] col-span-full">
              Modèles à venir pour cette catégorie.
            </p>
          ) : null}
        </div>
      )}

      {(ws.documentFavorites ?? []).length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Modèles favoris
          </h3>
          <div className="doc-hub-grid">
            {(ws.documentFavorites ?? []).map((f) => {
              const t = DOCUMENT_TEMPLATES.find((x) => x.id === f.templateId);
              return (
                <button
                  key={f.id}
                  type="button"
                  className="doc-hub-btn"
                  onClick={() => setActiveTemplate(f.templateId)}
                >
                  <span className="icon">⭐</span>
                  <span className="label">{f.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{t?.title}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {(ws.generatedDocuments ?? []).filter(
        (d) => !draft?.id || d.patientId === draft.id,
      ).length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Documents récents
          </h3>
          <div className="doc-recent-list">
            {(ws.generatedDocuments ?? [])
              .filter((d) => !draft?.id || d.patientId === draft.id)
              .map((d) => (
              <div key={d.id} className="doc-recent-item">
                <div>
                  <strong>{d.title}</strong>
                  <span className="ml-2 text-[var(--muted)]">{d.patientName}</span>
                  <div className="text-[10px] text-[var(--muted)]">
                    {d.docNumber} ·{" "}
                    {new Date(d.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <button
                  type="button"
                  className="doc-btn doc-btn-secondary"
                  onClick={() => {
                    setReopenFields(d.fields);
                    setActiveTemplate(d.templateId);
                  }}
                >
                  Rouvrir
                </button>
              </div>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
