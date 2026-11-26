"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { addPatientToWaitingQueue } from "@/lib/waiting-room/register-arrival";
import { todayIso } from "@/lib/waiting-room/utils";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import { dossierStages, type DossierTabId } from "@/lib/dossier/dossier-nav";
import { PatientBanner } from "@/components/dossier/patient-banner";
import { generateDossierCompletPdf } from "@/lib/dossier/dossier-pdf";
import { DossierAlertsBar } from "@/components/dossier/dossier-alerts-bar";
import { BioCurvesPanel } from "@/components/dossier/bio-curves-panel";
import { DossierChecklistTab } from "@/components/dossier/dossier-checklist-tab";
import { OcrCameraModal } from "@/components/echo/ocr-camera-modal";
import { HawaeUnifiedPanel } from "@/components/ia/hawae-unified-panel";
import { ExamenCliniqueTab } from "@/components/dossier/examen-clinique-tab";
import { ExamensBilansTab } from "@/components/dossier/examens-bilans-tab";
import { AnamneseTab } from "@/components/dossier/anamnese-tab";
import { PmaClient } from "@/components/pma/pma-client";
import { ProtocolesClient } from "@/components/protocoles/protocoles-client";
import { RappelsClient } from "@/components/rappels/rappels-client";
import { PartogramPanel } from "@/components/partogram/partogram-panel";
import { DocumentsHub } from "@/components/documents/documents-hub";
import { DocumentsClient } from "@/components/documents/documents-client";
import { DossierScoresTab } from "@/components/scores/dossier-scores-tab";
import { DossierHistoriqueTab } from "@/components/dossier/dossier-tab-panels";

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
  onOpenOrdonnance?: () => void;
  onOpenCrOp?: () => void;
};

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
  onOpenOrdonnance,
  onOpenCrOp,
}: Props) {
  const router = useRouter();
  const [ocrOpen, setOcrOpen] = useState(false);
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

  const stages = useMemo(() => dossierStages(draft.specialite), [draft.specialite]);
  const stage = stages.find((s) => s.tabs.some((t) => t.id === tab)) ?? stages[0]!;
  const position = stage.tabs.findIndex((t) => t.id === tab);
  const nextTab = stage.tabs[position + 1];
  const lastTabs = useRef<Record<string, DossierTabId>>({});
  useEffect(() => {
    lastTabs.current[stage.id] = tab;
  }, [stage.id, tab]);

  function openStage(id: string) {
    const target = stages.find((s) => s.id === id)!;
    const last = lastTabs.current[id];
    onTab(target.tabs.some((t) => t.id === last) ? last! : target.tabs[0]!.id);
  }

  function moveTab(e: React.KeyboardEvent) {
    const n = stage.tabs.length;
    const to =
      e.key === "ArrowRight" ? (position + 1) % n
      : e.key === "ArrowLeft" ? (position + n - 1) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    onTab(stage.tabs[to]!.id);
    document.getElementById(`dossier-tab-${stage.tabs[to]!.id}`)?.focus();
  }

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

      <div className="dossier-app-body dossier-app-body--solo">
        <main className="dossier-main-content">
          <PatientBanner
            draft={draft}
            history={history}
            saving={saveStatus === "saving"}
            bridgeOnline={bridgeOnline}
            pdfBusy={pdfBusy}
            onClose={onClose}
            onNewConsultation={onNewConsultation}
            onOrdonnance={onOpenOrdonnance}
            onCrOp={onOpenCrOp}
            onWaiting={sendToWaiting}
            onPdf={exportPdf}
            onEcho={() => setOcrOpen(true)}
          />

          <DossierAlertsBar draft={draft} />

          <nav className="stage-nav" aria-label="Étapes du dossier">
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-current={s.id === stage.id ? "true" : undefined}
                onClick={() => openStage(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div
            className="dossier-tabs stage-tabs"
            role="tablist"
            aria-label={`Sections : ${stage.label}`}
            onKeyDown={moveTab}
          >
            {stage.tabs.map((t) => (
              <button
                key={t.id}
                id={`dossier-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="dossier-panel"
                tabIndex={tab === t.id ? 0 : -1}
                className={`dossier-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => onTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            className="dossier-tab-panel"
            id="dossier-panel"
            role="tabpanel"
            aria-labelledby={`dossier-tab-${tab}`}
          >
            {tab === "anamnese" && (
              <AnamneseTab
                draft={draft}
                onField={onField}
                onNavigateTab={onTab}
                patchDraft={patchDraft}
              />
            )}
            {tab === "examen" && (
              <ExamenCliniqueTab draft={draft} onField={onField} />
            )}
            {tab === "bilans" && <ExamensBilansTab draft={draft} onField={onField} patchDraft={patchDraft} />}
            {tab === "pma" && <PmaClient patientId={draft.id} embedded />}
            {tab === "scores" && <DossierScoresTab />}
            {tab === "hawae" && <HawaeUnifiedPanel draft={draft} />}
            {tab === "checklist" && <DossierChecklistTab draft={draft} />}
            {tab === "historique" && (
              <div className="space-y-6">
                <BioCurvesPanel entries={history} draft={draft} />
                <DossierHistoriqueTab
                  entries={history}
                  onLoad={(id) => {
                    if (!window.confirm("Ouvrir cette consultation remplace la consultation en cours dans le dossier. Les allergies actuelles sont conservées. Continuer ?")) return;
                    onLoadConsultation(id);
                    onTab("anamnese");
                  }}
                  onDelete={onDeleteConsultation}
                />
              </div>
            )}
            {tab === "docs" && (
              <div className="space-y-8">
                <DocumentsHub
                  draft={draft}
                  onOpenOrdonnance={onOpenOrdonnance}
                  onOpenCrOp={onOpenCrOp}
                />
                <DocumentsClient embedded patientId={draft.id} />
              </div>
            )}
            {tab === "certificat" && (
              <DocumentsHub draft={draft} />
            )}
            {tab === "protocoles" && <ProtocolesClient />}
            {tab === "rappels" && <RappelsClient />}
            {tab === "partogramme" && (
              <PartogramPanel
                embedded
                patientId={draft.id}
                initialName={dossierDisplayName(draft)}
                initialTerme={draft.o_terme ?? ""}
                initialAge={patientAgeYears(draft.ddn)?.toString() ?? ""}
                initialParite={draft.o_par ?? "0"}
              />
            )}
            {nextTab && stage.id === "consultation" ? (
              <div className="stage-next">
                <button
                  type="button"
                  className="pb-btn primary"
                  onClick={() => {
                    onTab(nextTab.id);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Continuer : {nextTab.label}
                </button>
              </div>
            ) : null}
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

    </>
  );
}
