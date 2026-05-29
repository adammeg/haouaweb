"use client";

import { useMemo, useState } from "react";
import {
  RDV_COLORS,
  RDV_LABELS,
  isoDate,
  type Rdv,
} from "@/stores/rdv-store";
import { useRdvStore } from "@/stores/rdv-store";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { RdvModal } from "@/components/agenda/rdv-modal";
import { registerArrival } from "@/lib/waiting-room/register-arrival";
import { motifFromRdvType } from "@/lib/waiting-room/rdv-motif";
import { todayIso } from "@/lib/waiting-room/utils";

type Props = {
  onToast: (msg: string, ok: boolean) => void;
};

export function WaitingRoomRdvSidebar({ onToast }: Props) {
  const list = useRdvStore((s) => s.list);
  const deleteRdv = useRdvStore((s) => s.deleteRdv);
  const [editingRdv, setEditingRdv] = useState<Rdv | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });
  const createPatientFromForm = useHawaeStore((s) => s.createPatientFromForm);
  const addWaiting = useModulesStore((s) => s.addWaiting);
  const ws = useModulesWorkspace();

  const today = todayIso();
  const queueToday = useMemo(
    () => ws.waitingQueue.filter((e) => e.date === today),
    [ws.waitingQueue, today],
  );

  const todayRdvs = useMemo(() => {
    const t = isoDate(new Date());
    return list
      .filter((r) => r.date === t)
      .sort((a, b) => a.heure.localeCompare(b.heure));
  }, [list]);

  function isAlreadyWaiting(patientName: string): boolean {
    const parts = patientName.trim().toLowerCase().split(/\s+/);
    const prenom = parts[0] ?? "";
    const nom = parts.slice(1).join(" ") || prenom;
    return queueToday.some((e) => {
      const p = patientsMap[e.patientId];
      if (!p) return false;
      return (
        (p.prenom ?? "").toLowerCase() === prenom &&
        (p.nom ?? "").toLowerCase() === nom
      );
    });
  }

  function faireEntrer(r: Rdv) {
    const parts = r.patient.trim().split(/\s+/);
    const prenom = parts[0] ?? "";
    const nom = parts.slice(1).join(" ") || prenom;
    const result = registerArrival(
      { nom, prenom, motif: motifFromRdvType(r.type), arrivalTime: r.heure },
      {
        patientsMap,
        queueToday,
        createPatientFromForm,
        addWaiting,
      },
    );
    if (!result.ok) {
      onToast(result.error, false);
      return;
    }
    onToast(`🚪 ${r.patient} enregistré(e) en salle d'attente`, true);
  }

  return (
    <>
      <div id="wr-rdv-list">
        {todayRdvs.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              textAlign: "center",
              padding: 12,
            }}
          >
            Aucun RDV aujourd&apos;hui
          </div>
        ) : (
          todayRdvs.map((r) => {
            const already = isAlreadyWaiting(r.patient);
            return (
              <div
                key={r.id}
                className="rdv-item"
                onClick={() => setEditingRdv(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingRdv(r);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="rdv-item-time">{r.heure}</div>
                <div
                  className="rdv-item-dot"
                  style={{ background: RDV_COLORS[r.type] }}
                />
                <div className="rdv-item-info">
                  <div className="rdv-item-name">{r.patient}</div>
                  <div className="rdv-item-type">
                    {RDV_LABELS[r.type]} · {r.duree}min
                  </div>
                  {!already ? (
                    <button
                      type="button"
                      className="wr-action-btn primary"
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        marginTop: 4,
                        borderRadius: 8,
                      }}
                      title="Enregistrer l'arrivée en salle d'attente"
                      onClick={(e) => {
                        e.stopPropagation();
                        faireEntrer(r);
                      }}
                    >
                      🚪 Faire entrer
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--green)",
                        marginTop: 3,
                        display: "block",
                      }}
                    >
                      ✓ En salle
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="rdv-item-del"
                  title="Supprimer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Supprimer ce RDV ?")) deleteRdv(r.id);
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="btn-add-rdv"
        style={{
          width: "100%",
          marginTop: 10,
          justifyContent: "center",
        }}
        onClick={() => setCreateOpen(true)}
      >
        + Nouveau RDV
      </button>

      {createOpen ? (
        <RdvModal
          mode="create"
          open
          prefillDate={isoDate(new Date())}
          prefillHeure={new Date().toTimeString().slice(0, 5)}
          onClose={() => setCreateOpen(false)}
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
