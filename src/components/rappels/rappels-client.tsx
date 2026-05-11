"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  RDV_COLORS,
  RDV_LABELS,
  RDV_STATUTS,
  useRdvStore,
  type Rdv,
  type RdvStatut,
} from "@/stores/rdv-store";
import {
  rappelsFmtDate,
  rappelsIsSameDay,
  rappelsToday,
  rappelsTomorrow,
  useRappelsStore,
  type RappelContactAction,
} from "@/stores/rappels-store";
import { RappelModal } from "./rappel-modal";

/**
 * Port fidèle du tab v48 `tab-rappels` :
 *   - sous-titre dynamique + actions (refresh, aller à l'agenda)
 *   - filtres : Tous / À rappeler / Confirmés / Non joint / Annulés
 *   - 4 stats (total, à rappeler, confirmés, non joint)
 *   - sections « Aujourd'hui » et « Demain »
 *   - cartes RDV avec téléphone, type coloré, actions de statut
 *   - historique des contacts (collapsible)
 *   - + nouvelle entrée : ouverture du modal de rappel manuel
 */

type FilterKey = "all" | RappelContactAction;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "a_rappeler", label: "📞 À rappeler" },
  { key: "confirme", label: "✅ Confirmés" },
  { key: "non_joint", label: "📵 Non joint" },
  { key: "annule", label: "❌ Annulés" },
];

