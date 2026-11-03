"use client";
import { useHawaeStore } from "@/stores/hawae-store";

export function workspaceSnapshot(s: ReturnType<typeof useHawaeStore.getState>) {
  return JSON.stringify({ users: s.users, currentUserId: s.currentUserId, patientsByUser: s.patientsByUser, historyByUser: s.historyByUser, setupDone: s.setupDone });
}

// All background and explicit saves use this queue: an older in-flight save cannot overtake an AI save.
let pending: Promise<unknown> = Promise.resolve();
export function pushWorkspaceNow(): Promise<{ snapshot: string; updatedAt: string }> {
  const task = pending.catch(() => {}).then(async () => {
    const s = useHawaeStore.getState();
    const snapshot = workspaceSnapshot(s);
    const res = await fetch("/api/workspace/state", {
      method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...JSON.parse(snapshot), workspaceSavedAt: s.workspaceSavedAt }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error("Sauvegarde serveur impossible. Réessayez avant l'analyse IA.");
    const data = await res.json() as { updatedAt?: string };
    if (!data.updatedAt) throw new Error("Sauvegarde serveur non confirmée");
    useHawaeStore.setState({ workspaceSavedAt: data.updatedAt });
    return { snapshot, updatedAt: data.updatedAt };
  });
  pending = task;
  return task;
}
