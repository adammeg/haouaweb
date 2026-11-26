"use client";

import type { PatientSnapshot } from "@/types/domain";
import { Field, TextArea, type FieldPatch } from "@/components/dossier/form-primitives";
import { BioExams } from "@/components/dossier/bio-exams";

export function ExamensBilansTab({
  draft,
  onField,
  patchDraft,
}: {
  draft: PatientSnapshot;
  onField: (p: FieldPatch) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
}) {
  const p = (k: keyof PatientSnapshot, v: string) => onField({ [k]: v });

  return (
    <div className="space-y-0">
      <BioExams draft={draft} patchDraft={patchDraft} />

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
