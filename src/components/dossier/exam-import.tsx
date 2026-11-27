"use client";

import { useRef, useState } from "react";
import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { useModulesStore } from "@/stores/modules-store";
import { parseLocally, redactIdentity, validateExtraction, type Extraction } from "@/lib/dossier/exam-import";
import { newExamId } from "@/lib/dossier/examens";
import { compressImage, fileToDataUrl, readDocumentText } from "@/lib/dossier/read-document";

const MAX_ARCHIVE = 2 * 1024 * 1024;

type Props = {
  draft: PatientSnapshot;
  onExtracted: (r: { exam: ExamEntry; notes: string[] }) => void;
};

/**
 * Importer un compte rendu : archivage dans les documents de la patiente, lecture sur le poste,
 * classement par Hawae (identité masquée) ou, à défaut, par la lecture locale. Le médecin vérifie
 * l'examen prérempli avant de l'enregistrer.
 */
export function ExamImport({ draft, onExtracted }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const addDocument = useModulesStore((s) => s.addDocument);
  const [status, setStatus] = useState<{ tone: "busy" | "error" | "ok"; text: string } | null>(null);

  async function onFile(file: File) {
    try {
      setStatus({ tone: "busy", text: "Lecture du document sur ce poste…" });
      const { text, scanned } = await readDocumentText(file);

      // Archivage dans les documents de la patiente (photos réduites ; gros PDF lus mais non archivés).
      let documentId: string | undefined;
      const notes: string[] = [];
      if (file.type.startsWith("image/")) {
        documentId = addDocument({ patientId: draft.id, name: file.name, category: "examen", mimeType: "image/jpeg", dataUrl: await compressImage(file) });
      } else if (file.size <= MAX_ARCHIVE) {
        documentId = addDocument({ patientId: draft.id, name: file.name, category: "examen", mimeType: file.type || "application/pdf", dataUrl: await fileToDataUrl(file) });
      } else {
        notes.push("Document de plus de 2 Mo : lu mais non archivé dans les documents de la patiente.");
      }
      if (scanned) notes.push("Document scanné ou photographié : la lecture des chiffres peut être imparfaite.");

      setStatus({ tone: "busy", text: "Hawae classe les résultats…" });
      let extraction: Extraction | null = null;
      let source = "Hawae";
      try {
        const res = await fetch("/api/ia/extract-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: redactIdentity(text, draft), specialite: draft.specialite, terme: draft.o_terme }),
        });
        if (res.ok) extraction = validateExtraction(((await res.json()) as { extraction: unknown }).extraction);
      } catch {
        /* lecture locale ci-dessous */
      }
      if (!extraction || !Object.keys(extraction.values).length) {
        const local = parseLocally(text);
        if (Object.keys(local.values).length >= Object.keys(extraction?.values ?? {}).length) {
          extraction = local;
          source = "la lecture locale";
        }
      }
      if (!extraction || !Object.keys(extraction.values).length) {
        setStatus({
          tone: "error",
          text: `Aucune valeur reconnue dans « ${file.name} ». ${documentId ? "Le document est archivé ; " : ""}saisissez l'examen à la main.`,
        });
        return;
      }
      onExtracted({
        exam: {
          id: newExamId(),
          date: extraction.date ?? new Date().toISOString().slice(0, 10),
          kind: extraction.kind,
          panel: extraction.panel,
          values: extraction.values,
          origin: "import",
          documentId,
          documentName: file.name,
        },
        notes: [
          `Classé par ${source}.`,
          ...(extraction.date ? [] : ["Date non trouvée dans le document : date du jour proposée."]),
          ...notes,
          ...extraction.notes,
        ],
      });
      setStatus({ tone: "ok", text: `« ${file.name} » lu : vérifiez l'examen prérempli ci-dessous.` });
    } catch (e) {
      setStatus({ tone: "error", text: e instanceof Error ? e.message : "Lecture impossible." });
    }
  }

  return (
    <section className="dossier-card exam-import" aria-label="Importer un compte rendu">
      <div className="dossier-card-body">
        <div
          className="exam-drop"
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              input.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
        >
          <strong>Importer un compte rendu</strong>
          <span>
            PDF ou photo d&apos;une biologie ou d&apos;une échographie. Hawae range les valeurs dans le bon examen ; vous
            vérifiez avant d&apos;enregistrer.
          </span>
        </div>
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
        {status ? (
          <p className={`exam-import-status ${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
            {status.text}
          </p>
        ) : null}
        <p className="exam-import-privacy">
          Le document est lu sur ce poste. Pour le classement, son texte est envoyé à Hawae après masquage du nom,
          du prénom, de la CIN, du téléphone et de la date de naissance de la patiente.
        </p>
      </div>
    </section>
  );
}
