"use client";

import { useEffect, useRef } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import type {
  ConsultationEntry,
  PatientSnapshot,
  UserProfile,
} from "@/types/domain";

const DEBOUNCE_MS = 2000;

type WorkspacePayload = {
  users: UserProfile[];
  currentUserId: string | null;
  patientsByUser: Record<string, Record<string, PatientSnapshot>>;
  historyByUser: Record<string, Record<string, ConsultationEntry[]>>;
  setupDone: boolean;
  workspaceSavedAt: string | null;
};

type PullResponse =
  | { empty: true }
  | { empty: false; updatedAt: string; workspace: WorkspacePayload };

function snapshotForSync(s: ReturnType<typeof useHawaeStore.getState>) {
  return JSON.stringify({
    users: s.users,
    currentUserId: s.currentUserId,
    patientsByUser: s.patientsByUser,
    historyByUser: s.historyByUser,
    setupDone: s.setupDone,
  });
}

/**
 * Synchronise le store clinique avec MongoDB (collection `workspaces`).
 * localStorage reste le cache instantané ; le serveur fait foi si plus récent.
 */
export function WorkspaceSync() {
  const initialDone = useRef(false);
  const applyingRemote = useRef(false);
  const lastPushed = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function push() {
      if (cancelled || applyingRemote.current) return;
      const s = useHawaeStore.getState();
      const body: WorkspacePayload = {
        users: s.users,
        currentUserId: s.currentUserId,
        patientsByUser: s.patientsByUser,
        historyByUser: s.historyByUser,
        setupDone: s.setupDone,
        workspaceSavedAt: s.workspaceSavedAt,
      };
      try {
        const res = await fetch("/api/workspace/state", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { updatedAt?: string };
        if (j.updatedAt) {
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
          useHawaeStore.setState({ workspaceSavedAt: j.updatedAt });
        }
      } catch {
        /* hors-ligne ou serveur indisponible */
      }
    }

    async function pull() {
      try {
        const res = await fetch("/api/workspace/state", {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) {
          initialDone.current = true;
          return;
        }
        const raw = (await res.json()) as Record<string, unknown>;
        if (typeof raw.error === "string" && raw.error) {
          initialDone.current = true;
          return;
        }
        const data = raw as PullResponse;
        if (data.empty === true) {
          await push();
          initialDone.current = true;
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
          return;
        }
        if (data.empty !== false || !data.workspace) {
          initialDone.current = true;
          return;
        }
        const remote = data;
        const localSaved = useHawaeStore.getState().workspaceSavedAt;
        if (localSaved == null || remote.updatedAt > localSaved) {
          applyingRemote.current = true;
          useHawaeStore.setState({
            users: remote.workspace.users,
            currentUserId: remote.workspace.currentUserId,
            patientsByUser: remote.workspace.patientsByUser,
            historyByUser: remote.workspace.historyByUser,
            setupDone: remote.workspace.setupDone,
            workspaceSavedAt: remote.updatedAt,
          });
          useHawaeStore.getState().ensureDefaultUser();
          applyingRemote.current = false;
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
        } else {
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
        }
        initialDone.current = true;
      } catch {
        initialDone.current = true;
      }
    }

    void pull();

    const unsub = useHawaeStore.subscribe((state) => {
      if (!initialDone.current || applyingRemote.current) return;
      const snap = snapshotForSync(state);
      if (snap === lastPushed.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void push();
      }, DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return null;
}
