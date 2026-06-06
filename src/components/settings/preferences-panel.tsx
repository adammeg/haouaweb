"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Préférences locales (port v50 « Apparence » + « Sécurité ») :
 *   - Thème clair / sombre
 *   - Couleur d'accent (8 choix) appliquée globalement
 *   - Code PIN médecin (4 chiffres) verrouillant l'accès aux préférences
 *   - Mode secrétaire (masque les réglages sensibles)
 *
 * Persistance : localStorage `hawae-prefs-v1` (appliqué avant paint par le
 * script de boot dans le layout racine).
 */

const PREFS_KEY = "hawae-prefs-v1";

type Prefs = {
  theme: "light" | "dark";
  accent: string;
  pin: string;
  secretary: boolean;
};

const DEFAULT_PREFS: Prefs = {
  theme: "light",
  accent: "#007070",
  pin: "",
  secretary: false,
};

const ACCENTS: { value: string; label: string }[] = [
  { value: "#007070", label: "Teal" },
  { value: "#2563eb", label: "Bleu" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0ea5e9", label: "Ciel" },
  { value: "#16a34a", label: "Vert" },
  { value: "#9f1239", label: "Bordeaux" },
  { value: "#d97706", label: "Ambre" },
  { value: "#334155", label: "Anthracite" },
];

function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return { ...DEFAULT_PREFS, ...raw };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyPrefs(p: Prefs) {
  const r = document.documentElement;
  if (p.theme === "dark") r.setAttribute("data-theme", "dark");
  else r.removeAttribute("data-theme");
  if (p.accent) {
    r.style.setProperty("--teal", p.accent);
    r.style.setProperty("--color-teal", p.accent);
    r.style.setProperty("--teal-light", p.accent);
    r.style.setProperty("--accent", p.accent);
  }
}

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinDraft, setPinDraft] = useState("");

  useEffect(() => {
    const p = readPrefs();
    setPrefs(p);
    setUnlocked(!p.pin);
    setMounted(true);
  }, []);

  const persist = useCallback((next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
    applyPrefs(next);
  }, []);

  if (!mounted) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] sm:col-span-2">
        <p className="text-sm text-[var(--muted)]">Chargement des préférences…</p>
      </section>
    );
  }

  if (!unlocked) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] sm:col-span-2">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          🔐 Préférences verrouillées
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Saisissez le code PIN médecin pour accéder aux réglages.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            inputMode="numeric"
            maxLength={4}
            value={pinEntry}
            onChange={(e) => {
              setPinEntry(e.target.value.replace(/\D/g, ""));
              setPinError(false);
            }}
            className="w-28 rounded-xl border border-[var(--border)] px-3 py-2 text-center text-lg tracking-[0.4em]"
            placeholder="••••"
          />
          <button
            type="button"
            onClick={() => {
              if (pinEntry === prefs.pin) {
                setUnlocked(true);
                setPinEntry("");
              } else {
                setPinError(true);
              }
            }}
            className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
          >
            Déverrouiller
          </button>
        </div>
        {pinError ? (
          <p className="mt-2 text-sm text-red-600">Code PIN incorrect.</p>
        ) : null}
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          Apparence
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Thème et couleur d&apos;accent appliqués à toute l&apos;application.
        </p>

        <div className="mt-4">
          <span className="text-xs font-semibold text-[var(--muted)]">Thème</span>
          <div className="mt-2 flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => persist({ ...prefs, theme: t })}
                className={
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors " +
                  (prefs.theme === t
                    ? "border-[var(--teal)] bg-[var(--teal-pale)] text-[var(--teal)]"
                    : "border-[var(--border)] bg-white text-[var(--ink-mid)]")
                }
              >
                {t === "light" ? "☀️ Clair" : "🌙 Sombre"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="text-xs font-semibold text-[var(--muted)]">
            Couleur d&apos;accent
          </span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => persist({ ...prefs, accent: c.value })}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={
                    "h-9 w-9 rounded-xl border-2 shadow-sm transition-transform " +
                    (prefs.accent === c.value
                      ? "border-[var(--ink)] scale-105"
                      : "border-transparent")
                  }
                  style={{ background: c.value }}
                />
                <span className="text-[10px] font-semibold text-[var(--muted)]">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)]">
        <h2 className="font-display text-base font-bold text-[var(--ink)]">
          Sécurité
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Code PIN local et mode secrétaire.
        </p>

        <div className="mt-4">
          <span className="text-xs font-semibold text-[var(--muted)]">
            Code PIN médecin (4 chiffres)
          </span>
          {prefs.pin ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-lg bg-[var(--teal-pale)] px-3 py-1.5 text-sm font-semibold text-[var(--teal)]">
                🔒 PIN actif
              </span>
              <button
                type="button"
                onClick={() => persist({ ...prefs, pin: "" })}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-mid)]"
              >
                Désactiver
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                inputMode="numeric"
                maxLength={4}
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ""))}
                className="w-28 rounded-xl border border-[var(--border)] px-3 py-2 text-center text-lg tracking-[0.4em]"
                placeholder="••••"
              />
              <button
                type="button"
                disabled={pinDraft.length !== 4}
                onClick={() => {
                  persist({ ...prefs, pin: pinDraft });
                  setPinDraft("");
                }}
                className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Définir le PIN
              </button>
            </div>
          )}
        </div>

        <label className="mt-5 flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">
              Mode secrétaire
            </span>
            <span className="block text-xs text-[var(--muted)]">
              Masque les sections sensibles (préférences, contribution IA).
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.secretary}
            onClick={() => persist({ ...prefs, secretary: !prefs.secretary })}
            className={
              "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
              (prefs.secretary ? "bg-[var(--teal)]" : "bg-[var(--border)]")
            }
          >
            <span
              className={
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
                (prefs.secretary ? "left-0.5 translate-x-5" : "left-0.5")
              }
            />
          </button>
        </label>
      </section>
    </>
  );
}
