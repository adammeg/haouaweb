"use client";

import { useEffect, useRef } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore } from "@/stores/modules-store";
import { useRdvStore } from "@/stores/rdv-store";
import { useRappelsStore } from "@/stores/rappels-store";
import type { DoctorClinicalBundle } from "@/types/clinical-bundle";
import { markAssistantData } from "@/stores/assistant-data-status";

const DEBOUNCE_MS = 2500;

function snapshotBundle(): string {
  const modules = useModulesStore.getState().workspaceByUser;
  const rdv = useRdvStore.getState();
  const rap = useRappelsStore.getState();
  const body: DoctorClinicalBundle = {
    modulesByUser: modules,
    agenda: { rdvList: rdv.list, weekOffset: rdv.weekOffset },
    rappels: {
      list: rap.list,
      contacts: rap.contacts,
      readNotifs: rap.readNotifs,
    },
  };
  return JSON.stringify(body);
}

/**
 * Synchronise modules, agenda et rappels vers MongoDB (`doctor_clinical_bundles`).
 */
export function ClinicalDataSync({ doctorId: requestedDoctorId }: { doctorId?: string } = {}) {
  const initialDone = useRef(false);
  const applyingRemote = useRef(false);
  const lastPushed = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const doctorId = requestedDoctorId ?? window.__HAWAE_DOCTOR_ID__;
    initialDone.current = false; applyingRemote.current = false; lastPushed.current = "";
    markAssistantData(doctorId, "clinical", "loading");
    let pushInFlight = false;
    let pushRequested = false;

    async function push() {
      if (cancelled || applyingRemote.current) return;
      if (pushInFlight) { pushRequested = true; return; }
      pushInFlight = true;
      const bundle: DoctorClinicalBundle = JSON.parse(snapshotBundle());
      const pushedSnapshot = JSON.stringify(bundle);
      let pushed = false;
      try {
        const res = await fetch("/api/clinical/bundle", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bundle }),
        });
        if (!res.ok || cancelled) return;
        lastPushed.current = pushedSnapshot;
        markAssistantData(doctorId, "clinical", "ready");
        pushed = true;
      } catch {
        /* hors-ligne */
      } finally {
        pushInFlight = false;
        if (!cancelled && (pushRequested || (pushed && snapshotBundle() !== pushedSnapshot))) {
          pushRequested = false; schedulePush();
        }
      }
    }

    async function pull() {
      let verified = false;
      try {
        const res = await fetch("/api/clinical/bundle", {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) {
          initialDone.current = true;
          return;
        }
        const data = (await res.json()) as {
          empty?: boolean;
          bundle?: DoctorClinicalBundle;
        };
        if (cancelled || window.__HAWAE_DOCTOR_ID__ !== doctorId) return;
        if (data.empty !== false || !data.bundle) {
          if (data.empty === true) verified = true;
          await push();
          initialDone.current = true;
          lastPushed.current = snapshotBundle();
          return;
        }
        applyingRemote.current = true;
        verified = true;
        if (data.bundle.modulesByUser) {
          useModulesStore.setState({
            workspaceByUser: data.bundle.modulesByUser,
          });
        }
        if (data.bundle.agenda) {
          useRdvStore.setState({
            list: data.bundle.agenda.rdvList,
            weekOffset: data.bundle.agenda.weekOffset ?? 0,
          });
        }
        if (data.bundle.rappels) {
          useRappelsStore.setState({
            list: data.bundle.rappels.list,
            contacts: data.bundle.rappels.contacts,
            readNotifs: data.bundle.rappels.readNotifs,
          });
        }
        applyingRemote.current = false;
        lastPushed.current = snapshotBundle();
        initialDone.current = true;
      } catch {
        initialDone.current = true;
      } finally {
        if (!cancelled) markAssistantData(doctorId, "clinical", verified ? "ready" : "error");
      }
    }

    void Promise.all([
      useModulesStore.persist.rehydrate(),
      useRdvStore.persist.rehydrate(),
      useRappelsStore.persist.rehydrate(),
    ]).then(() => {
      if (!cancelled) void pull();
    });

    const schedulePush = () => {
      if (!initialDone.current || applyingRemote.current) return;
      const snap = snapshotBundle();
      if (snap === lastPushed.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void push();
      }, DEBOUNCE_MS);
    };

    const u1 = useModulesStore.subscribe(schedulePush);
    const u2 = useRdvStore.subscribe(schedulePush);
    const u3 = useRappelsStore.subscribe(schedulePush);
    const u4 = useHawaeStore.subscribe((s) => {
      if (s.currentUserId) schedulePush();
    });

    return () => {
      cancelled = true;
      u1();
      u2();
      u3();
      u4();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [requestedDoctorId]);

  return null;
}
