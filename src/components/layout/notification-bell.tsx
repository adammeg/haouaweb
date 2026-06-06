"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  RDV_LABELS,
  RDV_STATUT_COLORS,
  useRdvStore,
  type Rdv,
} from "@/stores/rdv-store";
import {
  catIcon,
  rappelsIsSameDay,
  rappelsToday,
  rappelsTomorrow,
  useRappelsStore,
  type Rappel,
} from "@/stores/rappels-store";

type NotifItem =
  | { kind: "rdv"; id: string; rdv: Rdv; when: "today" | "tomorrow" }
  | { kind: "rappel"; id: string; rappel: Rappel; overdue: boolean };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const rdvList = useRdvStore((s) => s.list);
  const manualList = useRappelsStore((s) => s.list);
  const markManyNotifsRead = useRappelsStore((s) => s.markManyNotifsRead);
  const readNotifs = useRappelsStore((s) => s.readNotifs);

  const today = useMemo(() => rappelsToday(), []);
  const tomorrow = useMemo(() => rappelsTomorrow(), []);

  const items = useMemo<NotifItem[]>(() => {
    const out: NotifItem[] = [];

    // RDV à rappeler / en attente aujourd'hui ou demain
    for (const rdv of rdvList) {
      const statut = rdv.statut ?? "a_rappeler";
      if (statut !== "a_rappeler" && statut !== "attente") continue;
      if (rappelsIsSameDay(rdv.date, today)) {
        out.push({ kind: "rdv", id: `rdv_${rdv.id}`, rdv, when: "today" });
      } else if (rappelsIsSameDay(rdv.date, tomorrow)) {
        out.push({ kind: "rdv", id: `rdv_${rdv.id}`, rdv, when: "tomorrow" });
      }
    }

    // Rappels manuels actifs échus / à venir
    const todayMs = today.getTime();
    for (const r of manualList) {
      if (r.done) continue;
      const d = r.date ? new Date(`${r.date}T00:00:00`) : null;
      const due =
        !d || Number.isNaN(d.getTime()) ? false : d.getTime() <= todayMs;
      const upcoming =
        d && !Number.isNaN(d.getTime())
          ? d.getTime() <= tomorrow.getTime()
          : true;
      if (due || upcoming) {
        out.push({
          kind: "rappel",
          id: `rap_${r.id}`,
          rappel: r,
          overdue: due,
        });
      }
    }

    return out;
  }, [rdvList, manualList, today, tomorrow]);

  const unreadCount = useMemo(
    () => items.filter((i) => !readNotifs.includes(i.id)).length,
    [items, readNotifs],
  );

  // Fermer au clic extérieur / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Marquer comme lu à l'ouverture
  useEffect(() => {
    if (!open) return;
    const ids = items.map((i) => i.id).filter((id) => !readNotifs.includes(id));
    if (ids.length) markManyNotifsRead(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications & rappels"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--teal-pale)]/50"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 z-[300] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--teal-pale)]/40 px-4 py-3">
            <span className="font-display text-sm font-bold text-[var(--teal)]">
              🔔 Notifications & rappels
            </span>
            <Link
              href="/rappels"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-[var(--teal)] hover:underline"
            >
              Tout voir
            </Link>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                Aucune notification pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]/60">
                {items.map((it) =>
                  it.kind === "rdv" ? (
                    <li key={it.id} className="flex gap-3 px-4 py-3">
                      <span
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            RDV_STATUT_COLORS[it.rdv.statut ?? "a_rappeler"],
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[var(--ink)]">
                          {it.rdv.patient || "Patiente inconnue"}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {RDV_LABELS[it.rdv.type] ?? it.rdv.type} ·{" "}
                          {it.rdv.heure || "—"} ·{" "}
                          {it.when === "today" ? "Aujourd'hui" : "Demain"}
                        </div>
                        <div className="mt-0.5 text-[11px] font-semibold text-amber-600">
                          À rappeler / confirmer
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li key={it.id} className="flex gap-3 px-4 py-3">
                      <span className="mt-0.5 shrink-0 text-base leading-none">
                        {catIcon(it.rappel.cat)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[var(--ink)]">
                          {it.rappel.desc || "Rappel"}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {it.rappel.patient ? `${it.rappel.patient} · ` : ""}
                          {it.rappel.date || "Sans date"}
                        </div>
                        {it.overdue ? (
                          <div className="mt-0.5 text-[11px] font-semibold text-red-600">
                            Échu
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
