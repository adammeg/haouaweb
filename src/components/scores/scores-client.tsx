"use client";

import { useState } from "react";
import {
  SCORE_GROUP_LABELS,
  SCORE_TABS,
  type ScoreGroup,
} from "./score-tabs";

export function ScoresClient() {
  const [active, setActive] = useState<string>(SCORE_TABS[0]!.id);
  const tab = SCORE_TABS.find((t) => t.id === active) ?? SCORE_TABS[0]!;

  return (
    <div className="space-y-6 py-4">
      <header className="border-b border-[var(--border)] pb-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--teal-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
          Scores cliniques
        </span>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Outils d&apos;aide à la décision
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ink-mid)]">
          19 scores cliniques en obstétrique, gynécologie, ménopause et classifications
          FIGO oncologiques — parité HawaeMD v51.
        </p>
      </header>

      <nav
        aria-label="Catégories de scores"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-xs)] sm:p-4"
      >
        {(Object.keys(SCORE_GROUP_LABELS) as ScoreGroup[]).map((g) => {
          const items = SCORE_TABS.filter((t) => t.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[110px] text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                {SCORE_GROUP_LABELS[g]}
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {items.map((t) => {
                  const isActive = t.id === active;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActive(t.id)}
                      aria-pressed={isActive}
                      className={`score-tab ${isActive ? "active" : ""}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div>{tab.render()}</div>
    </div>
  );
}
