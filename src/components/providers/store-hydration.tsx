"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { ClinicalDataSync } from "@/components/providers/clinical-data-sync";
import { WorkspaceSync } from "@/components/providers/workspace-sync";

/**
 * Must run only under an authenticated (app) layout with a stable doctor id.
 * Rehydrates from doctor-scoped localStorage when the account changes.
 */
export function StoreHydration({
  doctorId,
  children,
}: {
  doctorId: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.__HAWAE_DOCTOR_ID__ = doctorId;

    const finish = () => {
      useHawaeStore.getState().ensureDefaultUser();
      setReady(true);
    };

    void Promise.resolve(useHawaeStore.persist.rehydrate()).then(() => {
      // Ephemeral UI state is not persisted; avoid leaking another compte’s open dossier.
      useHawaeStore.setState({ currentPatientId: null, draft: null });
      finish();
    });
  }, [doctorId]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--cream)] font-sans text-[var(--teal)]">
        <p className="text-sm font-medium">Chargement dossiers…</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <WorkspaceSync />
      <ClinicalDataSync />
    </>
  );
}
