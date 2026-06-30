"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadMedicamentsVei } from "@/lib/medicaments/load";
import { extractDoseFromNom, shortNomCommercial } from "@/lib/medicaments/normalize";
import { searchMedicaments } from "@/lib/medicaments/search";
import type { MedicamentVei } from "@/lib/medicaments/types";

export type MedicamentPick = {
  dci: string;
  dose: string;
  cat?: string;
  code?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPick: (pick: MedicamentPick) => void;
  placeholder?: string;
  className?: string;
  /** Afficher dropdown même sans focus si value court */
  autoFocus?: boolean;
};

export function MedicamentSearchInput({
  value,
  onChange,
  onPick,
  placeholder = "Rechercher médicament…",
  className = "",
  autoFocus,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<ReturnType<typeof searchMedicaments>>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    loadMedicamentsVei().then(() => setReady(true));
  }, []);

  const runSearch = useCallback(
    (q: string) => {
      if (!ready || q.trim().length < 2) {
        setHits([]);
        return;
      }
      import("@/lib/medicaments/load").then(({ getMedicamentsCache }) => {
        const list = getMedicamentsCache();
        if (!list) return;
        setHits(searchMedicaments(q, list, 15));
        setActiveIdx(0);
      });
    },
    [ready],
  );

  useEffect(() => {
    const t = setTimeout(() => runSearch(value), 120);
    return () => clearTimeout(t);
  }, [value, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(med: MedicamentVei) {
    const dose = extractDoseFromNom(med.nom);
    const label = med.dci
      ? `${shortNomCommercial(med.nom)} (${med.dci})`
      : med.nom;
    onChange(label);
    onPick({
      dci: label,
      dose,
      cat: med.categorie || undefined,
      code: med.code,
    });
    setOpen(false);
    setHits([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits[activeIdx]) {
      e.preventDefault();
      pick(hits[activeIdx]!.med);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && value.trim().length >= 2 && hits.length > 0;

  return (
    <div ref={wrapRef} className={"relative " + className}>
      <input
        type="text"
        className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {!ready ? (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
          …
        </span>
      ) : null}

      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
        >
          {hits.map((h, i) => (
            <li key={h.med.code + "-" + i} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                className={
                  "block w-full px-3 py-2 text-left text-xs transition " +
                  (i === activeIdx
                    ? "bg-[var(--teal-pale)]"
                    : "hover:bg-[var(--cream)]")
                }
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => pick(h.med)}
              >
                <span className="font-semibold text-[var(--ink)]">
                  {highlightMatch(h.med.nom, value)}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                  {h.med.dci}
                  {h.med.categorie ? ` · Classe ${h.med.categorie}` : ""}
                  {h.med.ap === "O" ? " · Rx" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && ready && value.trim().length >= 2 && hits.length === 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[10px] text-[var(--muted)] shadow">
          Aucun médicament — liste VEI 3244 réf.
        </div>
      ) : null}
    </div>
  );
}

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const nText = norm(text);
  const nQ = norm(query.trim());
  const idx = nText.indexOf(nQ);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[var(--teal-pale)] px-0.5 font-bold text-[var(--teal)]">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}
