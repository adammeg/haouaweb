"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { AnalyticsSearchPanel } from "@/components/dashboard/analytics-search-panel";
import {
  isoDate,
  RDV_LABELS,
  RDV_TYPE_ICONS,
  useRdvStore,
} from "@/stores/rdv-store";
import { useRappelsStore } from "@/stores/rappels-store";
import { useModulesWorkspace } from "@/stores/modules-store";
import { todayIso } from "@/lib/waiting-room/utils";
import { EMPTY_HISTORY_MAP, EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  computeDashboardStats,
  mergeActivitySeries,
  specialtyChartData,
  type PeriodMonths,
} from "@/lib/stats/dashboard";
import { SPECIALTY_LABELS, type Specialty } from "@/types/domain";
import {
  getPatientDisplayName,
  patientAgeYears,
  computeCompleteness,
} from "@/lib/patient-utils";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickLink } from "@/components/ui/page-header";
import "@/styles/dashboard.css";

const DashboardChartsPanel = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts-panel").then(
      (m) => m.DashboardChartsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="dash-layout-charts" aria-busy="true" aria-label="Chargement des graphiques">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`dash-chart-card ${i === 0 || i === 3 ? "dash-span-2" : ""}`}>
            <div className="mb-3 h-4 w-40 animate-pulse rounded bg-[var(--cream)]" />
            <div className="h-[220px] animate-pulse rounded-xl bg-[var(--cream)]" />
          </div>
        ))}
      </div>
    ),
  },
);

const PERIODS: { value: PeriodMonths; label: string }[] = [
  { value: 3, label: "3 mois" },
  { value: 6, label: "6 mois" },
  { value: 12, label: "12 mois" },
  { value: 0, label: "Tout" },
];

const SPECS: { value: Specialty | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "gyn", label: SPECIALTY_LABELS.gyn },
  { value: "obst", label: SPECIALTY_LABELS.obst },
  { value: "inf", label: SPECIALTY_LABELS.inf },
];

