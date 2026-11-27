"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ConsultationEntry, PatientSnapshot } from "@/types/domain";
import { computeCompleteness } from "@/lib/patient-utils";
import { buildPatientSubtitle, dossierDisplayName } from "@/lib/dossier/patient-meta";
import { knownAllergies } from "@/lib/dossier/dossier-nav";
import { useSyncStatus } from "@/stores/sync-status";
import { planSocleMigration, socleValue } from "@/lib/dossier/socle";

type Props = {
  draft: PatientSnapshot;
  history: ConsultationEntry[];
  saving: boolean;
  pdfBusy: boolean;
  onClose: () => void;
  onNewConsultation: () => void;
  onOrdonnance?: () => void;
  onCrOp?: () => void;
  onWaiting: () => void;
  onPdf: () => void;
  onEcho: () => void;
};

function SaveState({ saving }: { saving: boolean }) {
  const sync = useSyncStatus((s) => s.state);
  if (!saving && sync === "error") {
    return (
      <span className="pb-save error" role="alert">
        Non synchronisé : conservé sur ce poste
      </span>
    );
  }
  const busy = saving || sync === "pending" || sync === "idle";
  return (
    <span className={`pb-save ${busy ? "" : "ok"}`} role="status">
      {saving || sync === "pending"
        ? "Enregistrement…"
        : sync === "saved"
          ? "Enregistré sur le serveur"
          : "Conservé sur ce poste"}
    </span>
  );
}

export function PatientBanner(p: Props) {
  const { draft } = p;
  const menu = useRef<HTMLDetailsElement>(null);
  const allergies = knownAllergies(draft, p.history);
  // Tant que deux groupes contradictoires n'ont pas été tranchés, aucun des deux n'est affiché seul.
  const groupConflict = draft.socleMigrated
    ? undefined
    : planSocleMigration(draft).conflicts.find((c) => c.key === "o_grp");
  const groupValue = socleValue(draft, "o_grp");
  const group = groupConflict
    ? { text: groupConflict.values.map((v) => v.value).join(" ou "), disputed: true }
    : groupValue
      ? { text: groupValue, disputed: false }
      : null;

  useEffect(() => {
    function close(e: Event) {
      const m = menu.current;
      if (!m?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        m.querySelector("summary")?.focus();
      } else if (m.contains(e.target as Node)) return;
      m.open = false;
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  const run = (fn?: () => void) => () => {
    if (menu.current) menu.current.open = false;
    fn?.();
  };

  return (
    <section className="patient-banner" aria-label="Patiente">
      <button type="button" className="pb-back" onClick={p.onClose}>
        <span aria-hidden>‹</span> Patientes
      </button>
      <div className="pb-main">
        <div className="pb-id">
          <h1>{dossierDisplayName(draft)}</h1>
          <p>{buildPatientSubtitle(draft)}</p>
        </div>
        <dl className="pb-facts">
          <div className={allergies ? "alert" : ""}>
            <dt>Allergies</dt>
            <dd>
              {allergies ? allergies.text : "Non renseignées"}
              {allergies?.from
                ? ` (consultation du ${new Date(allergies.from).toLocaleDateString("fr-FR")}, à confirmer)`
                : null}
            </dd>
          </div>
          {draft.specialite === "obst" && draft.o_terme ? (
            <div>
              <dt>Terme</dt>
              <dd>{draft.o_terme}</dd>
            </div>
          ) : null}
          {group ? (
            <div className={group.disputed ? "alert" : ""}>
              <dt>Groupe</dt>
              <dd>{group.disputed ? `${group.text} : à vérifier` : group.text}</dd>
            </div>
          ) : null}
          {draft.traitements?.trim() ? (
            <div>
              <dt>Traitements</dt>
              <dd>{draft.traitements}</dd>
            </div>
          ) : null}
        </dl>
        <div className="pb-actions">
          {p.onOrdonnance ? (
            <button type="button" className="pb-btn primary" onClick={p.onOrdonnance}>
              Ordonnance
            </button>
          ) : null}
          <details ref={menu} className="pb-menu">
            <summary className="pb-btn">Actions</summary>
            <div>
              <button type="button" onClick={run(p.onNewConsultation)}>Nouvelle consultation</button>
              <button type="button" onClick={run(p.onWaiting)}>Envoyer en salle d&apos;attente</button>
              {p.onCrOp ? (
                <button type="button" onClick={run(p.onCrOp)}>Compte rendu opératoire</button>
              ) : null}
              <button type="button" onClick={run(p.onEcho)}>Lire une image d&apos;écho</button>
              <button type="button" disabled={p.pdfBusy} onClick={run(p.onPdf)}>
                {p.pdfBusy ? "Création du PDF…" : "Exporter le dossier en PDF"}
              </button>
              <Link href="/bridge">Ouvrir le bridge écho</Link>
            </div>
          </details>
        </div>
      </div>
      <div className="pb-foot">
        <SaveState saving={p.saving} />
        <span>Dossier complété à {computeCompleteness(draft)} %</span>
      </div>
    </section>
  );
}
