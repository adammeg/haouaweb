"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { addPatientToWaitingQueue } from "@/lib/waiting-room/register-arrival";
import { todayIso } from "@/lib/waiting-room/utils";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import { computeCompleteness } from "@/lib/patient-utils";
import {
  buildPatientSubtitle,
  dossierDisplayName,
} from "@/lib/dossier/patient-meta";
import { generateDossierCompletPdf } from "@/lib/dossier/dossier-pdf";
import { DossierAlertsBar } from "@/components/dossier/dossier-alerts-bar";
import { BioCurvesPanel } from "@/components/dossier/bio-curves-panel";
import { DossierChecklistTab } from "@/components/dossier/dossier-checklist-tab";
import { OcrCameraModal } from "@/components/echo/ocr-camera-modal";
import { CrOpModal } from "@/components/dossier/cr-op-modal";
import { HawaeUnifiedPanel } from "@/components/ia/hawae-unified-panel";
import { ExamenCliniqueTab } from "@/components/dossier/examen-clinique-tab";
import { ExamensBilansTab } from "@/components/dossier/examens-bilans-tab";
import { AnamneseTab } from "@/components/dossier/anamnese-tab";
import { PmaClient } from "@/components/pma/pma-client";
import { ProtocolesClient } from "@/components/protocoles/protocoles-client";
import { RappelsClient } from "@/components/rappels/rappels-client";
import { PartogramClient } from "@/components/partogram/partogram-client";
import {
  DossierHistoriqueTab,
  DossierScoresTab,
} from "@/components/dossier/dossier-tab-panels";

export type DossierTabId =
  | "anamnese"
  | "examen"
  | "bilans"
  | "pma"
  | "scores"
  | "hawae"
  | "checklist"
  | "historique"
  | "docs"
  | "certificat"
  | "protocoles"
  | "rappels"
  | "partogramme";

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
  { id: "protocoles", label: "📚 Protocoles" },
  { id: "rappels", label: "🔔 Rappels" },
  { id: "partogramme", label: "📈 Partogramme" },
];

export function DossierFormView({
  draft,
  tab,
  onTab,
  onField,
  onClose,
  onNewConsultation,
  history,
  onLoadConsultation,
  onDeleteConsultation,
  saveStatus,
}: Props) {
  const router = useRouter();
  const [ocrOpen, setOcrOpen] = useState(false);
  const [crOpOpen, setCrOpOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [wrToast, setWrToast] = useState<string | null>(null);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const saveDraft = useHawaeStore((s) => s.saveDraft);
  const ws = useModulesWorkspace();
  const addWaiting = useModulesStore((s) => s.addWaiting);

  const queueToday = useMemo(
    () => ws.waitingQueue.filter((e) => e.date === todayIso()),
    [ws.waitingQueue],
  );

  const completeness = computeCompleteness(draft);

  const tabs = useMemo(() => {
    const list = [...BASE_TABS];
    if (draft.specialite === "inf") {
      const i = list.findIndex((t) => t.id === "bilans");
      list.splice(i + 1, 0, { id: "pma", label: "🧬 PMA / FIV" });
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

  const sendToWaiting = useCallback(() => {
    saveDraft();
    const result = addPatientToWaitingQueue(
      draft.id,
      patientsMap,
      queueToday,
      addWaiting,
    );
    if (!result.ok) {
      setWrToast(result.error);
      setTimeout(() => setWrToast(null), 3000);
      if (result.error.includes("Déjà")) {
        router.push("/salle-attente");
      }
      return;
    }
    router.push("/salle-attente");
  }, [saveDraft, draft.id, patientsMap, queueToday, addWaiting, router]);

  return (
    <>
      {wrToast ? (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-lg">
          {wrToast}
        </div>
      ) : null}

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
                title="Envoyer en salle d'attente"
                style={{
                  background: "#fef9e7",
                  color: "#92400e",
                  borderColor: "#fde68a",
                }}
                onClick={sendToWaiting}
              >
                🚪 Attente
              </button>
              <button
                type="button"
                className="btn-header"
                disabled={pdfBusy}
                onClick={exportPdf}
              >
                📤 PDF
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
            {tab === "pma" && draft.specialite === "inf" && (
              <PmaClient patientId={draft.id} embedded />
            )}
            {tab === "scores" && <DossierScoresTab />}
            {tab === "hawae" && <HawaeUnifiedPanel draft={draft} />}
            {tab === "checklist" && <DossierChecklistTab draft={draft} />}
            {tab === "historique" && (
              <div className="space-y-6">
                <BioCurvesPanel entries={history} draft={draft} />
                <DossierHistoriqueTab
                  entries={history}
                  onLoad={(id) => {
                    onLoadConsultation(id);
                    onTab("anamnese");
                  }}
                  onDelete={onDeleteConsultation}
                />
              </div>
            )}
            {tab === "docs" && (
              <div className="dossier-card">
                <div className="dossier-card-body text-center">
                  <p className="mb-4 text-sm text-[var(--muted)]">
                    Galerie et sauvegarde JSON des documents du cabinet.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/documents"
                      className="btn-header primary inline-flex"
                    >
                      Ouvrir la galerie Documents
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCrOpOpen(true)}
                      className="btn-header inline-flex"
                    >
                      🏥 CR opératoire
                    </button>
                  </div>
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
            {tab === "protocoles" && <ProtocolesClient />}
            {tab === "rappels" && <RappelsClient />}
            {tab === "partogramme" && <PartogramClient />}
          </div>
        </main>
      </div>

      <OcrCameraModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onApply={(patch) => {
          onField(patch);
          setOcrOpen(false);
        }}
      />

      <CrOpModal
        open={crOpOpen}
        onClose={() => setCrOpOpen(false)}
        draft={draft}
      />
    </>
  );
}
