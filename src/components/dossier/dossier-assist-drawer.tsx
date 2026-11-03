"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { AssistPanel } from "@/components/assist/assist-panel";
import {
  profileFromSnapshot,
  runAssist,
} from "@/lib/assist";

export function DossierAssistDrawer({
  open,
  onClose,
  draft,
  patchDraft,
}: {
  open: boolean;
  onClose: () => void;
  draft: PatientSnapshot;
  patchDraft: (p: Partial<PatientSnapshot>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const result = useMemo(() => open ? runAssist(profileFromSnapshot(draft)) : null, [open, draft]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const run = () => {
    setLoading(true);
      const profile = profileFromSnapshot(draft);
      const r = runAssist(profile);
      patchDraft({
        hawaeAssistResultJson: JSON.stringify(r),
        hawaeAssistAt: new Date().toISOString(),
      });
      setLoading(false);
  };

  return (
    <>
      <div
        id="assist-drawer-backdrop"
        className={open ? "visible" : ""}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        id="assist-drawer"
        role="dialog"
        aria-label="Hawae — assistante clinique"
        className={open ? "open" : ""}
      >
        <div className="adr-head">
          <div>
            <div className="text-sm font-bold">Hawae</div>
            <div className="text-[11px] opacity-80">Notre assistante clinique</div>
          </div>
          <button
            type="button"
            className="adr-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="adr-body">
          <button
            type="button"
            disabled={loading}
            onClick={run}
            className="mb-4 w-full rounded-xl bg-[var(--teal)] py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {loading ? "Analyse en cours…" : "Relancer l'analyse"}
          </button>
          <AssistPanel result={result} />
        </div>
      </div>
    </>
  );
}
