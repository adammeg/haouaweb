"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGENDA_HOURS,
  DAYS_FR,
  MONTHS_FR,
  RDV_LABELS,
  agendaGetWeekDates,
  isoDate,
  type Rdv,
} from "@/stores/rdv-store";
import { useRdvStore } from "@/stores/rdv-store";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { RdvModal } from "@/components/agenda/rdv-modal";

type Prefill = { date: string; heure: string };

function HourRow({
  hour,
  dates,
  rdvs,
  onSlotClick,
  onRdvClick,
  onRdvDouble,
}: {
  hour: (typeof AGENDA_HOURS)[number];
  dates: Date[];
  rdvs: Rdv[];
  onSlotClick: (dateStr: string, slotH: string) => void;
  onRdvClick: (r: Rdv) => void;
  onRdvDouble: (r: Rdv) => void;
}) {
  const slotH = `${String(hour).padStart(2, "0")}:00`;
  return (
    <>
      <div className="agenda-time-cell">{hour}:00</div>
      {dates.map((d) => {
        const dateStr = isoDate(d);
        const inSlot = rdvs.filter(
          (r) =>
            r.date === dateStr &&
            r.heure &&
            r.heure.startsWith(String(hour).padStart(2, "0")),
        );
        return (
          <div
            key={dateStr + "-" + hour}
            className="agenda-day-col agenda-slot"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest(".agenda-rdv")) return;
              onSlotClick(dateStr, slotH);
            }}
          >
            {inSlot.map((r) => {
              const heightPx = Math.round(((r.duree || 30) / 60) * 52);
              return (
                <div
                  key={r.id}
                  className={`agenda-rdv type-${r.type}`}
                  style={{ height: `${heightPx}px`, top: "1px" }}
                  title={`${r.patient} — ${RDV_LABELS[r.type]} (${r.heure}, ${r.duree}min) — Double-clic: ouvrir dossier`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRdvClick(r);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onRdvDouble(r);
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.heure} {r.patient}
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.8 }}>
                    {RDV_LABELS[r.type]}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export function WaitingRoomAgendaPane() {
  const router = useRouter();
  const list = useRdvStore((s) => s.list);
  const weekOffset = useRdvStore((s) => s.weekOffset);
  const navWeek = useRdvStore((s) => s.navWeek);

  const [createPrefill, setCreatePrefill] = useState<Prefill | null>(null);
  const [editingRdv, setEditingRdv] = useState<Rdv | null>(null);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const dates = useMemo(
    () => agendaGetWeekDates(weekOffset),
    [weekOffset],
  );

  const weekTitle = useMemo(() => {
    const d0 = dates[0]!;
    const d5 = dates[5]!;
    return `${d0.getDate()} ${MONTHS_FR[d0.getMonth()]} — ${d5.getDate()} ${MONTHS_FR[d5.getMonth()]} ${d5.getFullYear()}`;
  }, [dates]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekKeys = useMemo(() => dates.map((d) => isoDate(d)), [dates]);
  const weekRdv = useMemo(
    () => list.filter((r) => weekKeys.includes(r.date)),
    [list, weekKeys],
  );

  function openRdvFromAgendaDouble(r: Rdv) {
    const first = r.patient.split(" ")[0]?.toLowerCase() ?? "";
    const match = Object.values(patientsMap).find((p) =>
      `${p.prenom ?? ""} ${p.nom ?? ""}`.toLowerCase().includes(first),
    );
    if (match) {
      router.push(`/dossier?patient=${encodeURIComponent(match.id)}`);
    }
  }

  return (
    <>
      <div className="agenda-wrap">
        <div className="agenda-nav">
          <button
            type="button"
            className="agenda-nav-btn"
            onClick={() => navWeek(-1)}
            aria-label="Semaine précédente"
          >
            ‹
          </button>
          <div className="agenda-nav-title">{weekTitle}</div>
          <button
            type="button"
            className="agenda-nav-btn"
            onClick={() => navWeek(1)}
            aria-label="Semaine suivante"
          >
            ›
          </button>
        </div>
        <div className="agenda-grid" id="agenda-grid">
          <div className="agenda-col-head" />
          {dates.map((d, i) => {
            const isToday = d.getTime() === today.getTime();
            return (
              <div
                key={isoDate(d)}
                className={`agenda-col-head ${isToday ? "today" : ""}`}
              >
                <span>{DAYS_FR[i]}</span>
                <span className="day-num">{d.getDate()}</span>
              </div>
            );
          })}
          {AGENDA_HOURS.map((h) => (
            <HourRow
              key={h}
              hour={h}
              dates={dates}
              rdvs={weekRdv}
              onSlotClick={(dateStr, slotH) =>
                setCreatePrefill({ date: dateStr, heure: slotH })
              }
              onRdvClick={(r) => setEditingRdv(r)}
              onRdvDouble={openRdvFromAgendaDouble}
            />
          ))}
        </div>
      </div>

      {createPrefill ? (
        <RdvModal
          mode="create"
          open
          prefillDate={createPrefill.date}
          prefillHeure={createPrefill.heure}
          onClose={() => setCreatePrefill(null)}
        />
      ) : null}

      {editingRdv ? (
        <RdvModal
          mode="edit"
          open
          rdv={editingRdv}
          onClose={() => setEditingRdv(null)}
        />
      ) : null}
    </>
  );
}
