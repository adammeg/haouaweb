"use client";

import { useRef, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";
import { EMPTY_MODULES } from "@/types/modules";

export function DocumentsClient() {
  const ws = useModulesWorkspace();
  const addDocument = useModulesStore((s) => s.addDocument);
  const deleteDocument = useModulesStore((s) => s.deleteDocument);
  const markBackup = useModulesStore((s) => s.markBackup);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const patientsByUser = useHawaeStore((s) => s.patientsByUser);
  const historyByUser = useHawaeStore((s) => s.historyByUser);
  const workspaceByUser = useModulesStore((s) => s.workspaceByUser);
  const currentUserId = useHawaeStore((s) => s.currentUserId) ?? "user_default";

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addDocument({
        name: file.name,
        category: "scan",
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function exportBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      patients: patientsByUser[currentUserId] ?? {},
      history: historyByUser[currentUserId] ?? {},
      modules: workspaceByUser[currentUserId] ?? EMPTY_MODULES,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hawae-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    markBackup();
  }

  function onImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as {
          patients?: typeof patientsByUser[string];
          history?: typeof historyByUser[string];
          modules?: typeof workspaceByUser[string];
        };
        if (data.patients) {
          useHawaeStore.setState((s) => ({
            patientsByUser: {
              ...s.patientsByUser,
              [currentUserId]: data.patients!,
            },
          }));
        }
        if (data.history) {
          useHawaeStore.setState((s) => ({
            historyByUser: {
              ...s.historyByUser,
              [currentUserId]: data.history!,
            },
          }));
        }
        if (data.modules) {
          useModulesStore.getState().importWorkspace(data.modules);
        }
        setImportMsg("Import réussi.");
      } catch {
        setImportMsg("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">Galerie & sauvegarde</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Documents scannés, export / import JSON du cabinet.
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
        >
          Ajouter document
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={onUpload} />
        <button
          type="button"
          onClick={exportBackup}
          className="rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          Export JSON backup
        </button>
        <label className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold">
          Import JSON
          <input type="file" accept=".json" className="hidden" onChange={onImportJson} />
        </label>
        {ws.lastBackupAt ? (
          <span className="self-center text-xs text-[var(--muted)]">
            Dernier backup :{" "}
            {new Date(ws.lastBackupAt).toLocaleString("fr-FR")}
          </span>
        ) : null}
        {importMsg ? (
          <span className="self-center text-xs font-semibold text-[var(--teal)]">
            {importMsg}
          </span>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ws.documents.map((d) => (
          <figure
            key={d.id}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          >
            {d.mimeType.startsWith("image/") ? (
              <img
                src={d.dataUrl}
                alt={d.name}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-[var(--cream)] text-4xl">
                📄
              </div>
            )}
            <figcaption className="flex items-center justify-between gap-2 p-3 text-xs">
              <span className="truncate font-medium">{d.name}</span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => deleteDocument(d.id)}
              >
                ×
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
