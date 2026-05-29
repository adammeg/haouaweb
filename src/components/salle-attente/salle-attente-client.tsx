"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import type { WaitingStatus } from "@/types/modules";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { patientInitials } from "@/lib/dossier/patient-meta";
import {
  WR_MOTIFS,
  arrivalIso,
  currentTimeHm,
  formatWrDateFr,
  minutesWaitingLabel,
  STATUS_SORT,
  todayIso,
} from "@/lib/waiting-room/utils";
import { registerArrival } from "@/lib/waiting-room/register-arrival";
import { NewPatientModal } from "@/components/patient/new-patient-modal";
import { WaitingRoomAgendaPane } from "@/components/salle-attente/waiting-room-agenda-pane";
import { WaitingRoomRdvSidebar } from "@/components/salle-attente/waiting-room-rdv-sidebar";

const STATUS_LABELS: Record<WaitingStatus, string> = {
  waiting: "En attente",
  in_consult: "En consultation",
  done: "Terminé",
  cancelled: "Terminé",
};

/** Classes badge v50 : attente | consultation | termine */
function v50BadgeClass(status: WaitingStatus): string {
  if (status === "waiting") return "attente";
  if (status === "in_consult") return "consultation";
  return "termine";
}

function displayName(prenom?: string, nom?: string): string {
  const pr = (prenom ?? "").trim();
  const n = (nom ?? "").trim();
  if (pr && n) return `${pr} ${n}`;
  return pr || n || "Patiente";
}

