"use client";

import { useEffect, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { AssistPanel } from "@/components/assist/assist-panel";
import {
  profileFromSnapshot,
  runAssist,
  type AssistRunResult,
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
  const [result, setResult] = useState<AssistRunResult | null>(() => {
    if (!draft.hawaeAssistResultJson) return null;
    try {
      return JSON.parse(draft.hawaeAssistResultJson) as AssistRunResult;
    } catch {
      return null;
    }
  });

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
    setTimeout(() => {
      const profile = profileFromSnapshot(draft);
      const r = runAssist(profile);
      setResult(r);
      patchDraft({
        hawaeAssistResultJson: JSON.stringify(r),
        hawaeAssistAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 80);
  };

  useEffect(() => {
    if (open && !result && !loading) {
      const t = setTimeout(run, 120);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
        aria-label="Hawae Assist"
        className={open ? "open" : ""}
      >
        <div className="adr-head">
          <div>
            <div className="text-sm font-bold">Hawae Assist</div>
            <div className="text-[11px] opacity-80">Analyse clinique contextuelle</div>
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
