"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { SPECIALTY_LABELS, type Specialty } from "@/types/domain";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  getPatientDisplayName,
  patientAgeYears,
} from "@/lib/patient-utils";

export default function DashboardPage() {
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const stats = useMemo(() => {
    const list = Object.values(patientsMap);
    const bySpec: Record<string, number> = {};
    for (const p of list) {
      const k = p.specialite || "—";
      bySpec[k] = (bySpec[k] ?? 0) + 1;
    }
    const recent = [...list]
      .filter((p) => p.lastSaved)
      .sort(
        (a, b) =>
          new Date(b.lastSaved!).getTime() - new Date(a.lastSaved!).getTime(),
      )
      .slice(0, 8);
    return { total: list.length, bySpec, recent };
  }, [patientsMap]);

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Vue d&apos;ensemble pour le profil cabinet sélectionné — chiffres et
          raccourcis vers les espaces les plus utilisés.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dossier"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-0"
          >
            Mes dossiers
          </Link>
          <Link
            href="/salle-attente"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40 sm:min-h-0"
          >
            Salle d&apos;attente
          </Link>
          <Link
            href="/agenda"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/40 sm:min-h-0"
          >
            Agenda
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] sm:col-span-1">
          <div className="text-3xl font-bold text-[var(--teal)]">
            {stats.total}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Dossiers enregistrés
          </div>
        </div>
        {(Object.keys(stats.bySpec) as string[]).map((k) => (
          <div
            key={k}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]"
          >
            <div className="text-2xl font-bold text-[var(--ink)]">
              {stats.bySpec[k]}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {k === "—" ? "Sans spécialité" : SPECIALTY_LABELS[k as Specialty] ?? k}
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-[var(--ink)]">
          Dossiers récents
        </h2>
        <ul className="space-y-2">
          {stats.recent.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[var(--border)] bg-white/90 px-4 py-10 text-center text-sm text-[var(--muted)]">
              Aucune activité récente. Ouvrez{" "}
              <Link
                href="/dossier"
                className="font-semibold text-[var(--teal)] underline underline-offset-2"
              >
                Mes dossiers
              </Link>{" "}
              pour créer ou modifier une fiche.
            </li>
          ) : (
            stats.recent.map((p) => {
              const age = patientAgeYears(p.ddn);
              return (
                <li key={p.id}>
                  <Link
                    href={`/dossier?patient=${encodeURIComponent(p.id)}`}
                    className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--teal)]/40 hover:bg-[var(--teal-pale)]/25"
                  >
                    <span className="min-w-0 truncate font-medium text-[var(--ink)]">
                      {getPatientDisplayName(p)}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {p.lastSaved
                        ? new Date(p.lastSaved).toLocaleDateString("fr-FR")
                        : "—"}
                      {age != null ? ` · ${age} ans` : ""}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