export function RappelsClient() {
  const rdvList = useRdvStore((s) => s.list);
  const updateRdv = useRdvStore((s) => s.updateRdv);

  const manualList = useRappelsStore((s) => s.list);
  const contacts = useRappelsStore((s) => s.contacts);
  const pushContact = useRappelsStore((s) => s.pushContact);
  const doneRappel = useRappelsStore((s) => s.doneRappel);
  const deleteRappel = useRappelsStore((s) => s.deleteRappel);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [showHist, setShowHist] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshFx, setRefreshFx] = useState(false);

  const today = useMemo(() => rappelsToday(), []);
  const tomorrow = useMemo(() => rappelsTomorrow(), []);

  const rdvToday = useMemo(
    () =>
      rdvList
        .filter((r) => rappelsIsSameDay(r.date, today))
        .sort((a, b) => a.heure.localeCompare(b.heure)),
    [rdvList, today],
  );

  const rdvTomorrow = useMemo(
    () =>
      rdvList
        .filter((r) => rappelsIsSameDay(r.date, tomorrow))
        .sort((a, b) => a.heure.localeCompare(b.heure)),
    [rdvList, tomorrow],
  );

  const allTwo = useMemo(
    () => [...rdvToday, ...rdvTomorrow],
    [rdvToday, rdvTomorrow],
  );

  const stats = useMemo(() => {
    const count = (s: RdvStatut) =>
      allTwo.filter((r) => (r.statut ?? "confirme") === s).length;
    return {
      total: allTwo.length,
      a_rappeler: count("a_rappeler"),
      confirme: count("confirme"),
      non_joint: count("non_joint"),
    };
  }, [allTwo]);

  const subtitle =
    rdvToday.length + rdvTomorrow.length === 0
      ? "Aucun RDV sur les 2 prochains jours"
      : `${rdvToday.length} RDV aujourd’hui · ${rdvTomorrow.length} RDV demain`;

  const filterFn = (list: Rdv[]) =>
    filter === "all"
      ? list
      : list.filter((r) => (r.statut ?? "confirme") === filter);

  function setStatut(rdvId: string, action: RappelContactAction) {
    updateRdv(rdvId, {
      statut: action,
      rappelAt: new Date().toISOString(),
    });
    pushContact(rdvId, action);
  }

  function onRefresh() {
    setRefreshFx(true);
    setTimeout(() => setRefreshFx(false), 600);
  }

  const activeManual = manualList.filter((r) => !r.done);

  return (
    <div className="space-y-6 py-4">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
            Rappels
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            Rappels & relances
          </h1>
          <p
            id="rapp-subtitle"
            className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ink-mid)]"
          >
            {subtitle}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="hawae-btn hawae-btn-ghost"
            aria-label="Actualiser"
          >
            {refreshFx ? "🔄 …" : "🔄 Actualiser"}
          </button>
          <Link href="/agenda" className="hawae-btn hawae-btn-ghost">
            📅 Ouvrir Agenda
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hawae-btn hawae-btn-primary"
          >
            + Nouveau rappel
          </button>
        </div>
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rapp-filter ${active ? "active" : ""}`}
              aria-pressed={active}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <section
        className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)] sm:grid-cols-4"
        id="rapp-stats"
      >
        <StatItem val={stats.total} label="Total" color="var(--teal)" />
        <StatItem val={stats.a_rappeler} label="À rappeler" color="#f59e0b" />
        <StatItem val={stats.confirme} label="Confirmés" color="#10b981" />
        <StatItem val={stats.non_joint} label="Non joint" color="#6b7280" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <RdvSection
          title={`📅 Aujourd’hui — ${rappelsFmtDate(today)}`}
          rdvs={filterFn(rdvToday)}
          emptyMsg="Aucun RDV aujourd'hui"
          onAction={setStatut}
        />
        <RdvSection
          title={`📅 Demain — ${rappelsFmtDate(tomorrow)}`}
          rdvs={filterFn(rdvTomorrow)}
          emptyMsg="Aucun RDV demain"
          onAction={setStatut}
        />
      </div>

      {/* Rappels manuels actifs (différent du tab RDV — port v48 openRappelModal liste) */}
      {activeManual.length > 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
          <h2 className="font-display text-sm font-bold text-[var(--ink)]">
            Rappels manuels en cours ({activeManual.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {activeManual.map((r) => {
              const d = r.date ? new Date(`${r.date}T00:00:00`) : null;
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const daysLeft = d
                ? Math.round((d.getTime() - now.getTime()) / 86400000)
                : null;
              const chip =
                daysLeft === null
                  ? null
                  : daysLeft < 0
                    ? `En retard ${Math.abs(daysLeft)}j`
                    : daysLeft === 0
                      ? "Aujourd’hui"
                      : `Dans ${daysLeft}j`;
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-raised)]/70 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--ink)]">
                      {r.desc}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {r.patient ? `${r.patient} · ` : ""}
                      {d
                        ? d.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Sans date"}{" "}
                      {chip ? (
                        <span className="ml-1 rounded-full bg-[var(--teal-pale)] px-2 py-0.5 text-[10px] font-bold text-[var(--teal)]">
                          {chip}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => doneRappel(r.id)}
                      className="rounded-md bg-[#dcfce7] px-3 py-1 text-[11px] font-bold text-[#166534] hover:bg-[#bbf7d0]"
                    >
                      ✓ Fait
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRappel(r.id)}
                      className="rounded-md bg-[#fee2e2] px-3 py-1 text-[11px] font-bold text-[#b91c1c] hover:bg-[#fecaca]"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Historique des contacts */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
        <button
          type="button"
          onClick={() => setShowHist((s) => !s)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={showHist}
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">
            🗂️ Historique des contacts
          </span>
          <span className="text-[11px] font-bold text-[var(--teal)]">
            {showHist ? "▲ masquer" : "▼ afficher"}
          </span>
        </button>
        {showHist ? (
          <HistList contacts={contacts.slice(0, 50)} rdvs={rdvList} />
        ) : null}
      </section>

      <RappelModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function StatItem({
  val,
  label,
  color,
}: {
  val: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rapp-stat-item">
      <div className="rapp-stat-val" style={{ color }}>
        {val}
      </div>
      <div className="rapp-stat-label">{label}</div>
    </div>
  );
}

function RdvSection({
  title,
  rdvs,
  emptyMsg,
  onAction,
}: {
  title: string;
  rdvs: Rdv[];
  emptyMsg: string;
  onAction: (rdvId: string, action: RappelContactAction) => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <h2 className="mb-3 font-display text-sm font-bold text-[var(--ink)]">
        {title}
      </h2>
      {rdvs.length === 0 ? (
        <p className="rapp-empty">{emptyMsg}</p>
      ) : (
        <ul className="space-y-3">
          {rdvs.map((rdv) => (
            <RdvCard key={rdv.id} rdv={rdv} onAction={onAction} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RdvCard({
  rdv,
  onAction,
}: {
  rdv: Rdv;
  onAction: (rdvId: string, action: RappelContactAction) => void;
}) {
  const statut: RdvStatut = rdv.statut ?? "a_rappeler";
  const typeColor = RDV_COLORS[rdv.type] ?? "#6b7280";
  const typeLabel = RDV_LABELS[rdv.type] ?? rdv.type;
  const isAnnule = statut === "annule";

  return (
    <li className={`rapp-card st-${statut}`}>
      <div className="rapp-card-time" style={{ background: typeColor }}>
        <div className="rapp-card-time-h">{rdv.heure || "—"}</div>
        <div className="rapp-card-time-type">{typeLabel}</div>
      </div>
      <div className="rapp-card-info">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rapp-card-name">
            {rdv.patient || "Patiente inconnue"}
          </div>
          <StatutBadge statut={statut} />
        </div>
        <div className="rapp-card-meta">
          <span>⏱ {rdv.duree || 30} min</span>
          {rdv.notes ? (
            <span>
              📝 {rdv.notes.slice(0, 40)}
              {rdv.notes.length > 40 ? "…" : ""}
            </span>
          ) : null}
          {rdv.rappelAt ? (
            <span style={{ color: "var(--teal)" }}>
              Dernier contact :{" "}
              {new Date(rdv.rappelAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
        {rdv.tel ? (
          <div className="rapp-card-tel">
            📞{" "}
            <a href={`tel:${rdv.tel}`} style={{ color: "inherit", textDecoration: "none" }}>
              {rdv.tel}
            </a>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            Pas de téléphone
          </div>
        )}
        <div className="rapp-card-actions">
          {isAnnule ? (
            <button
              type="button"
              className="rapp-action-btn rappeler"
              onClick={() => onAction(rdv.id, "a_rappeler")}
            >
              ↩️ Réactiver
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rapp-action-btn confirme"
                onClick={() => onAction(rdv.id, "confirme")}
              >
                ✅ Confirmé
              </button>
              <button
                type="button"
                className="rapp-action-btn non_joint"
                onClick={() => onAction(rdv.id, "non_joint")}
              >
                📵 Non joint
              </button>
              <button
                type="button"
                className="rapp-action-btn rappeler"
                onClick={() => onAction(rdv.id, "a_rappeler")}
              >
                📞 À rappeler
              </button>
              <button
                type="button"
                className="rapp-action-btn annule"
                onClick={() => onAction(rdv.id, "annule")}
              >
                ❌ Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function StatutBadge({ statut }: { statut: RdvStatut }) {
  const label = RDV_STATUTS[statut] ?? RDV_STATUTS.a_rappeler;
  return <span className={`rapp-status-badge ${statut}`}>{label}</span>;
}

function HistList({
  contacts,
  rdvs,
}: {
  contacts: ReturnType<typeof useRappelsStore.getState>["contacts"];
  rdvs: Rdv[];
}) {
  if (contacts.length === 0) {
    return <p className="rapp-empty">Aucun contact enregistré</p>;
  }
  const labels: Record<RappelContactAction, { label: string; color: string }> = {
    confirme: { label: "RDV confirmé", color: "#10b981" },
    non_joint: { label: "Non joint", color: "#6b7280" },
    annule: { label: "RDV annulé", color: "#ef4444" },
    a_rappeler: { label: "À rappeler", color: "#f59e0b" },
  };
  return (
    <ul className="mt-3 space-y-2" id="rapp-hist-list">
      {contacts.map((c, idx) => {
        const rdv = rdvs.find((r) => r.id === c.rdvId);
        const patName = rdv ? rdv.patient : "RDV supprimé";
        const info = labels[c.action];
        return (
          <li key={`${c.rdvId}-${c.time}-${idx}`} className="rapp-hist-item">
            <div className="rapp-hist-dot" style={{ background: info.color }} />
            <div style={{ flex: 1 }}>
              <strong>{patName || "Patiente inconnue"}</strong>
              <span
                style={{
                  color: info.color,
                  fontWeight: 700,
                  marginLeft: 6,
                }}
              >
                {info.label}
              </span>
              {c.note ? (
                <span
                  style={{ color: "var(--muted)", marginLeft: 6 }}
                >
                  {c.note}
                </span>
              ) : null}
            </div>
            <div style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
              {new Date(c.time).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ·{" "}
              {new Date(c.time).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
