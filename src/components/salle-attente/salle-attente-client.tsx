"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { SPECIALTY_LABELS, type Specialty } from "@/types/domain";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import {
  getPatientDisplayName,
  patientAgeYears,
} from "@/lib/patient-utils";

export function SalleAttenteClient() {
  const [q, setQ] = useState("");
  const patientsMap = useHawaeStore((s) => {
    const id = s.currentUserId;
    if (!id) return EMPTY_PATIENTS_MAP;
    return s.patientsByUser[id] ?? EMPTY_PATIENTS_MAP;
  });

  const list = useMemo(() => {
    const rows = Object.values(patientsMap);
    const t = q.toLowerCase().trim();
    if (!t) return rows;
    return rows.filter((p) => {
      const blob = [
        getPatientDisplayName(p),
        p.motif,
        p.tel,
        p.cin,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(t);
    });
  }, [patientsMap, q]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-0 sm:py-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          Salle d&apos;attente
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Liste des dossiers du profil actif. Touchez une ligne pour ouvrir la consultation.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="salle-search" className="sr-only">
            Rechercher une patiente
          </label>
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base opacity-40"
            aria-hidden
          >
            🔍
          </span>
          <input
            id="salle-search"
            type="search"
            placeholder="Rechercher (nom, motif, téléphone…)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none ring-[var(--teal)]/30 transition-shadow focus:ring-2"
          />
        </div>
        <Link
          href="/dossier?new=1"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-[var(--teal)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-0"
        >
          Nouvelle patiente
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/80 p-10 text-center text-sm text-[var(--muted)]">
          {Object.keys(patientsMap).length === 0
            ? "Aucun dossier pour ce profil. Créez une patiente ou importez vos flux plus tard."
            : "Aucun résultat pour cette recherche."}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => {
            const age = patientAgeYears(p.ddn);
            const spec = p.specialite
              ? SPECIALTY_LABELS[p.specialite as Specialty] ?? p.specialite
              : "—";
            return (
              <li key={p.id}>
                <Link
                  href={`/dossier?patient=${encodeURIComponent(p.id)}`}
                  className="flex min-h-[56px] flex-col gap-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--teal)]/40 hover:bg-[var(--teal-pale)]/30 sm:min-h-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-[var(--ink)]">
                      {getPatientDisplayName(p)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {spec}
                      {age != null ? ` · ${age} ans` : ""}
                      {p.motif ? ` · ${p.motif}` : ""}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--teal)] sm:shrink-0">
                    Ouvrir le dossier →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
