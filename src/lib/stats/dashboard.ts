import type { ConsultationEntry, PatientSnapshot, Specialty } from "@/types/domain";
import type { Rdv, RdvStatut, RdvType } from "@/stores/rdv-store";
import { computeCompleteness } from "@/lib/patient-utils";
import {
  computeEpidemiology,
  specialtyLabel,
  type EpidemiologyStats,
} from "@/lib/stats/epidemiology";

export type PeriodMonths = 3 | 6 | 12 | 0;

export type DashboardStats = EpidemiologyStats & {
  filteredTotal: number;
  consultationsTotal: number;
  consultationsMonthly: { month: string; label: string; count: number }[];
  avgCompleteness: number;
  updatedLast7Days: number;
  updatedLast30Days: number;
  hawaeExchanges: number;
  rdv: {
    total: number;
    upcomingWeek: number;
    byType: { type: RdvType; count: number; label: string }[];
    byStatut: { statut: RdvStatut; count: number; label: string }[];
  };
  rappelsPending: number;
};

const MONTH_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const mi = parseInt(m, 10) - 1;
  if (!y || mi < 0 || mi > 11) return ym;
  return `${MONTH_FR[mi]} ${y.slice(2)}`;
}

function withinMonths(iso: string, months: PeriodMonths): boolean {
  if (months === 0) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return d >= cutoff;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(start: Date): Date {
  const e = new Date(start);
  e.setDate(e.getDate() + 7);
  return e;
}

export function filterPatients(
  patients: PatientSnapshot[],
  specialty: Specialty | "all",
): PatientSnapshot[] {
  if (specialty === "all") return patients;
  return patients.filter((p) => p.specialite === specialty);
}

export function computeDashboardStats(input: {
  patients: PatientSnapshot[];
  historyByPatient: Record<string, ConsultationEntry[]>;
  rdvList: Rdv[];
  rappelsPending: number;
  specialty?: Specialty | "all";
  periodMonths?: PeriodMonths;
}): DashboardStats {
  const specialty = input.specialty ?? "all";
  const periodMonths = input.periodMonths ?? 6;
  const allPatients = input.patients;
  const patients = filterPatients(allPatients, specialty);

  const epi = computeEpidemiology(patients);

  const monthMap: Record<string, number> = {};
  let consultationsTotal = 0;
  for (const entries of Object.values(input.historyByPatient)) {
    for (const c of entries) {
      if (!c.date) continue;
      if (!withinMonths(c.date, periodMonths)) continue;
      if (specialty !== "all" && c.specialite && c.specialite !== specialty) continue;
      consultationsTotal++;
      const m = c.date.slice(0, 7);
      monthMap[m] = (monthMap[m] ?? 0) + 1;
    }
  }

  const consultationsMonthly = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(periodMonths === 0 ? undefined : -Math.max(periodMonths, 6))
    .map(([month, count]) => ({
      month,
      label: monthLabel(month),
      count,
    }));

  let completenessSum = 0;
  let hawaeExchanges = 0;
  let updatedLast7Days = 0;
  let updatedLast30Days = 0;
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  for (const p of patients) {
    completenessSum += computeCompleteness(p);
    hawaeExchanges += p.hawaeIaHistory?.length ?? 0;
    if (p.lastSaved) {
      const t = new Date(p.lastSaved);
      if (t >= d7) updatedLast7Days++;
      if (t >= d30) updatedLast30Days++;
    }
  }

  const avgCompleteness =
    patients.length === 0 ? 0 : Math.round(completenessSum / patients.length);

  const weekStart = startOfWeek();
  const weekEnd = endOfWeek(weekStart);
  let upcomingWeek = 0;
  const typeMap: Partial<Record<RdvType, number>> = {};
  const statutMap: Partial<Record<RdvStatut, number>> = {};

  for (const r of input.rdvList) {
    typeMap[r.type] = (typeMap[r.type] ?? 0) + 1;
    statutMap[r.statut] = (statutMap[r.statut] ?? 0) + 1;
    if (r.date) {
      const d = new Date(r.date + "T12:00:00");
      if (d >= weekStart && d < weekEnd && r.statut !== "annule") upcomingWeek++;
    }
  }

  const RDV_TYPE_LABELS: Record<RdvType, string> = {
    consultation: "Consultation",
    grossesse: "Grossesse",
    echo: "Écho",
    chirurgie: "Chirurgie",
    bilan: "Bilan",
    urgence: "Urgence",
  };

  const RDV_STATUT_LABELS: Record<RdvStatut, string> = {
    confirme: "Confirmé",
    attente: "En attente",
    annule: "Annulé",
    non_joint: "Non joint",
    a_rappeler: "À rappeler",
  };

  const filteredMonthly =
    periodMonths === 0
      ? epi.monthlyActivity
      : epi.monthlyActivity.filter((m) => withinMonths(m.month + "-01", periodMonths));

  return {
    ...epi,
    monthlyActivity: filteredMonthly.map((m) => ({
      ...m,
      month: m.month,
    })),
    filteredTotal: patients.length,
    consultationsTotal,
    consultationsMonthly,
    avgCompleteness,
    updatedLast7Days,
    updatedLast30Days,
    hawaeExchanges,
    rdv: {
      total: input.rdvList.length,
      upcomingWeek,
      byType: (Object.keys(RDV_TYPE_LABELS) as RdvType[]).map((type) => ({
        type,
        count: typeMap[type] ?? 0,
        label: RDV_TYPE_LABELS[type],
      })),
      byStatut: (Object.keys(RDV_STATUT_LABELS) as RdvStatut[]).map((statut) => ({
        statut,
        count: statutMap[statut] ?? 0,
        label: RDV_STATUT_LABELS[statut],
      })),
    },
    rappelsPending: input.rappelsPending,
  };
}

export function mergeActivitySeries(stats: DashboardStats): {
  label: string;
  month: string;
  dossiers: number;
  consultations: number;
}[] {
  const map = new Map<string, { label: string; dossiers: number; consultations: number }>();

  for (const m of stats.monthlyActivity) {
    map.set(m.month, {
      label: monthLabel(m.month),
      dossiers: m.count,
      consultations: 0,
    });
  }
  for (const c of stats.consultationsMonthly) {
    const prev = map.get(c.month);
    if (prev) {
      prev.consultations = c.count;
      prev.label = c.label;
    } else {
      map.set(c.month, {
        label: c.label,
        dossiers: 0,
        consultations: c.count,
      });
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
}

export function specialtyChartData(stats: DashboardStats) {
  return Object.entries(stats.bySpecialty).map(([key, value]) => ({
    name: specialtyLabel(key),
    key,
    value,
  }));
}

export { specialtyLabel };