export function SalleAttenteClient() {
  const router = useRouter();
  const today = todayIso();
  const dateFr = useMemo(() => formatWrDateFr(), []);

  const [wrTab, setWrTab] = useState<"file" | "agenda">("file");
  const [addOpen, setAddOpen] = useState(false);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [motif, setMotif] = useState<string>(WR_MOTIFS[0]);
  const [heure, setHeure] = useState(currentTimeHm);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const currentPatientId = useHawaeStore((s) => s.currentPatientId);
  const createPatientFromForm = useHawaeStore((s) => s.createPatientFromForm);
  const openPatient = useHawaeStore((s) => s.openPatient);

  const ws = useModulesWorkspace();
  const addWaiting = useModulesStore((s) => s.addWaiting);
  const updateWaitingStatus = useModulesStore((s) => s.updateWaitingStatus);
  const removeWaiting = useModulesStore((s) => s.removeWaiting);

  const queueToday = useMemo(
    () =>
      ws.waitingQueue
        .filter((e) => e.date === today)
        .sort((a, b) => {
          const o =
            (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9);
          if (o !== 0) return o;
          return a.arrivalTime.localeCompare(b.arrivalTime);
        }),
    [ws.waitingQueue, today],
  );

  const stats = useMemo(() => {
    const waiting = queueToday.filter((e) => e.status === "waiting").length;
    const consult = queueToday.filter((e) => e.status === "in_consult").length;
    const done = queueToday.filter((e) => e.status === "done").length;
    return { total: queueToday.length, waiting, consult, done };
  }, [queueToday]);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const openDossier = useCallback(
    (patientId: string) => {
      openPatient(patientId);
      router.push("/dossier");
    },
    [openPatient, router],
  );

  function switchTab(tab: "file" | "agenda") {
    setWrTab(tab);
  }

  function toggleAddForm() {
    setAddOpen((v) => {
      if (!v) setHeure(currentTimeHm());
      return !v;
    });
  }

  function submitArrival() {
    const result = registerArrival(
      { nom, prenom, tel, motif, arrivalTime: heure },
      {
        patientsMap,
        queueToday,
        createPatientFromForm,
        addWaiting,
      },
    );
    if (!result.ok) {
      showToast(result.error, false);
      return;
    }
    setNom("");
    setPrenom("");
    setTel("");
    setMotif(WR_MOTIFS[0]);
    setHeure("");
    setAddOpen(false);
    const p = patientsMap[result.patientId];
    const name = p
      ? displayName(p.prenom, p.nom)
      : displayName(prenom, nom);
    showToast(
      result.created
        ? `✅ ${name} enregistré(e) — dossier créé automatiquement`
        : `✅ ${name} enregistré(e) en salle d'attente`,
      true,
    );
  }

  function openActiveDossier() {
    if (!currentPatientId) {
      showToast("⚠️ Aucun dossier actif", false);
      return;
    }
    openDossier(currentPatientId);
  }

  return (
    <div className="hawae-salle-attente-root">
      <div className="waiting-room" id="space-waiting">
        <div className="wr-header">
          <div>
            <div className="wr-date" id="wr-date-title">
              {dateFr.title}
            </div>
            <div className="wr-date-sub" id="wr-date-sub">
              {dateFr.sub}
            </div>
          </div>
          <div className="wr-stats-strip">
            <div className="wr-stat">
              <div className="wr-stat-n" id="wr-count-total">
                {stats.total}
              </div>
              <div className="wr-stat-l">Patients</div>
            </div>
            <div className="wr-stat">
              <div
                className="wr-stat-n"
                id="wr-count-waiting"
                style={{ color: "#f59e0b" }}
              >
                {stats.waiting}
              </div>
              <div className="wr-stat-l">En attente</div>
            </div>
            <div className="wr-stat">
              <div
                className="wr-stat-n"
                id="wr-count-consult"
                style={{ color: "#10b981" }}
              >
                {stats.consult}
              </div>
              <div className="wr-stat-l">En consul.</div>
            </div>
            <div className="wr-stat">
              <div
                className="wr-stat-n"
                id="wr-count-done"
                style={{ color: "#9ca3af" }}
              >
                {stats.done}
              </div>
              <div className="wr-stat-l">Terminés</div>
            </div>
          </div>
        </div>

        <div className="wr-queue">
          <div className="wr-tabs">
            <button
              type="button"
              className={`wr-tab ${wrTab === "file" ? "active" : ""}`}
              onClick={() => switchTab("file")}
            >
              🪑 File du jour
            </button>
            <button
              type="button"
              className={`wr-tab ${wrTab === "agenda" ? "active" : ""}`}
              onClick={() => switchTab("agenda")}
            >
              📅 Agenda semaine
            </button>
          </div>

          <div
            className={`wr-tab-pane ${wrTab === "file" ? "active" : ""}`}
            id="wr-pane-file"
          >
            <div className="wr-queue-title" style={{ marginBottom: 12 }}>
              <span>File d&apos;attente</span>
              <button
                type="button"
                className="wr-action-btn primary"
                style={{ marginLeft: "auto" }}
                onClick={toggleAddForm}
              >
                + Ajouter
              </button>
            </div>

            <div className={`wr-add-form ${addOpen ? "open" : ""}`} id="wr-add-form">
              <div className="wr-add-grid">
                <input
                  type="text"
                  id="wr-new-nom"
                  placeholder="Nom *"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
                <input
                  type="text"
                  id="wr-new-prenom"
                  placeholder="Prénom *"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                />
                <input
                  type="tel"
                  id="wr-new-tel"
                  placeholder="Téléphone"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                />
                <select
                  id="wr-new-motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                >
                  {WR_MOTIFS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  id="wr-new-heure"
                  style={{ gridColumn: "span 2" }}
                  value={heure}
                  onChange={(e) => setHeure(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="wr-action-btn primary"
                  style={{ flex: 1 }}
                  onClick={submitArrival}
                >
                  Enregistrer l&apos;arrivée
                </button>
                <button
                  type="button"
                  className="wr-action-btn sec"
                  onClick={toggleAddForm}
                >
                  Annuler
                </button>
              </div>
            </div>

            <div id="wr-list">
              {queueToday.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🚪</div>
                  Aucun patient pour aujourd&apos;hui.
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Cliquez sur + Ajouter pour enregistrer une arrivée.
                  </span>
                </div>
              ) : (
                queueToday.map((entry) => {
                  const p = patientsMap[entry.patientId];
                  const iso = arrivalIso(entry.date, entry.arrivalTime);
                  const cardCls =
                    entry.status === "in_consult"
                      ? "en-consultation"
                      : entry.status === "done"
                        ? "termine"
                        : "";
                  const badge = v50BadgeClass(entry.status);
                  const pr = p?.prenom ?? "";
                  const n = p?.nom ?? "";
                  const initials = p
                    ? patientInitials(p)
                    : (pr[0] ?? n[0] ?? "?").toUpperCase() +
                      (n[0] ?? pr[1] ?? "").toUpperCase();

                  return (
                    <div
                      key={entry.id}
                      className={`wr-patient-card ${cardCls}`}
                      onClick={() => openDossier(entry.patientId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openDossier(entry.patientId);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="wr-avatar">{initials}</div>
                      <div className="wr-patient-info">
                        <div className="wr-patient-name">
                          {displayName(p?.prenom, p?.nom)}
                        </div>
                        <div className="wr-patient-meta">
                          {entry.motif || p?.motif || "Consultation"} ·{" "}
                          {entry.arrivalTime} · {p?.tel || "—"}
                        </div>
                        <div className="wr-wait-time">
                          ⏱ {minutesWaitingLabel(iso)}
                        </div>
                      </div>
                      <span className={`wr-status-badge ${badge}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                      <div
                        className="wr-actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {entry.status === "waiting" ? (
                          <button
                            type="button"
                            className="wr-action-btn primary"
                            onClick={() =>
                              updateWaitingStatus(entry.id, "in_consult")
                            }
                          >
                            ▶ Appeler
                          </button>
                        ) : null}
                        {entry.status === "in_consult" ? (
                          <button
                            type="button"
                            className="wr-action-btn sec"
                            onClick={() =>
                              updateWaitingStatus(entry.id, "done")
                            }
                          >
                            ✓ Terminer
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="wr-action-btn sec"
                          onClick={() => removeWaiting(entry.id)}
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            className={`wr-tab-pane ${wrTab === "agenda" ? "active" : ""}`}
            id="wr-pane-agenda"
          >
            <WaitingRoomAgendaPane />
          </div>
        </div>

        <div className="wr-sidebar">
          <div className="wr-sidebar-card">
            <div className="wr-sidebar-title">📅 RDV programmés</div>
            <WaitingRoomRdvSidebar onToast={showToast} />
          </div>

          <div className="wr-sidebar-card">
            <div className="wr-sidebar-title">⚡ Actions rapides</div>
            <div className="wr-sidebar-actions">
              <button
                type="button"
                className="wr-action-btn primary"
                onClick={() => setNewModal(true)}
              >
                ＋ Nouveau dossier patiente
              </button>
              <button
                type="button"
                className="wr-action-btn sec"
                onClick={openActiveDossier}
              >
                📋 Accéder au dossier actif
              </button>
              <button
                type="button"
                className="wr-action-btn sec"
                onClick={() => router.push("/dashboard")}
              >
                📊 Voir le dashboard
              </button>
            </div>
          </div>
        </div>

        <NewPatientModal open={newModal} onClose={() => setNewModal(false)} />

        {toast ? (
          <div className={`wr-toast ${toast.ok ? "ok" : "err"}`} role="status">
            {toast.msg}
          </div>
        ) : null}
      </div>
    </div>
  );
}
