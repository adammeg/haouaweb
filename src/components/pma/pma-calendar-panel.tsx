"use client";

import type { IvfAnalysis, IvfProtocolOption } from "@/lib/pma/ivf-types";

export function PmaCalendarPanel({
  analysis,
  selectedProto,
}: {
  analysis: IvfAnalysis;
  selectedProto: IvfProtocolOption | undefined;
}) {
  if (!selectedProto) {
    return (
      <div className="pma-card pma-empty">
        <div className="pma-empty-icon">📅</div>
        <p className="font-bold">Calendrier non généré</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Lancez l&apos;analyse puis choisissez un protocole.
        </p>
      </div>
    );
  }

  return (
    <div className="pma-card">
      <div className="pma-card-header">
        <div className="pma-card-title">
          📅 Calendrier — {selectedProto.icon} {selectedProto.name}
        </div>
      </div>
      <div>
        {analysis.calendar.map((day, i) => (
          <div key={day.day + i} className={"pma-cal-day " + day.type}>
            <div className="pma-cal-day-num">{day.day}</div>
            <div>
              <div className="pma-cal-day-title">{day.title}</div>
              <p className="pma-cal-day-detail">{day.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
