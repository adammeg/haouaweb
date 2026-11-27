"use client";
import { pushWorkspaceNow } from "@/lib/storage/workspace-sync-client";

import { useEffect, useRef } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { markAssistantData } from "@/stores/assistant-data-status";
import { markSync } from "@/stores/sync-status";
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
export function WorkspaceSync({ doctorId: requestedDoctorId }: { doctorId?: string } = {}) {
  const initialDone = useRef(false);
  const applyingRemote = useRef(false);
  const lastPushed = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const doctorId = requestedDoctorId ?? window.__HAWAE_DOCTOR_ID__;
    initialDone.current = false; applyingRemote.current = false; lastPushed.current = "";
    markAssistantData(doctorId, "patients", "loading");
    markSync("idle");

    async function push() {
      if (cancelled || applyingRemote.current) return;
      try {
        const result = await pushWorkspaceNow();
        if (!cancelled) {
          lastPushed.current = result.snapshot;
          markAssistantData(doctorId, "patients", "ready");
          markSync(snapshotForSync(useHawaeStore.getState()) === result.snapshot ? "saved" : "pending");
        }
      } catch {
        if (!cancelled) markSync("error");
        /* Explicit AI saves surface errors; background synchronization retries on subsequent changes. */
      }
    }

    async function pull() {
      let verified = false;
      try {
        const res = await fetch("/api/workspace/state", {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) {
          initialDone.current = true;
          return;
        }
        const raw = (await res.json()) as Record<string, unknown>;
        if (cancelled || window.__HAWAE_DOCTOR_ID__ !== doctorId) return;
        if (typeof raw.error === "string" && raw.error) {
          initialDone.current = true;
          return;
        }
        const data = raw as PullResponse;
        if (data.empty === true) {
          verified = true;
          await push();
          initialDone.current = true;
          return;
        }
        if (data.empty !== false || !data.workspace) {
          initialDone.current = true;
          return;
        }
        const remote = data;
        verified = true;
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
          useHawaeStore.getState().ensureDefaultUser(); markSync("saved");
          applyingRemote.current = false;
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
        } else {
          lastPushed.current = snapshotForSync(useHawaeStore.getState());
        }
        initialDone.current = true;
      } catch {
        initialDone.current = true;
      } finally {
        if (!cancelled) {
          markAssistantData(doctorId, "patients", verified ? "ready" : "error");
          if (!verified) markSync("error");
        }
      }
    }

    void pull();

    const unsub = useHawaeStore.subscribe((state) => {
      if (!initialDone.current || applyingRemote.current) return;
      const snap = snapshotForSync(state);
      if (snap === lastPushed.current) return;
      markSync("pending");
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
  }, [requestedDoctorId]);

  return null;
}
