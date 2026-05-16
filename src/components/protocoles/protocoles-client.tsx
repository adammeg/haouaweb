"use client";

import { useState } from "react";
import { PROTOCOL_CATALOG, type ProtocolItem } from "@/lib/protocols/catalog";
import { useModulesStore, useModulesWorkspace } from "@/stores/modules-store";

export function ProtocolesClient() {
  const ws = useModulesWorkspace();
  const setTeachMode = useModulesStore((s) => s.setTeachMode);
  const [selected, setSelected] = useState<ProtocolItem | null>(
    PROTOCOL_CATALOG[0] ?? null,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Protocoles cliniques</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Fiches procédurales obstétrique, gynéco, PMA et urgences.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={ws.teachMode}
            onChange={(e) => setTeachMode(e.target.checked)}
          />
          Mode enseignement
        </label>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-1">
          {PROTOCOL_CATALOG.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className={
                  "w-full rounded-xl px-3 py-2.5 text-left text-sm " +
                  (selected?.id === p.id
                    ? "bg-[var(--teal)] font-semibold text-white"
                    : "hover:bg-[var(--cream)]")
                }
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <article className="rounded-2xl border bg-white p-6">
            <span className="text-[10px] font-bold uppercase text-[var(--teal)]">
              {selected.category}
            </span>
            <h2 className="mt-2 font-display text-xl font-bold">{selected.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{selected.summary}</p>
            <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm">
              {selected.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {ws.teachMode && selected.references ? (
              <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                Réf. : {selected.references}
              </p>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  );
}
