"use client";

import { useMemo } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  computeEpidemiology,
  specialtyLabel,
} from "@/lib/stats/epidemiology";

export function EpidemiologyPanel() {
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const stats = useMemo(
    () => computeEpidemiology(Object.values(patientsMap)),
    [patientsMap],
  );

  const maxAge = Math.max(1, ...stats.ageBands.map((b) => b.count));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-[var(--ink)]">
          Épidémiologie cabinet
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Dossiers" value={stats.total} />
          <StatCard label="ATCD PE" value={stats.obstRisks.peHistory} />
          <StatCard label="ATCD VTE" value={stats.obstRisks.vteHistory} />
          <StatCard label="Anomalies T2" value={stats.obstRisks.t2Anomalies} />
          <StatCard label="GDM suspecte" value={stats.obstRisks.gdmSuspect} />
          <StatCard label="Tentatives FIV" value={stats.infertility.fivAttempts} />
          <StatCard label="AMH basse" value={stats.infertility.lowAmh} />
          <StatCard label="SOPK" value={stats.infertility.sopk} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
            Pyramide des âges
          </h3>
          <ul className="space-y-3">
            {stats.ageBands.map((b) => (
              <li key={b.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{b.label}</span>
                  <span className="font-semibold">{b.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--cream)]">
                  <div
                    className="h-full rounded-full bg-[var(--teal)]"
                    style={{ width: (b.count / maxAge) * 100 + "%" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
            Activité mensuelle
          </h3>
          {stats.monthlyActivity.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Pas encore de données.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.monthlyActivity.map((m) => (
                <li key={m.month} className="flex justify-between">
                  <span>{m.month}</span>
                  <span className="font-semibold">{m.count} dossiers</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
          Répartition spécialités
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.bySpecialty).map(([k, n]) => (
            <span
              key={k}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold"
            >
              {specialtyLabel(k)} : {n}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-[var(--teal)]">{value}</div>
      <p className="mt-1 text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}
