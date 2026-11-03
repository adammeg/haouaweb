"use client";
import { useHawaeStore } from "@/stores/hawae-store";
import { pushWorkspaceNow } from "@/lib/storage/workspace-sync-client";
import { clinicalRevision, stableClinicalDataKey } from "./clinical-revision";

export function isCurrentAiRequest(patientId: string, key: string): boolean {
  const draft = useHawaeStore.getState().draft;
  return draft?.id === patientId && stableClinicalDataKey(draft) === key;
}

export async function preparePatientAiRequest(patientId: string, signal: AbortSignal) {
  const state = useHawaeStore.getState();
  const draft = state.draft;
  if (!draft || draft.id !== patientId) throw new Error("Le dossier actif a changé");
  const key = stableClinicalDataKey(draft);
  const expectedRevision = await clinicalRevision(draft);
  signal.throwIfAborted();
  state.saveDraft();
  await pushWorkspaceNow();
  signal.throwIfAborted();
  if (!isCurrentAiRequest(patientId, key)) throw new Error("Le dossier a changé pendant la sauvegarde. Relancez l'analyse.");
  return { patientId, expectedRevision, key };
}
