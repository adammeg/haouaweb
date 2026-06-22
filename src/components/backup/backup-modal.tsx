"use client";

import { useRef, useState } from "react";
import {
  downloadCabinetBackup,
  importCabinetBackup,
} from "@/lib/backup/cabinet-backup";

export function BackupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  function onExport() {
    const n = downloadCabinetBackup();
    setMsg(`✅ ${n} dossiers + paramètres exportés`);
    onClose();
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const count = Object.keys(data.patients ?? {}).length;
        if (
          !confirm(
            `Importer ${count} dossier${count > 1 ? "s" : ""} ?\n\nLes dossiers existants avec le même ID seront écrasés.`,
          )
        ) {
          return;
        }
        importCabinetBackup(data, (m) => setMsg(m));
        onClose();
      } catch {
        setMsg("❌ Erreur lecture fichier");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-[300] bg-black/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="backup-modal-title"
        className="fixed left-1/2 top-1/2 z-[310] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
      >
        <h2 id="backup-modal-title" className="font-display text-lg font-bold text-[var(--ink)]">
          💾 Backup cabinet
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-mid)]">
          Export / import JSON : patients, historique, agenda, rappels, protocoles et paramètres.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onExport}
            className="rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Exporter le backup JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
          >
            Importer un backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onImport}
          />
        </div>
        {msg ? (
          <p className="mt-3 text-xs font-medium text-[var(--teal)]">{msg}</p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--cream)]"
        >
          Fermer
        </button>
      </div>
    </>
  );
}
