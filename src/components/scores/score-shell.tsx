"use client";

import type { ReactNode } from "react";
import {
  SCORE_LEVEL_BG,
  SCORE_LEVEL_COLORS,
  type ScoreResult,
} from "@/lib/scores";

/**
 * Squelette d'affichage d'un score : titre + description + form + résultat.
 * Reproduit le rendu v50 (carte avec barre de progression + bloc d'interprétation
 * coloré selon le niveau).
 */
export function ScoreShell({
  title,
  tag,
  description,
  children,
  result,
  resultIdSuffix,
}: {
  title: string;
  tag?: string;
  description?: string;
  children: ReactNode;
  result: ScoreResult | null;
  resultIdSuffix?: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-[var(--ink)]">
          {title}
        </h2>
        {tag ? (
          <span className="rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
            {tag}
          </span>
        ) : null}
      </header>
      {description ? (
        <p className="mb-4 text-sm leading-relaxed text-[var(--ink-mid)]">
          {description}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">{children}</div>
        <ScoreResultPanel result={result} idSuffix={resultIdSuffix} />
      </div>
    </section>
  );
}

export function ScoreResultPanel({
  result,
  idSuffix,
}: {
  result: ScoreResult | null;
  idSuffix?: string;
}) {
  if (!result) {
    return (
      <aside className="hawae-card flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-6 text-center text-xs italic text-[var(--muted)]">
        Renseignez les critères pour obtenir le score.
      </aside>
    );
  }
  const color = SCORE_LEVEL_COLORS[result.level];
  const bg = SCORE_LEVEL_BG[result.level];
  const pct =
    result.max > 0
      ? Math.max(0, Math.min(100, Math.round((result.raw / result.max) * 100)))
      : 0;
  return (
    <aside
      className="space-y-3 rounded-xl border p-4"
      style={{ background: bg, borderColor: color }}
      data-score-result={idSuffix ?? ""}
    >
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
        Résultat
      </div>
      <div className="text-2xl font-extrabold leading-tight" style={{ color }}>
        {result.value}
      </div>
      <div
        className="text-sm font-semibold leading-snug"
        style={{ color }}
      >
        {result.label}
      </div>
      {result.max > 0 ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      ) : null}
      <p
        className="text-xs leading-relaxed text-[var(--ink-mid)]"
        dangerouslySetInnerHTML={{ __html: result.interpretation }}
      />
      {result.details && result.details.length ? (
        <ul className="space-y-1 border-t border-white/50 pt-3 text-[11px] text-[var(--ink-mid)]">
          {result.details.map((d) => (
            <li key={d.label} className="flex items-center justify-between gap-2">
              <span className="font-semibold">{d.label}</span>
              <span className="tabular-nums" style={{ color }}>
                {d.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

/**
 * Wrapper standard pour un critère de score : <label> + <select>.
 */
export function ScoreCriterion({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)]/70 bg-[var(--surface-raised)]/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-[12px] font-semibold text-[var(--ink)]">
        {label}
        {hint ? (
          <span className="ml-1 text-[10px] font-medium text-[var(--muted)]">
            {hint}
          </span>
        ) : null}
      </span>
      <span className="shrink-0">{children}</span>
    </label>
  );
}

export function ScoreSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className={`w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-auto sm:min-w-[180px] ${className ?? ""}`}
    >
      {options.map((o) => (
        <option key={`${o.value}-${o.label}`} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ScoreInput({
  value,
  onChange,
  ...rest
}: {
  value: number;
  onChange: (v: number) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => {
        const next = parseFloat(e.target.value);
        onChange(Number.isFinite(next) ? next : 0);
      }}
      className="w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] sm:w-[180px]"
      {...rest}
    />
  );
}
