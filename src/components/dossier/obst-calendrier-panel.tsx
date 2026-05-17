"use client";

import { useEffect, useMemo, useState } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { dossierDisplayName } from "@/lib/dossier/patient-meta";
import {
  buildObstCalendar,
  calcDdrFromSa,
  formatCalDate,
  trimSeparatorLabel,
  CAL_TYPE_LABELS,
  type CalTimelineEvent,
} from "@/lib/obst/obst-calendar-config";
import { printObstCalendarPdf } from "@/lib/obst/obst-calendar-pdf";
import { AnaCard } from "@/components/dossier/anamnese-shared";

type Props = {
  draft: PatientSnapshot;
  onDdrChange?: (ddr: string) => void;
};

function ProgressHeader({
  summary,
  gpa,
}: {
  summary: NonNullable<ReturnType<typeof buildObstCalendar>["summary"]>;
  gpa: string;
}) {
  return (
    <div className="obst-csg-header">
      <div className="obst-csg-header-icon">🤰</div>
      <div className="obst-csg-header-info">
        <div className="obst-csg-header-title">Carnet de suivi grossesse</div>
        <div className="obst-csg-header-sub">
          {gpa} · {summary.trimLabel} · {summary.saCurrent} SA
        </div>
      </div>
      <div className="obst-csg-header-sa">
        <div className="obst-csg-header-sa-num">{summary.saCurrent}</div>
        <div className="obst-csg-header-sa-lbl">Semaines d&apos;aménorrhée</div>
      </div>
    </div>
  );
}

