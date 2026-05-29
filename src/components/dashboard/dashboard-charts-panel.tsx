"use client";

import {
  ActivityChart,
  AgeBarChart,
  ClinicalRisksChart,
  RdvTypeChart,
  SpecialtyPieChart,
} from "@/components/dashboard/dashboard-charts";

export type DashboardChartsPanelProps = {
  activityData: {
    label: string;
    dossiers: number;
    consultations: number;
  }[];
  pieData: { name: string; key: string; value: number }[];
  pieFilter: string | null;
  onPieSelect: (key: string | null) => void;
  ageBands: { label: string; count: number }[];
  risksData: { label: string; value: number }[];
  rdvByType: { label: string; count: number }[];
  rdvByStatut: { statut: string; count: number; label: string }[];
};

export function DashboardChartsPanel({
  activityData,
  pieData,
  pieFilter,
  onPieSelect,
  ageBands,
  risksData,
  rdvByType,
  rdvByStatut,
}: DashboardChartsPanelProps) {
  return (
    <div className="dash-layout-charts">
      <div className="dash-chart-card dash-span-2">
        <h3>Activité du cabinet</h3>
        <p className="dash-chart-sub">
          Dossiers modifiés et consultations enregistrées — survolez les courbes pour le détail.
        </p>
        <ActivityChart data={activityData} />
      </div>

      <div className="dash-chart-card">
        <h3>Répartition par spécialité</h3>
        <p className="dash-chart-sub">Cliquez sur un segment pour filtrer le tableau de bord.</p>
        <SpecialtyPieChart data={pieData} activeKey={pieFilter} onSelect={onPieSelect} />
        <p className="dash-pie-hint">Segment actif = filtre appliqué</p>
      </div>

      <div className="dash-chart-card">
        <h3>Pyramide des âges</h3>
        <p className="dash-chart-sub">Tranches d&apos;âge des patientes du filtre actuel.</p>
        <AgeBarChart data={ageBands} />
      </div>

      <div className="dash-chart-card dash-span-2">
        <h3>Indicateurs cliniques</h3>
        <p className="dash-chart-sub">
          Facteurs de risque obstétricaux et infertilité détectés dans les dossiers.
        </p>
        <ClinicalRisksChart data={risksData} />
      </div>

      <div className="dash-chart-card">
        <h3>Agenda — types de RDV</h3>
        <p className="dash-chart-sub">Répartition des rendez-vous enregistrés.</p>
        <RdvTypeChart data={rdvByType} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          {rdvByStatut
            .filter((s) => s.count > 0)
            .map((s) => (
              <span
                key={s.statut}
                className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]"
              >
                {s.label} : {s.count}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
