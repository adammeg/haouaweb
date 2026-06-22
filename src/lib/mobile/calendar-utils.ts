import type { Rdv } from "@/stores/rdv-store";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
const MONTHS_FR = [
  "jan.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeekMonday(ref = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekDatesFromOffset(weekOffset: number): Date[] {
  const start = startOfWeekMonday(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function dayLabel(d: Date): string {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export type CalendarDay = {
  date: string;
  label: string;
  isToday: boolean;
  rdv: Rdv[];
};

export function buildCalendarWeek(
  rdvList: Rdv[],
  weekOffset = 0,
): {
  today: string;
  weekStart: string;
  weekEnd: string;
  weekTitle: string;
  days: CalendarDay[];
  todayRdvs: Rdv[];
  upcoming: Rdv[];
} {
  const today = isoDate(new Date());
  const dates = weekDatesFromOffset(weekOffset);
  const weekStart = isoDate(dates[0]!);
  const weekEnd = isoDate(dates[dates.length - 1]!);
  const d0 = dates[0]!;
  const d5 = dates[dates.length - 1]!;
  const weekTitle = `${d0.getDate()} ${MONTHS_FR[d0.getMonth()]} — ${d5.getDate()} ${MONTHS_FR[d5.getMonth()]} ${d5.getFullYear()}`;

  const days: CalendarDay[] = dates.map((d) => {
    const date = isoDate(d);
    const rdv = rdvList
      .filter((r) => r.date === date && r.statut !== "annule")
      .sort((a, b) => a.heure.localeCompare(b.heure));
    return {
      date,
      label: dayLabel(d),
      isToday: date === today,
      rdv,
    };
  });

  const todayRdvs = rdvList
    .filter((r) => r.date === today && r.statut !== "annule")
    .sort((a, b) => a.heure.localeCompare(b.heure));

  const upcoming = rdvList
    .filter((r) => r.date >= today && r.statut !== "annule")
    .sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.heure.localeCompare(b.heure),
    )
    .slice(0, 12);

  return { today, weekStart, weekEnd, weekTitle, days, todayRdvs, upcoming };
}