function TimelineEventCard({ item }: { item: CalTimelineEvent }) {
  const saRange =
    item.sa[0] === item.sa[1]
      ? item.sa[0] + " SA"
      : item.sa[0] + "–" + item.sa[1] + " SA";

  return (
    <article className={`obst-cal-event obst-cal-event--${item.status}`}>
      <div className="obst-cal-event-head">
        <span className="obst-cal-event-icon">{item.icon}</span>
        <div className="obst-cal-event-main">
          <div className="obst-cal-event-title">
            {item.titre}
            {item.status === "past" && (
              <span className="obst-cal-badge obst-cal-badge--past">✓ Passé</span>
            )}
            {item.status === "current" && (
              <span className="obst-cal-badge obst-cal-badge--now">▶ Maintenant</span>
            )}
          </div>
          <div className="obst-cal-event-meta">
            <span className={`obst-cal-type obst-cal-type--${item.type}`}>
              {CAL_TYPE_LABELS[item.type]}
            </span>
            {saRange} · <strong>{formatCalDate(item.dateEvt)}</strong>
            {item.sa[0] !== item.sa[1] && (
              <span className="obst-cal-deadline">
                {" "}
                → au plus tard {formatCalDate(item.dateLimite)}
              </span>
            )}
          </div>
        </div>
      </div>
      {item.examens.length > 0 && (
        <div className="obst-cal-examens">
          <div className="obst-cal-examens-label">🧪 Examens</div>
          <ul>
            {item.examens.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {item.vaccins.length > 0 && (
        <div className="obst-cal-vaccins">
          {item.vaccins.map((v) => (
            <div key={v}>{v}</div>
          ))}
        </div>
      )}
      {item.note && <p className="obst-cal-note">ℹ️ {item.note}</p>}
    </article>
  );
}

export function ObstCalendrierPanel({ draft, onDdrChange }: Props) {
  const [ddr, setDdr] = useState(draft.o_ddr ?? "");
  const [saInput, setSaInput] = useState("");

  useEffect(() => {
    if (draft.o_ddr) setDdr(draft.o_ddr);
  }, [draft.id, draft.o_ddr]);

  const gpa = `G${draft.o_gest ?? "?"} P${draft.o_par ?? "?"} A${draft.o_abort ?? "?"}`;

  const { summary, events } = useMemo(() => buildObstCalendar(ddr), [ddr]);

  useEffect(() => {
    if (summary) setSaInput(String(summary.saCurrent));
  }, [summary?.saCurrent]);

  const grouped = useMemo(() => {
    const groups: { trim: 1 | 2 | 3; items: CalTimelineEvent[] }[] = [];
    let last = 0;
    for (const ev of events) {
      if (ev.trim !== last) {
        last = ev.trim;
        groups.push({ trim: ev.trim, items: [] });
      }
      groups[groups.length - 1]!.items.push(ev);
    }
    return groups;
  }, [events]);

  const syncDdr = (value: string) => {
    setDdr(value);
    onDdrChange?.(value);
  };

  const onSaBlur = () => {
    const sa = parseInt(saInput, 10);
    if (sa >= 1 && sa <= 42) {
      syncDdr(calcDdrFromSa(sa));
    }
  };

  const exportPdf = () => {
    if (!summary) return;
    printObstCalendarPdf(dossierDisplayName(draft), summary, events);
  };

  const daysLabel = summary
    ? summary.daysUntilDpa > 0
      ? "dans " + summary.daysUntilDpa + " j"
      : summary.daysUntilDpa === 0
        ? "Aujourd'hui"
        : "Dépassée de " + Math.abs(summary.daysUntilDpa) + " j"
    : "";

  return (
    <AnaCard title="📅 Calendrier obstétrical" ar="التقويم الطبي">
      {!draft.o_ddr && !ddr && (
        <p className="obst-cal-hint">
          Renseignez la DDR dans l&apos;onglet <strong>Grossesse</strong> ou
          ci-dessous pour générer le planning CNGOF/HAS.
        </p>
      )}

      <div className="obst-cal-input-row">
        <label className="obst-cal-field">
          <span>Date des dernières règles (DDR)</span>
          <input
            type="date"
            className="hawae-input"
            value={ddr}
            onChange={(e) => syncDdr(e.target.value)}
          />
        </label>
        <label className="obst-cal-field">
          <span>Ou âge gestationnel actuel</span>
          <div className="obst-cal-sa-row">
            <input
              type="number"
              className="hawae-input"
              min={1}
              max={42}
              placeholder="12"
              value={saInput}
              onChange={(e) => setSaInput(e.target.value)}
              onBlur={onSaBlur}
            />
            <span>SA</span>
          </div>
        </label>
      </div>

      {summary ? (
        <>
          <ProgressHeader summary={summary} gpa={gpa} />

          <div className="obst-csg-progress-wrap">
            <div className="obst-csg-progress-bar-bg">
              <div
                className="obst-csg-progress-bar-fill"
                style={{
                  width: Math.min(100, Math.round((summary.saCurrent / 41) * 100)) + "%",
                }}
              />
            </div>
            <div className="obst-csg-progress-labels">
              <span>DDR / Conception</span>
              <span>DPA estimée : {formatCalDate(summary.dpa)} · {daysLabel}</span>
            </div>
            <div className="obst-csg-trim-markers">
              <span className="obst-csg-trim-mark t1">T1 · S1–S14</span>
              <span className="obst-csg-trim-mark t2">T2 · S15–S28</span>
              <span className="obst-csg-trim-mark t3">T3 · S29–S41</span>
            </div>
          </div>

          <div className="obst-cal-resume">
            <div>
              <span className="obst-cal-resume-lbl">DDR</span>
              <strong>{formatCalDate(summary.ddr)}</strong>
            </div>
            <div>
              <span className="obst-cal-resume-lbl">Terme actuel</span>
              <strong className="obst-cal-resume-sa">{summary.saCurrent} SA</strong>
              <span>{summary.trimLabel}</span>
            </div>
            <div>
              <span className="obst-cal-resume-lbl">DPA estimée</span>
              <strong>{formatCalDate(summary.dpa)}</strong>
              <span>{daysLabel}</span>
            </div>
          </div>

          <div className="obst-cal-timeline">
            {grouped.map((g) => (
              <section key={g.trim}>
                <h4 className="obst-cal-trim-title">
                  {trimSeparatorLabel(g.trim)}
                </h4>
                {g.items.map((item) => (
                  <TimelineEventCard key={item.titre + item.sa[0]} item={item} />
                ))}
              </section>
            ))}
          </div>

          <div className="obst-cal-actions">
            <button type="button" className="obst-cal-btn-pdf" onClick={exportPdf}>
              📄 Exporter le calendrier en PDF
            </button>
          </div>
        </>
      ) : (
        <div className="obst-cal-empty">
          <span className="obst-cal-empty-icon">📅</span>
          <p>Entrez la DDR ou l&apos;âge gestationnel pour générer le calendrier complet.</p>
        </div>
      )}
    </AnaCard>
  );
}
