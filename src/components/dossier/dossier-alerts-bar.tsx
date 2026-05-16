"use client";

import type { PatientSnapshot } from "@/types/domain";
import { computeMLAlerts } from "@/lib/dossier/ml-alerts";

export function DossierAlertsBar({ draft }: { draft: PatientSnapshot }) {
  const alerts = computeMLAlerts(draft);
  if (alerts.length === 0) return null;

  return (
    <div className="ml-alerts-bar">
      {alerts.map((a, i) => (
        <div key={i} className={`ml-alert ${a.level}`}>
          <span className="text-base">{a.icon}</span>
          <div>
            <div className="ml-alert-title">{a.title}</div>
            <div className="ml-alert-sub">{a.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
