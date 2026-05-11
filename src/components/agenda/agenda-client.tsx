"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGENDA_HOURS,
  DAYS_FR,
  MONTHS_FR,
  RDV_COLORS,
  RDV_LABELS,
  agendaGetWeekDates,
  isoDate,
  rdvFmtDate,
  type Rdv,
  type RdvType,
} from "@/stores/rdv-store";
import { useRdvStore } from "@/stores/rdv-store";
import { RdvModal } from "./rdv-modal";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";

type Prefill = { date: string; heure: string };

export function AgendaClient() {
  const list = useRdvStore((s) => s.list);
  const weekOffset = useRdvStore((s) => s.weekOffset);
  const navWeek = useRdvStore((s) => s.navWeek);

  const [createPrefill, setCreatePrefill] = useState<Prefill | null>(null);
  const [editingRdv, setEditingRdv] = useState<Rdv | null>(null);

  const router = useRouter();

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

  const todayRdvs = useMemo(() => {
    const t = isoDate(new Date());
    return list
      .filter((r) => r.date === t)
      .sort((a, b) => a.heure.localeCompare(b.heure));
  }, [list]);

  const upcoming = useMemo(() => {
    const t = isoDate(new Date());
    return list
      .filter((r) => r.date >= t)
      .sort((a, b) =>
        a.date !== b.date
          ? a.date.localeCompare(b.date)
          : a.heure.localeCompare(b.heure),
      )
      .slice(0, 10);
  }, [list]);

  function openRdvFromAgendaDouble(r: Rdv) {
    const all = Object.values(patientsMap);
    const first = r.patient.split(" ")[0]?.toLowerCase() ?? "";
    const match = all.find((p) =>
      `${(p.prenom ?? "")} ${(p.nom ?? "")}`.toLowerCase().includes(first),
    );
    if (match) {
      router.push(`/dossier?patient=${encodeURIComponent(match.id)}`);
    }
  }

  return (
    <div className="space-y-6 py-4">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
            Agenda
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            Agenda & rendez-vous
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ink-mid)]">
            Semaine du lundi au samedi : créneau vide = nouveau RDV. Clic sur un
            RDV = modifier. Double-clic = ouvrir le dossier si la patiente est
            reconnue.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => navWeek(-1)}
            className="hawae-btn hawae-btn-ghost"
            aria-label="Semaine précédente"
          >
            ← Préc.
          </button>
          <button
            type="button"
            onClick={() => navWeek(0)}
            className="hawae-btn hawae-btn-ghost"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => navWeek(1)}
            className="hawae-btn hawae-btn-ghost"
            aria-label="Semaine suivante"
          >
            Suiv. →
          </button>
          <button
            type="button"
            onClick={() =>
              setCreatePrefill({ date: isoDate(new Date()), heure: "09:00" })
            }
            className="hawae-btn hawae-btn-primary"
          >
            + Nouveau RDV
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Semaine
              </div>
              <div className="font-display text-base font-bold text-[var(--ink)] sm:text-lg">
                {weekTitle}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-medium text-[var(--ink-mid)] sm:justify-end sm:text-[11px]">
              <LegendDot type="consultation" />
              <LegendDot type="grossesse" />
              <LegendDot type="echo" />
              <LegendDot type="chirurgie" />
              <LegendDot type="bilan" />
              <LegendDot type="urgence" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]/60 bg-[var(--surface-raised)]/50 p-1 hawae-scroll">
            <div className="agenda-grid">
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
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[var(--ink)]">
                Aujourd&apos;hui
              </h2>
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                {todayRdvs.length} RDV
              </span>
            </div>
            {todayRdvs.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted)]">
                Aucun RDV aujourd&apos;hui
              </p>
            ) : (
              <ul>
                {todayRdvs.map((r) => (
                  <li
                    key={r.id}
                    className="rdv-item"
                    onClick={() => setEditingRdv(r)}
                  >
                    <span className="rdv-item-time">{r.heure}</span>
                    <span
                      className="rdv-item-dot"
                      style={{ background: RDV_COLORS[r.type] }}
                    />
                    <div className="rdv-item-info">
                      <div className="rdv-item-name">{r.patient}</div>
                      <div className="rdv-item-type">
                        {RDV_LABELS[r.type]} · {r.duree} min
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
            <h2 className="mb-2 font-display text-sm font-bold text-[var(--ink)]">
              Prochains RDV
            </h2>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted)]">
                Aucun RDV à venir
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setEditingRdv(r)}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left hover:border-[var(--border)] hover:bg-[var(--cream)]"
                    >
                      <span
                        className="h-7 w-7 shrink-0 rounded-lg"
                        style={{ background: RDV_COLORS[r.type] + "22" }}
                      >
                        <span
                          className="block h-full w-full rounded-lg"
                          style={{
                            borderLeft: `3px solid ${RDV_COLORS[r.type]}`,
                          }}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[var(--ink)]">
                          {r.patient}
                        </span>
                        <span className="block truncate text-[10px] text-[var(--muted)]">
                          {rdvFmtDate(r.date)} · {r.heure} ·{" "}
                          {RDV_LABELS[r.type]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {Object.keys(patientsMap).length > 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/35 p-3 text-[11px] leading-relaxed text-[var(--ink-mid)]">
              <span className="font-semibold text-[var(--teal)]">Astuce :</span>{" "}
              sur mobile, faites défiler horizontalement la grille. Le champ
              « Patiente » du formulaire propose l&apos;autocomplétion depuis vos
              dossiers ({Object.keys(patientsMap).length} fiche
              {Object.keys(patientsMap).length !== 1 ? "s" : ""}).
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--cream)]/80 p-3 text-[11px] leading-relaxed text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink-mid)]">Astuce :</span>{" "}
              créez des dossiers dans « Mes dossiers » pour activer
              l&apos;autocomplétion des noms dans le formulaire RDV. Sur petit
              écran, faites défiler la grille horizontalement.
            </div>
          )}
        </aside>
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
    </div>
  );
}

function LegendDot({ type }: { type: RdvType }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: RDV_COLORS[type] }}
      />
      {RDV_LABELS[type]}
    </span>
  );
}

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
              const heightPx = Math.max(20, Math.round((r.duree / 60) * 52));
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
                  <div className="truncate text-[10px] font-extrabold">
                    {r.heure} {r.patient}
                  </div>
                  <div className="text-[9px] opacity-80">
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
