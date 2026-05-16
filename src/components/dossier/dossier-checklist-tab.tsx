"use client";

import { useMemo, useState } from "react";
import type { PatientSnapshot, Specialty } from "@/types/domain";
import {
  CHECKLISTS,
  CHECKLIST_SPEC_TITLES,
} from "@/lib/dossier/checklists";

export function DossierChecklistTab({ draft }: { draft: PatientSnapshot }) {
  const spec = draft.specialite as Specialty | undefined;
  const [manual, setManual] = useState<Record<string, boolean>>({});

  const { items, done, total, pct } = useMemo(() => {
    if (!spec || !CHECKLISTS[spec]) {
      return { items: [], done: 0, total: 0, pct: 0 };
    }
    const list = CHECKLISTS[spec];
    let d = 0;
    const rows = list.map((item) => {
      const autoDone = item.check(draft);
      const isDone = autoDone || !!manual[item.id];
      if (isDone) d++;
      return { ...item, isDone };
    });
    const t = list.length;
    return {
      items: rows,
      done: d,
      total: t,
      pct: t ? Math.round((d / t) * 100) : 0,
    };
  }, [spec, draft, manual]);

  if (!spec) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        Sélectionnez une spécialité dans l&apos;onglet Anamnèse pour afficher la
        checklist.
      </p>
    );
  }

  return (
    <div className="dossier-card">
      <div className="dossier-card-header">
        <h3>✅ Checklist de consultation</h3>
        <span className="ar">قائمة التحقق</span>
      </div>
      <div className="dossier-card-body">
        <p className="mb-3.5 text-xs text-[var(--muted)]">
          Items à vérifier avant de conclure — mis à jour automatiquement selon
          la spécialité et les données saisies.
        </p>
        <div className="checklist-progress">
          <div className="cl-prog-bar">
            <div className="cl-prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="cl-prog-txt">
            {done} / {total}
          </div>
        </div>
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
          {CHECKLIST_SPEC_TITLES[spec]} — {total} points à vérifier
        </div>
        {items.map((item) => {
          const stateClass = item.isDone
            ? "done"
            : item.warn
              ? "warn"
              : "";
          return (
            <button
              key={item.id}
              type="button"
              className={`checklist-item w-full text-left ${stateClass} ${item.isDone ? "checked" : ""}`}
              onClick={() =>
                setManual((m) => ({ ...m, [item.id]: !m[item.id] }))
              }
            >
              <div className="ci-check">{item.isDone ? "✓" : ""}</div>
              <div>
                <div className="ci-label">
                  {item.label}
                  {item.warn && !item.isDone ? (
                    <span className="ml-1 text-[11px] text-amber-600">⚠</span>
                  ) : null}
                </div>
                <div className="ci-sub">{item.sub}</div>
              </div>
            </button>
          );
        })}
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          ✓ = rempli automatiquement · Cliquer pour cocher/décocher manuellement
        </p>
      </div>
    </div>
  );
}
