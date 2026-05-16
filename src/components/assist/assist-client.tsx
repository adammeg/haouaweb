"use client";

import { useCallback, useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import {
  profileFromSnapshot,
  runAssist,
  type AssistRunResult,
} from "@/lib/assist";
import { AssistPanel } from "./assist-panel";
import { getPatientDisplayName } from "@/lib/patient-utils";

export function AssistClient() {
  const currentPatientId = useHawaeStore((s) => s.currentPatientId);
  const draft = useHawaeStore((s) => s.draft);
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return {};
    return s.patientsByUser[id] ?? {};
  });
  const openPatient = useHawaeStore((s) => s.openPatient);
  const patchDraft = useHawaeStore((s) => s.patchDraft);

  const [loading, setLoading] = useState(false);
  const [localResult, setLocalResult] = useState<AssistRunResult | null>(null);

  const patient = draft ?? (currentPatientId ? patientsMap[currentPatientId] : null);

  const cachedResult = useMemo(() => {
    if (!patient?.hawaeAssistResultJson) return null;
    try {
      return JSON.parse(patient.hawaeAssistResultJson) as AssistRunResult;
    } catch {
      return null;
    }
  }, [patient?.hawaeAssistResultJson]);

  const result = localResult ?? cachedResult;

  const run = useCallback(() => {
    if (!patient) return;
    setLoading(true);
    setTimeout(() => {
      try {
        const profile = profileFromSnapshot(patient);
        const r = runAssist(profile);
        setLocalResult(r);
        patchDraft({
          hawaeAssistResultJson: JSON.stringify(r),
          hawaeAssistAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }, 80);
  }, [patient, patchDraft]);

  const patientList = Object.values(patientsMap);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
            Hawae Assist
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Moteur clinique · 16 scores validés · FMF · FGR · ROMA · POSEIDON · VTE
          </p>
        </div>
        <button
          type="button"
          disabled={!patient || loading}
          onClick={run}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#083F3F] to-[#0D7272] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Analyse en cours…" : "Analyser le dossier actif"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Dossier actif
          </p>
          {patient ? (
            <div>
              <p className="font-semibold text-[var(--ink)]">
                {getPatientDisplayName(patient)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {patient.specialite?.toUpperCase() || "—"}
                {patient.hawaeAssistAt
                  ? ` · Analyse ${new Date(patient.hawaeAssistAt).toLocaleString("fr-FR")}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Ouvrez un dossier depuis la liste ci-dessous ou le module Dossier.
            </p>
          )}
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Autres dossiers
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {patientList.slice(0, 20).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => openPatient(p.id)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs ${
                    p.id === currentPatientId
                      ? "bg-[var(--teal-pale)] font-semibold text-[var(--teal)]"
                      : "hover:bg-[var(--cream)]"
                  }`}
                >
                  {getPatientDisplayName(p)}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0">
          <AssistPanel
            result={result}
            emptyMessage={
              patient
                ? "Aucune analyse enregistrée — cliquez sur Analyser."
                : "Sélectionnez une patiente pour lancer Hawae Assist."
            }
          />
        </div>
      </div>
    </div>
  );
}
