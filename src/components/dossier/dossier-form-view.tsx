"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import { computeCompleteness } from "@/lib/patient-utils";
import {
  buildPatientSubtitle,
  dossierDisplayName,
} from "@/lib/dossier/patient-meta";
import { generateDossierCompletPdf } from "@/lib/dossier/dossier-pdf";
import { DossierAlertsBar } from "@/components/dossier/dossier-alerts-bar";
import { DossierChecklistTab } from "@/components/dossier/dossier-checklist-tab";
import { DossierAssistDrawer } from "@/components/dossier/dossier-assist-drawer";
import { OcrCameraModal } from "@/components/echo/ocr-camera-modal";
import { HawaePanel } from "@/components/ia/hawae-panel";
import { ExamenCliniqueTab } from "@/components/dossier/examen-clinique-tab";
import { ExamensBilansTab } from "@/components/dossier/examens-bilans-tab";
import { T2MorphoTab } from "@/components/dossier/t2-morpho-tab";
import { AnamneseTab } from "@/components/dossier/anamnese-tab";
import {
  DossierHistoriqueTab,
  DossierScoresTab,
} from "@/components/dossier/dossier-tab-panels";

export type DossierTabId =
  | "anamnese"
  | "examen"
  | "bilans"
  | "t2"
  | "scores"
  | "hawae"
  | "checklist"
  | "historique"
  | "docs"
  | "certificat";

type Props = {
  draft: PatientSnapshot;
  tab: DossierTabId;
  onTab: (t: DossierTabId) => void;
  onField: (p: Record<string, string | undefined>) => void;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
  onClose: () => void;
  onNewConsultation: () => void;
  history: ConsultationEntry[];
  onLoadConsultation: (id: string) => void;
  onDeleteConsultation: (id: string) => void;
  saveStatus: "saved" | "saving" | "idle";
};

const BASE_TABS: { id: DossierTabId; label: string }[] = [
  { id: "anamnese", label: "📋 Anamnèse" },
  { id: "examen", label: "🩺 Examen clinique" },
  { id: "bilans", label: "🔬 Examens & Bilans" },
  { id: "scores", label: "📊 Scores" },
  { id: "hawae", label: "🌬️ Hawae" },
  { id: "checklist", label: "✅ Checklist" },
  { id: "historique", label: "🕐 Historique" },
  { id: "docs", label: "📄 Docs" },
  { id: "certificat", label: "🧾 Certificat" },
];

