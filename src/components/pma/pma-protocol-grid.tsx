"use client";

import type { ReactNode } from "react";
import type { IvfAnalysis, IvfProtocolOption } from "@/lib/pma/ivf-types";

export function PmaProtocolGrid({
  analysis,
  selectedId,
  onSelect,
}: {
  analysis: IvfAnalysis;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const recProto =
    analysis.protocols.find((p) => p.recommended) ?? analysis.protocols[0];

  return (
    <>
      <div className="pma-card">
        <div className="pma-card-header">
          <div className="pma-card-title">💊 Protocoles proposés — Choix médecin</div>
          <span className="pma-card-sub">
            Cliquez sur le protocole retenu — le calendrier se met à jour
          </span>
        </div>
        <p className="mb-3.5 rounded-lg border-l-[3px] border-[var(--gold)] bg-[#fef3c7] px-3.5 py-2.5 text-xs font-semibold text-[#92400e]">
          ⭐ Hawae recommande un protocole selon le profil clinique. Le médecin
          reste décisionnaire — sélectionnez le protocole retenu.
        </p>
        <div className="pma-protocol-grid">
          {analysis.protocols.map((proto) => (
            <ProtocolCard
              key={proto.id}
              proto={proto}
              selected={selectedId === proto.id}
              onSelect={() => onSelect(proto.id)}
            />
          ))}
        </div>
        {selectedId ? (
          <ChosenProtocol
            proto={
              analysis.protocols.find((p) => p.id === selectedId) ?? recProto!
            }
          />
        ) : null}
      </div>

      {recProto ? (
        <div className="pma-card">
          <div className="pma-card-header">
            <div className="pma-card-title">💉 Posologie personnalisée</div>
          </div>
          <div className="pma-dose-box">
            <DoseRow
              label="Dose de départ"
              value={
                recProto.dose > 0
                  ? recProto.dose + " UI/j"
                  : "Naturel (voir protocole)"
              }
            />
            <DoseRow
              label="Adaptation"
              value={
                analysis.poseidon.group >= 3
                  ? "Step-up prudent (réserve basse)"
                  : analysis.response.responseType.includes("Hyper")
                    ? "Step-down si E2 > 2500 pg/mL"
                    : "Maintien ou step-up à J8"
              }
            />
            <DoseRow
              label="Risque OHSS"
              value={
                <span className={"pma-ohss-badge " + analysis.ohss.level}>
                  {analysis.ohss.label}
                </span>
              }
            />
            <DoseRow
              label="Trigger prévu"
              value={
                analysis.ohss.level === "high" ||
                analysis.ohss.level === "critical"
                  ? "Agoniste GnRH + Freeze-all obligatoire"
                  : "hCG (Ovitrelle 250µg) si OHSS non critique"
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProtocolCard({
  proto,
  selected,
  onSelect,
}: {
  proto: IvfProtocolOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const cls = [
    "pma-protocol-card",
    proto.recommended ? "recommended" : "",
    selected ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={cls} onClick={onSelect}>
      {proto.recommended ? (
        <div className="pma-rec-banner">★ RECOMMANDÉ PAR HAWAE</div>
      ) : null}
      <div style={{ fontSize: "1.5rem", marginBottom: 5 }}>{proto.icon}</div>
      <div className="pma-protocol-type">{proto.type}</div>
      <div className="pma-protocol-name">{proto.name}</div>
      <div className="pma-protocol-detail">
        <strong>Dose :</strong>{" "}
        {proto.dose > 0 ? proto.dose + " UI/j" : "Naturel"}
        <br />
        <strong>Trigger :</strong> {proto.trigger}
        <br />
        <strong>Stratégie :</strong> {proto.strategy}
      </div>
      <p className="mt-2 rounded-md bg-[#eff6ff] px-2 py-1.5 text-[0.65rem] font-semibold leading-snug text-[#1e40af]">
        ℹ️ {proto.indication}
      </p>
      <div className="pma-protocol-tags">
        {proto.meds.map((m) => (
          <span key={m} className="pma-protocol-tag">
            {m}
          </span>
        ))}
      </div>
      {proto.freezeAll ? (
        <p className="mt-1 text-[0.65rem] font-bold text-[#7c3aed]">
          🧊 Freeze-all — TEC différé
        </p>
      ) : null}
    </button>
  );
}

function ChosenProtocol({ proto }: { proto: IvfProtocolOption }) {
  return (
    <div className="pma-chosen-box">
      <p className="text-xs font-extrabold text-[#166534]">
        ✅ Protocole retenu par le médecin
      </p>
      <p className="mt-1 text-[0.95rem] font-bold text-[var(--ink)]">
        {proto.icon} {proto.name}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-mid)]">
        Dose : <strong>{proto.dose > 0 ? proto.dose + " UI/j" : "Naturel"}</strong>
        {" · "}Trigger : <strong>{proto.trigger}</strong>
        {proto.freezeAll ? " · 🧊 Freeze-all obligatoire" : ""}
      </p>
    </div>
  );
}

function DoseRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="pma-dose-row">
      <span className="pma-dose-label">{label}</span>
      <span className="pma-dose-val">{value}</span>
    </div>
  );
}
