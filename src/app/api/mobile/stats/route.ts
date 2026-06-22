import { NextResponse } from "next/server";
import { dbError } from "@/lib/api/error-response";
import { withCors, optionsResponse } from "@/lib/api/cors";
import { requireDoctor } from "@/lib/api/require-doctor";
import { loadDoctorWorkspaceData } from "@/lib/mobile/load-doctor-data";
import {
  computeDashboardStats,
  mergeActivitySeries,
  specialtyChartData,
  type PeriodMonths,
} from "@/lib/stats/dashboard";
import type { Specialty } from "@/types/domain";

export const dynamic = "force-dynamic";

const VALID_PERIODS = new Set<number>([0, 3, 6, 12]);
const VALID_SPECS = new Set<string>(["all", "gyn", "obst", "inf"]);

export function OPTIONS(req: Request) {
  return optionsResponse(req);
}

/** GET /api/mobile/stats?period=6&specialty=all */
export async function GET(req: Request) {
  const auth = await requireDoctor(req);
  if (auth instanceof NextResponse) return withCors(auth, req);

  const url = new URL(req.url);
  const periodRaw = Number(url.searchParams.get("period") ?? "6");
  const period: PeriodMonths = VALID_PERIODS.has(periodRaw)
    ? (periodRaw as PeriodMonths)
    : 6;
  const specRaw = url.searchParams.get("specialty") ?? "all";
  const specialty: Specialty | "all" = VALID_SPECS.has(specRaw)
    ? (specRaw as Specialty | "all")
    : "all";

  try {
    const data = await loadDoctorWorkspaceData(auth.doctor.sub);
    const stats = computeDashboardStats({
      patients: data.patients,
      historyByPatient: data.historyByPatient,
      rdvList: data.rdvList,
      rappelsPending: data.rappelsPending,
      specialty,
      periodMonths: period,
    });

    return withCors(
      NextResponse.json({
        ok: true,
        period,
        specialty,
        stats: {
          filteredTotal: stats.filteredTotal,
          consultationsTotal: stats.consultationsTotal,
          avgCompleteness: stats.avgCompleteness,
          updatedLast7Days: stats.updatedLast7Days,
          updatedLast30Days: stats.updatedLast30Days,
          hawaeExchanges: stats.hawaeExchanges,
          rappelsPending: stats.rappelsPending,
          rdv: stats.rdv,
          ageBands: stats.ageBands,
          obstRisks: stats.obstRisks,
          infertility: stats.infertility,
        },
        activity: mergeActivitySeries(stats),
        specialtyChart: specialtyChartData(stats).map((row) => ({
          label: row.name,
          key: row.key,
          value: row.value,
        })),
        consultationsMonthly: stats.consultationsMonthly,
      }),
      req,
    );
  } catch (e) {
    return withCors(dbError("mobile.stats.GET", e), req);
  }
}
