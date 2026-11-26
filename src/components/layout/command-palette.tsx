"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { EMPTY_PATIENTS_MAP } from "@/lib/empty-stable";
import { getPatientDisplayName, patientAgeYears } from "@/lib/patient-utils";
import { TOOL_GROUPS } from "@/components/layout/tools-nav-groups";

type Entry = { key: string; label: string; hint: string; search: string; run: () => void };

const PAGES = [
  { href: "/salle-attente", label: "Salle d'attente" },
  { href: "/agenda", label: "Agenda et rendez-vous" },
  { href: "/rappels", label: "Rappels" },
  { href: "/dossier", label: "Dossiers patientes" },
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/pma", label: "PMA / FIV" },
  { href: "/assist", label: "Hawae" },
];
const SECRETARY_PAGES = ["/salle-attente", "/agenda", "/rappels", "/settings"];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandPalette({
  open,
  onOpenChange,
  secretary,
  onNewPatient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretary: boolean;
  onNewPatient: () => void;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const patients = useHawaeStore((s) =>
    s.currentUserId ? (s.patientsByUser[s.currentUserId] ?? EMPTY_PATIENTS_MAP) : EMPTY_PATIENTS_MAP,
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Une fenêtre (ordonnance, compte rendu…) est déjà ouverte : ne pas la recouvrir.
        if (!document.querySelector('[role="dialog"][aria-modal="true"]')) onOpenChange(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setIndex(0);
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    if (!open) return [];
    const go = (href: string) => () => router.push(href);
    const people: Entry[] = secretary
      ? []
      : Object.values(patients)
          .sort((a, b) => (b.lastSaved ?? b.createdAt ?? "").localeCompare(a.lastSaved ?? a.createdAt ?? ""))
          .map((p) => {
            const age = patientAgeYears(p.ddn);
            return {
              key: p.id,
              label: getPatientDisplayName(p),
              hint: [age != null ? `${age} ans` : null, p.motif].filter(Boolean).join(", ") || "Dossier",
              search: norm([p.prenom, p.nom, p.prenom, p.cin, p.tel].filter(Boolean).join(" ")),
              run: () => {
                const s = useHawaeStore.getState();
                s.saveDraft();
                s.openPatient(p.id);
                router.push("/dossier");
              },
            };
          });
    const seen = new Set<string>();
    const pages: Entry[] = [
      ...PAGES,
      ...TOOL_GROUPS.flatMap((g) => g.items.map((i) => ({ href: i.href, label: i.label, sub: i.sub }))),
    ]
      .filter((i) => !seen.has(i.href) && seen.add(i.href))
      .filter((i) => !secretary || SECRETARY_PAGES.includes(i.href))
      .map((i) => ({
        key: i.href,
        label: i.label,
        hint: "Page",
        search: norm(`${i.label} ${"sub" in i ? (i.sub ?? "") : ""}`),
        run: go(i.href),
      }));
    const actions: Entry[] = secretary
      ? []
      : [{ key: "new", label: "Nouvelle patiente", hint: "Action", search: "nouvelle patiente creer dossier", run: onNewPatient }];
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [...people.slice(0, 5), ...actions, ...pages];
    const match = (e: Entry) => words.every((w) => e.search.includes(w));
    return [...people.filter(match).slice(0, 8), ...actions.filter(match), ...pages.filter(match)];
  }, [open, patients, query, router, secretary, onNewPatient]);

  const active = Math.min(index, Math.max(0, entries.length - 1));

  useEffect(() => {
    document.getElementById(`cmd-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(e?: Entry) {
    if (!e) return;
    onOpenChange(false);
    e.run();
  }

  return (
    <dialog
      ref={dialog}
      className="cmd"
      aria-label="Rechercher une patiente ou un outil"
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === dialog.current) onOpenChange(false);
      }}
    >
      <div className="cmd-box">
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-expanded
          aria-controls="cmd-list"
          aria-activedescendant={entries.length ? `cmd-${active}` : undefined}
          aria-label="Rechercher"
          placeholder={secretary ? "Rechercher une page" : "Nom, CIN, téléphone ou outil"}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const n = entries.length;
              if (n) setIndex((active + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(entries[active]);
            }
          }}
        />
        <ul id="cmd-list" role="listbox" aria-label="Résultats">
          {entries.map((e, i) => (
            <li
              key={e.key}
              id={`cmd-${i}`}
              role="option"
              aria-selected={i === active}
              onClick={() => choose(e)}
            >
              <span>{e.label}</span>
              <small>{e.hint}</small>
            </li>
          ))}
        </ul>
        {entries.length === 0 ? (
          <p className="cmd-empty">Aucun résultat. Essayez une partie du nom ou le CIN.</p>
        ) : null}
      </div>
    </dialog>
  );
}
