"use client";

import { useState } from "react";
import {
  FIGO_COLORS,
  FIGO_DATA,
  FIGO_LABELS,
  figoRoman,
  type FigoType,
} from "@/lib/scores";

export function FigoScore({ type }: { type: FigoType }) {
  const stages = Object.keys(FIGO_DATA[type]);
  const [stade, setStade] = useState<string>("");
  const info = stade ? FIGO_DATA[type][stade] : null;
  const roman = stade ? figoRoman(stade) : "I";
  const color = info ? FIGO_COLORS[roman] : null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-[var(--ink)]">
          🔬 Classification FIGO — {FIGO_LABELS[type]}
        </h2>
        <span className="rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Cancer {FIGO_LABELS[type].toLowerCase()}
        </span>
      </header>

      <label className="mb-4 flex flex-col gap-1.5 sm:max-w-md">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mid)]">
          Stade FIGO
        </span>
        <select
          value={stade}
          onChange={(e) => setStade(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)]"
        >
          <option value="">— Sélectionner un stade —</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              Stade {s}
            </option>
          ))}
        </select>
      </label>

      {info && color ? (
        <div
          className="rounded-xl border p-4"
          style={{ background: color.bg, borderColor: color.border }}
        >
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-extrabold uppercase text-white"
              style={{ background: color.text }}
            >
              Stade {stade}
            </span>
          </div>
          <Section title="📋 Définition" color={color.text}>
            {info.desc}
          </Section>
          <Section title="📈 Survie à 5 ans" color={color.text} highlight>
            {info.surv5}
          </Section>
          <Section title="💊 Prise en charge" color={color.text}>
            {info.pec}
          </Section>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-4 text-center text-xs italic text-[var(--muted)]">
          Sélectionnez un stade FIGO pour afficher la définition et la conduite à
          tenir.
        </p>
      )}
    </section>
  );
}

function Section({
  title,
  color,
  highlight,
  children,
}: {
  title: string;
  color: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div
        className="mb-1 text-[12px] font-bold text-[var(--ink)]"
        style={highlight ? undefined : undefined}
      >
        {title}
      </div>
      <div
        className={
          highlight
            ? "text-base font-extrabold"
            : "text-sm leading-relaxed text-[var(--ink-mid)]"
        }
        style={highlight ? { color } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
