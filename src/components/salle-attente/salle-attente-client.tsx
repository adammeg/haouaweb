"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { SPECIALTY_LABELS, type Specialty } from "@/types/domain";
import type { WaitingStatus } from "@/types/modules";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  getPatientDisplayName,
  patientAgeYears,
} from "@/lib/patient-utils";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_LABELS: Record<WaitingStatus, string> = {
  waiting: "En attente",
  in_consult: "En consultation",
  done: "Terminée",
  cancelled: "Annulée",
};

const STATUS_CLS: Record<WaitingStatus, string> = {
  waiting: "bg-amber-100 text-amber-900",
  in_consult: "bg-sky-100 text-sky-900",
  done: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-gray-100 text-gray-600",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SalleAttenteClient() {
  const [q, setQ] = useState("");
  const today = todayIso();
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const ws = useModulesWorkspace();
  const addWaiting = useModulesStore((s) => s.addWaiting);
  const updateWaitingStatus = useModulesStore((s) => s.updateWaitingStatus);
  const removeWaiting = useModulesStore((s) => s.removeWaiting);

  const queueToday = useMemo(
    () =>
      ws.waitingQueue
        .filter((e) => e.date === today)
        .sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime)),
    [ws.waitingQueue, today],
  );

  const list = useMemo(() => {
    const rows = Object.values(patientsMap);
    const t = q.toLowerCase().trim();
    if (!t) return rows;
    return rows.filter((p) => {
      const blob = [getPatientDisplayName(p), p.motif, p.tel, p.cin]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(t);
    });
  }, [patientsMap, q]);

  const inQueueIds = new Set(queueToday.map((e) => e.patientId));

  function addToQueue(patientId: string) {
    if (inQueueIds.has(patientId)) return;
    const p = patientsMap[patientId];
    addWaiting({
      patientId,
      date: today,
      arrivalTime: new Date().toTimeString().slice(0, 5),
      status: "waiting",
      motif: p?.motif,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Salle d'attente"
        description={`File du jour (${new Date().toLocaleDateString("fr-FR")}) avec statuts en temps réel.`}
        badge="Aujourd'hui"
      />

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-[var(--ink)]">
          File du jour ({queueToday.length})
        </h2>
        {queueToday.length === 0 ? (
          <EmptyState
            title="File vide"
            description="Ajoutez une patiente depuis la liste ci-dessous."
          />
        ) : (
          <ul className="space-y-2">
            {queueToday.map((entry) => {
              const p = patientsMap[entry.patientId];
              const name = p ? getPatientDisplayName(p) : entry.patientId;
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--ink)]">{name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Arrivée {entry.arrivalTime}
                      {entry.motif ? " · " + entry.motif : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
                        STATUS_CLS[entry.status]
                      }
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {entry.status === "waiting" && (
                      <button
                        type="button"
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() =>
                          updateWaitingStatus(entry.id, "in_consult")
                        }
                      >
                        Appeler
                      </button>
                    )}
                    {entry.status === "in_consult" && (
                      <>
                        <Link
                          href={`/dossier?patient=${encodeURIComponent(entry.patientId)}`}
                          className="rounded-lg bg-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Dossier
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                          onClick={() => updateWaitingStatus(entry.id, "done")}
                        >
                          Terminer
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1.5 text-xs text-[var(--muted)] hover:text-red-600"
                      onClick={() => removeWaiting(entry.id)}
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-bold text-[var(--ink)]">
            Ajouter à la file
          </h2>
          <input
            type="search"
            placeholder="Rechercher une patiente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="hawae-input w-full max-w-md"
          />
        </div>
        <ul className="space-y-2">
          {list.slice(0, 30).map((p) => {
            const age = patientAgeYears(p.ddn);
            const queued = inQueueIds.has(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate font-medium">
                  {getPatientDisplayName(p)}
                  {p.specialite ? (
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      {SPECIALTY_LABELS[p.specialite as Specialty]}
                    </span>
                  ) : null}
                  {age != null ? (
                    <span className="text-xs text-[var(--muted)]"> · {age} ans</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={queued}
                  onClick={() => addToQueue(p.id)}
                  className="shrink-0 rounded-lg bg-[var(--teal)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {queued ? "Déjà en file" : "Ajouter"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Link
        href="/dossier?new=1"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Nouvelle patiente
      </Link>
    </div>
  );
}
