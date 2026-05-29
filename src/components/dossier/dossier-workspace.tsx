"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHawaeStore } from "@/stores/hawae-store";
import type { ConsultationEntry } from "@/types/domain";
import {
  EMPTY_CONSULT_LIST,
  EMPTY_HISTORY_MAP,
  EMPTY_PATIENTS_MAP,
} from "@/lib/empty-stable";
import { OrdonnanceModal } from "@/components/ordo/ordonnance-modal";
import {
  DossierFormView,
  type DossierTabId,
} from "@/components/dossier/dossier-form-view";
import { DossierListView } from "@/components/dossier/dossier-list-view";
import { NewPatientModal } from "@/components/patient/new-patient-modal";

export function DossierWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ordoOpen, setOrdoOpen] = useState(false);
  const [tab, setTab] = useState<DossierTabId>("anamnese");
  const [listQuery, setListQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [newPatientModal, setNewPatientModal] = useState(false);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const histMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_HISTORY_MAP;
    return s.historyByUser[id] ?? EMPTY_HISTORY_MAP;
  });
  const currentPatientId = useHawaeStore((s) => s.currentPatientId);
  const draft = useHawaeStore((s) => s.draft);
  const sidebarSpecFilter = useHawaeStore((s) => s.sidebarSpecFilter);

  const openPatient = useHawaeStore((s) => s.openPatient);
  const closePatient = useHawaeStore((s) => s.closePatient);
  const createNewPatient = useHawaeStore((s) => s.createNewPatient);
  const patchDraft = useHawaeStore((s) => s.patchDraft);
  const saveDraft = useHawaeStore((s) => s.saveDraft);
  const startNewConsultation = useHawaeStore((s) => s.startNewConsultation);
  const loadConsultation = useHawaeStore((s) => s.loadConsultation);
  const deleteConsultation = useHawaeStore((s) => s.deleteConsultation);
  const setSidebarSpecFilter = useHawaeStore((s) => s.setSidebarSpecFilter);

  const handledQueryRef = useRef<string | null>(null);

  const startNewPatient = useCallback(() => {
    createNewPatient();
    setTab("anamnese");
  }, [createNewPatient]);

  useEffect(() => {
    const wantNew = searchParams.get("new") === "1";
    const patientId = searchParams.get("patient");
    const queryToken = searchParams.toString();

    if (!wantNew && !patientId) {
      handledQueryRef.current = null;
      return;
    }

    if (handledQueryRef.current === queryToken) return;
    handledQueryRef.current = queryToken;

    if (wantNew) {
      startNewPatient();
      router.replace("/dossier", { scroll: false });
      return;
    }
    if (patientId && patientsMap[patientId]) {
      openPatient(patientId);
      router.replace("/dossier", { scroll: false });
    }
  }, [searchParams, patientsMap, openPatient, startNewPatient, router]);

  useEffect(() => {
    if (tab === "pma" && draft?.specialite !== "inf") {
      setTab("anamnese");
    }
  }, [draft?.specialite, tab]);

  useEffect(() => {
    if (!draft?.id || !currentPatientId) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      saveDraft();
      setSaveStatus("saved");
    }, 800);
    return () => clearTimeout(t);
  }, [draft, currentPatientId, saveDraft]);

  const patientEntries = useMemo(() => Object.values(patientsMap), [patientsMap]);

  const filteredList = useMemo(() => {
    const q = listQuery.toLowerCase().trim();
    return patientEntries.filter((p) => {
      if (sidebarSpecFilter !== "all" && p.specialite !== sidebarSpecFilter) {
        return false;
      }
      if (!q) return true;
      const blob = [p.nom, p.prenom, p.cin, p.motif, p.symptomes, p.tel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [patientEntries, listQuery, sidebarSpecFilter]);

  const history: ConsultationEntry[] = useMemo(() => {
    if (!currentPatientId) return EMPTY_CONSULT_LIST;
    return histMap[currentPatientId] ?? EMPTY_CONSULT_LIST;
  }, [histMap, currentPatientId]);

  const onField = useCallback(
    (patch: Record<string, string | undefined>) => {
      patchDraft(patch);
    },
    [patchDraft],
  );

  const detailOpen = Boolean(currentPatientId && draft);

  return (
    <>
      {!detailOpen ? (
        <DossierListView
          patients={filteredList}
          count={filteredList.length}
          listQuery={listQuery}
          onListQuery={setListQuery}
          specFilter={sidebarSpecFilter}
          onSpecFilter={setSidebarSpecFilter}
          onOpen={openPatient}
          onNew={() => setNewPatientModal(true)}
          hasAny={patientEntries.length > 0}
        />
      ) : draft && currentPatientId ? (
        <DossierFormView
          draft={draft}
          tab={tab}
          onTab={setTab}
          onField={onField}
          patchDraft={patchDraft}
          onClose={() => {
            closePatient();
            setTab("anamnese");
          }}
          onNewConsultation={() => startNewConsultation()}
          history={history}
          onLoadConsultation={loadConsultation}
          onDeleteConsultation={deleteConsultation}
          saveStatus={saveStatus}
        />
      ) : null}

      <NewPatientModal
        open={newPatientModal}
        onClose={() => setNewPatientModal(false)}
      />

      <OrdonnanceModal
        open={ordoOpen}
        onClose={() => setOrdoOpen(false)}
        patient={draft}
        onPersistToDossier={(p) => {
          patchDraft({
            ordonnanceLines: p.lines,
            ordonnanceNote: p.note,
            ordonnanceValidite: p.validite,
          });
        }}
      />
    </>
  );
}
