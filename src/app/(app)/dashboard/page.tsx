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
import { EpidemiologyPanel } from "@/components/dashboard/epidemiology-panel";
import { PageHeader, QuickLink } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

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
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble pour le profil cabinet sélectionné — chiffres et raccourcis vers les espaces les plus utilisés."
        actions={
          <>
            <QuickLink href="/dossier" primary>
              Mes dossiers
            </QuickLink>
            <QuickLink href="/salle-attente">Salle d&apos;attente</QuickLink>
            <QuickLink href="/agenda">Agenda</QuickLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard value={stats.total} label="Dossiers enregistrés" />
        {(Object.keys(stats.bySpec) as string[]).map((k) => (
          <StatCard
            key={k}
            value={stats.bySpec[k]}
            label={k === "—" ? "Sans spécialité" : SPECIALTY_LABELS[k as Specialty] ?? k}
            accent="ink"
          />
        ))}
      </div>

      <section className="hawae-panel p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-[var(--ink)]">
          Dossiers récents
        </h2>
        {stats.recent.length === 0 ? (
          <EmptyState
            title="Aucune activité récente"
            description="Créez ou modifiez une fiche patiente pour la voir ici."
            action={
              <QuickLink href="/dossier" primary>
                Ouvrir les dossiers
              </QuickLink>
            }
          />
        ) : (
          <ul className="space-y-2">
            {stats.recent.map((p) => {
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
            })}
          </ul>
        )}
      </section>

      <EpidemiologyPanel />
    </div>
  );
}