export function DossierFormView({
  draft,
  tab,
  onTab,
  onField,
  patchDraft,
  onClose,
  onNewConsultation,
  history,
  onLoadConsultation,
  onDeleteConsultation,
  saveStatus,
}: Props) {
  const [assistOpen, setAssistOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState(false);

  const completeness = computeCompleteness(draft);

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (draft.specialite === "obst") {
      const i = list.findIndex((t) => t.id === "bilans");
      list.splice(i + 1, 0, { id: "t2", label: "🔬 Écho T2" });
    }
    return list;
  }, [draft.specialite]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("http://localhost:3847/latest", {
          signal: AbortSignal.timeout(2000),
        });
        if (!cancelled) setBridgeOnline(res.ok);
      } catch {
        if (!cancelled) setBridgeOnline(false);
      }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const exportPdf = useCallback(() => {
    setPdfBusy(true);
    void generateDossierCompletPdf(draft).finally(() => setPdfBusy(false));
  }, [draft]);

  return (
    <>
      <button type="button" className="dossier-back-btn" onClick={onClose}>
        ← Retour à la liste
      </button>

      <div className="dossier-app-body dossier-app-body--solo">
        <main className="dossier-main-content">
          <div className="dossier-page-title">
            <div>
              <h1>{dossierDisplayName(draft)}</h1>
              <div className="subtitle">{buildPatientSubtitle(draft)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-header"
                disabled={pdfBusy}
                onClick={exportPdf}
              >
                📤 PDF
              </button>
              <button
                type="button"
                className="btn-header btn-assist-inline"
                onClick={() => setAssistOpen(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 8.5C9 7.1 10.1 6 11.5 6S14 7.1 14 8.5c0 .8-.4 1.6-1 2.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="13" r="1.2" fill="currentColor" />
                </svg>
                <span>Assist</span>
              </button>
            </div>
          </div>

          <div className="storage-banner">
            <span className="sb-dot" aria-hidden />
            <span>
              <strong>Stockage local actif</strong> — Sauvegarde automatique
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link
                href="/bridge"
                className={`storage-pill storage-pill-bridge ${bridgeOnline ? "online" : ""}`}
              >
                <span className="bridge-dot" />
                <span>{bridgeOnline ? "Bridge connecté" : "Bridge hors ligne"}</span>
              </Link>
              <button
                type="button"
                className="storage-pill storage-pill-echo"
                onClick={() => setOcrOpen(true)}
              >
                📷 Écho
              </button>
              <span
                className={`save-indicator ${saveStatus === "saved" ? "saved" : saveStatus === "saving" ? "saving" : ""}`}
              >
                {saveStatus === "saving"
                  ? "Sauvegarde…"
                  : saveStatus === "saved"
                    ? "✓ Sauvegardé"
                    : "—"}
              </span>
              <button
                type="button"
                className="storage-btn-consult"
                onClick={onNewConsultation}
              >
                ➕ Nouvelle consultation
              </button>
            </div>
          </div>

          <div className="progress-wrap">
            <div className="progress-label">
              <span>Complétude du dossier</span>
              <span>{completeness}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          <DossierAlertsBar draft={draft} />

          <div className="dossier-tabs" role="tablist" aria-label="Sections du dossier">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`dossier-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => onTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="dossier-tab-panel">
            {tab === "anamnese" && (
              <AnamneseTab
                draft={draft}
                onField={onField}
                onNavigateTab={onTab}
              />
            )}
            {tab === "examen" && (
              <ExamenCliniqueTab draft={draft} onField={onField} />
            )}
            {tab === "bilans" && <ExamensBilansTab draft={draft} onField={onField} />}
            {tab === "t2" && draft.specialite === "obst" && (
              <T2MorphoTab draft={draft} onField={onField} />
            )}
            {tab === "scores" && <DossierScoresTab />}
            {tab === "hawae" && <HawaePanel draft={draft} />}
            {tab === "checklist" && <DossierChecklistTab draft={draft} />}
            {tab === "historique" && (
              <DossierHistoriqueTab
                entries={history}
                onLoad={(id) => {
                  onLoadConsultation(id);
                  onTab("anamnese");
                }}
                onDelete={onDeleteConsultation}
              />
            )}
            {tab === "docs" && (
              <div className="dossier-card">
                <div className="dossier-card-body text-center">
                  <p className="mb-4 text-sm text-[var(--muted)]">
                    Galerie et sauvegarde JSON des documents du cabinet.
                  </p>
                  <Link href="/documents" className="btn-header primary inline-flex">
                    Ouvrir la galerie Documents
                  </Link>
                </div>
              </div>
            )}
            {tab === "certificat" && (
              <div className="dossier-card">
                <div className="dossier-card-body text-center">
                  <p className="mb-4 text-sm text-[var(--muted)]">
                    Certificats médicaux et courriers — modèles prêts à l&apos;emploi.
                  </p>
                  <Link href="/certificats" className="btn-header primary inline-flex">
                    Ouvrir Certificats
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <button
        type="button"
        className="hawae-fab"
        onClick={() => setAssistOpen(true)}
        aria-label="Ouvrir Hawae, notre assistante clinique"
        title="Hawae — assistante clinique"
      >
        <span aria-hidden>✦</span>
        Hawae
      </button>

      <DossierAssistDrawer
        open={assistOpen}
        onClose={() => setAssistOpen(false)}
        draft={draft}
        patchDraft={patchDraft}
      />

      <OcrCameraModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onApply={(patch) => {
          onField(patch);
          setOcrOpen(false);
        }}
      />
    </>
  );
}
