import { create } from "zustand";

/** État réel de l'envoi des dossiers au serveur (et non de la copie locale). */
export type SyncState = "idle" | "pending" | "saved" | "error";

export const useSyncStatus = create<{ state: SyncState }>(() => ({ state: "idle" }));

export function markSync(state: SyncState) {
  if (useSyncStatus.getState().state !== state) useSyncStatus.setState({ state });
}