export function ClinicalDashboard() {
  const [period, setPeriod] = useState<PeriodMonths>(6);
  const [specFilter, setSpecFilter] = useState<Specialty | "all">("all");
  const [pieFilter, setPieFilter] = useState<string | null>(null);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const historyMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_HISTORY_MAP;
    return s.historyByUser[id] ?? EMPTY_HISTORY_MAP;
  });

  const rdvList = useRdvStore((s) => s.list);
  const rappelsList = useRappelsStore((s) => s.list);
  const ws = useModulesWorkspace();

  const todayStr = isoDate(new Date());

  const todayRdv = useMemo(
    () =>
      rdvList
        .filter((r) => r.date === todayStr && r.statut !== "annule")
        .sort((a, b) => a.heure.localeCompare(b.heure)),
    [rdvList, todayStr],
  );

  const waitingCount = useMemo(() => {
    const t = todayIso();
    return ws.waitingQueue.filter(
      (e) =>
        e.date === t && (e.status === "waiting" || e.status === "in_consult"),
    ).length;
  }, [ws.waitingQueue]);

  const urgenceCount = useMemo(
    () => todayRdv.filter((r) => r.type === "urgence").length,
    [todayRdv],
  );

  const effectiveSpec: Specialty | "all" =
    pieFilter && pieFilter !== "—"
      ? (pieFilter as Specialty)
      : specFilter;

  const stats = useMemo(() => {
    const rappelsPending =
      rappelsList.filter((r) => !r.done).length +
      rdvList.filter((r) => r.statut === "a_rappeler").length;

    return computeDashboardStats({
      patients: Object.values(patientsMap),
      historyByPatient: historyMap,
      rdvList,
      rappelsPending,
      specialty: effectiveSpec,
      periodMonths: period,
    });
  }, [patientsMap, historyMap, rdvList, rappelsList, effectiveSpec, period]);

  const activityData = useMemo(() => mergeActivitySeries(stats), [stats]);
  const pieData = useMemo(() => specialtyChartData(stats), [stats]);

  const risksData = useMemo(
    () => [
      { label: "ATCD PE", value: stats.obstRisks.peHistory },
      { label: "ATCD VTE", value: stats.obstRisks.vteHistory },
      { label: "GDM suspecte", value: stats.obstRisks.gdmSuspect },
      { label: "Anomalies T2", value: stats.obstRisks.t2Anomalies },
      { label: "Tent. FIV", value: stats.infertility.fivAttempts },
      { label: "AMH basse", value: stats.infertility.lowAmh },
      { label: "SOPK", value: stats.infertility.sopk },
    ],
    [stats],
  );

  const recent = useMemo(() => {
    return [...Object.values(patientsMap)]
      .filter((p) => {
        if (effectiveSpec !== "all" && p.specialite !== effectiveSpec) return false;
        return Boolean(p.lastSaved);
      })
      .sort(
        (a, b) =>
          new Date(b.lastSaved!).getTime() - new Date(a.lastSaved!).getTime(),
      )
      .slice(0, 8);
  }, [patientsMap, effectiveSpec]);

  function onPieSelect(key: string | null) {
    setPieFilter(key);
    if (key && key !== "—") setSpecFilter(key as Specialty);
    else if (!key) setSpecFilter("all");
  }

  return (
    <div className="space-y-8">
      {/* Cabinet overview — vue du jour (port v50 « Dashboard Cabinet ») */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--teal)] to-[var(--teal-deep,#0a5c5c)] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Aujourd&apos;hui
              </p>
              <div className="mt-1 font-display text-4xl font-extrabold leading-none">
                {todayRdv.length}
              </div>
              <p className="mt-1 text-sm text-white/80">
                rendez-vous programmés
              </p>
            </div>
            <Link
              href="/agenda"
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              📅 Agenda
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/salle-attente"
              className="rounded-xl bg-white/12 p-3 backdrop-blur transition-colors hover:bg-white/20"
            >
              <div className="text-2xl font-bold leading-none">
                {waitingCount}
              </div>
              <div className="mt-1 text-[11px] text-white/75">
                En salle d&apos;attente
              </div>
            </Link>
            <div className="rounded-xl bg-white/12 p-3 backdrop-blur">
              <div className="text-2xl font-bold leading-none">
                {urgenceCount}
              </div>
              <div className="mt-1 text-[11px] text-white/75">
                Urgences du jour
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] sm:p-6">
          <h2 className="mb-3 font-display text-sm font-bold text-[var(--ink)]">
            ⚡ Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/dossier?new=1" className="dash-quick-action">
              ➕ Nouvelle patiente
            </Link>
            <Link href="/agenda" className="dash-quick-action">
              📅 Nouveau RDV
            </Link>
            <Link href="/assist" className="dash-quick-action">
              🌬️ Analyse Hawae
            </Link>
            <Link href="/dossier" className="dash-quick-action">
              📋 Dossiers
            </Link>
          </div>
        </div>
      </section>

      {/* RDV du jour */}
      <section className="hawae-panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-[var(--ink)]">
            Rendez-vous d&apos;aujourd&apos;hui
          </h2>
          <QuickLink href="/agenda">Ouvrir l&apos;agenda</QuickLink>
        </div>
        {todayRdv.length === 0 ? (
          <EmptyState
            title="Aucun rendez-vous aujourd'hui"
            description="Les rendez-vous programmés pour la journée apparaîtront ici."
          />
        ) : (
          <ul className="space-y-2">
            {todayRdv.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-xs)]"
              >
                <span className="w-12 shrink-0 font-bold text-[var(--teal)]">
                  {r.heure || "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[var(--ink)]">
                    {r.patient || "Patiente inconnue"}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {RDV_TYPE_ICONS[r.type]} {RDV_LABELS[r.type] ?? r.type}
                    {r.duree ? ` · ${r.duree} min` : ""}
                  </span>
                </span>
                {r.tel ? (
                  <a
                    href={`tel:${r.tel}`}
                    className="shrink-0 text-xs text-[var(--teal)] hover:underline"
                  >
                    📞 {r.tel}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="dash-filters">
        <div className="dash-filter-group" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`dash-filter-btn ${period === p.value ? "active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="dash-filter-group" role="group" aria-label="Spécialité">
          {SPECS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`dash-filter-btn ${effectiveSpec === s.value ? "active" : ""}`}
              onClick={() => {
                setSpecFilter(s.value);
                setPieFilter(null);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {(pieFilter || specFilter !== "all") && (
          <button
            type="button"
            className="text-xs font-semibold text-[var(--teal)] underline-offset-2 hover:underline"
            onClick={() => {
              setPieFilter(null);
              setSpecFilter("all");
            }}
          >
            Réinitialiser filtres
          </button>
        )}
      </div>

      <div className="dash-kpi-grid">
        <StatCard value={stats.filteredTotal} label="Dossiers">
          <p className="dash-kpi-trend">
            <strong>{stats.updatedLast7Days}</strong> modifiés · 7 j
          </p>
        </StatCard>
        <StatCard value={stats.consultationsTotal} label="Consultations" accent="gold">
          <p className="dash-kpi-trend">sur la période sélectionnée</p>
        </StatCard>
        <StatCard
          value={`${stats.avgCompleteness}%`}
          label="Complétude moy."
          accent="ink"
        />
        <StatCard value={stats.rdv.upcomingWeek} label="RDV cette semaine">
          <p className="dash-kpi-trend">
            <strong>{stats.rdv.total}</strong> au total
          </p>
        </StatCard>
        <StatCard value={stats.hawaeExchanges} label="Échanges Hawae" accent="gold" />
        <StatCard
          value={stats.rappelsPending}
          label="Rappels en attente"
          accent={stats.rappelsPending > 0 ? "ink" : undefined}
        >
          {stats.rappelsPending > 0 ? (
            <p className="dash-kpi-trend">
              <Link href="/rappels" className="text-[var(--teal)] hover:underline">
                Voir rappels →
              </Link>
            </p>
          ) : null}
        </StatCard>
      </div>

      <DashboardChartsPanel
        activityData={activityData}
        pieData={pieData}
        pieFilter={pieFilter}
        onPieSelect={onPieSelect}
        ageBands={stats.ageBands}
        risksData={risksData}
        rdvByType={stats.rdv.byType.map((t) => ({
          label: t.label,
          count: t.count,
        }))}
        rdvByStatut={stats.rdv.byStatut}
      />

      <AnalyticsSearchPanel />

      <section className="hawae-panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              Dossiers récents
            </h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {effectiveSpec !== "all"
                ? `Filtre : ${SPECIALTY_LABELS[effectiveSpec as Specialty] ?? effectiveSpec}`
                : "Toutes spécialités"}
            </p>
          </div>
          <QuickLink href="/dossier" primary>
            Tous les dossiers
          </QuickLink>
        </div>
        {recent.length === 0 ? (
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
            {recent.map((p) => {
              const age = patientAgeYears(p.ddn);
              const pct = computeCompleteness(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/dossier?patient=${encodeURIComponent(p.id)}`}
                    className="flex min-h-[60px] items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--teal)]/40 hover:bg-[var(--teal-pale)]/25"
                  >
                    <span
                      className={`dash-completeness ${pct < 40 ? "low" : ""}`}
                      title="Complétude du dossier"
                    >
                      {pct}%
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--ink)]">
                        {getPatientDisplayName(p)}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {p.specialite
                          ? SPECIALTY_LABELS[p.specialite as Specialty]
                          : "—"}
                        {age != null ? ` · ${age} ans` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {p.lastSaved
                        ? new Date(p.lastSaved).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
