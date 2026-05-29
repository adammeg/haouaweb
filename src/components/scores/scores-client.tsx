"use client";

import { useState } from "react";
import { BishopScore } from "./bishop-score";
import { ManningScore } from "./manning-score";
import { ApgarScore } from "./apgar-score";
import { MFMUScore } from "./mfmu-score";
import { FlammScore } from "./flamm-score";
import { HPPScore } from "./hpp-score";
import { RASRMScore } from "./rasrm-score";
import { GreeneScore, KuppermanScore } from "./menopause-scores";
import { FigoScore } from "./figo-score";
import { BreastCancerScore } from "./breast-cancer-score";
import { RCIUScore } from "./rciu-score";
import { ROMAScore } from "./roma-score";
import { ADNEXScore } from "./adnex-score";

type Group = "obst" | "gyn" | "menop" | "figo";

type Tab = {
  id: string;
  label: string;
  group: Group;
  render: () => React.ReactElement;
};

const TABS: Tab[] = [
  { id: "mfmu", label: "🏥 MFMU AVAC", group: "obst", render: () => <MFMUScore /> },
  { id: "flamm", label: "🟢 Flamm & Geiger", group: "obst", render: () => <FlammScore /> },
  { id: "bishop", label: "🔵 Bishop", group: "obst", render: () => <BishopScore /> },
  { id: "manning", label: "👶 Manning", group: "obst", render: () => <ManningScore /> },
  { id: "apgar", label: "⭐ Apgar", group: "obst", render: () => <ApgarScore /> },
  { id: "hpp", label: "🩸 Risque HPP", group: "obst", render: () => <HPPScore /> },
  { id: "rciu", label: "📈 Croissance fœtale", group: "obst", render: () => <RCIUScore /> },
  { id: "rasrm", label: "🟣 rASRM", group: "gyn", render: () => <RASRMScore /> },
  { id: "roma", label: "🔬 ROMA", group: "gyn", render: () => <ROMAScore /> },
  { id: "adnex", label: "🧪 ADNEX", group: "gyn", render: () => <ADNEXScore /> },
  { id: "greene", label: "🌸 Greene", group: "menop", render: () => <GreeneScore /> },
  { id: "kupperman", label: "💗 Kupperman", group: "menop", render: () => <KuppermanScore /> },
  { id: "figo-col", label: "Col utérin", group: "figo", render: () => <FigoScore type="col" /> },
  { id: "figo-endo", label: "Endomètre", group: "figo", render: () => <FigoScore type="endo" /> },
  { id: "figo-ovaire", label: "Ovaire", group: "figo", render: () => <FigoScore type="ovaire" /> },
  { id: "sein", label: "🎗️ Cancer du sein", group: "figo", render: () => <BreastCancerScore /> },
];

const GROUP_LABELS: Record<Group, string> = {
  obst: "Obstétrique",
  gyn: "Gynécologie",
  menop: "Ménopause",
  figo: "FIGO oncologie",
};

export function ScoresClient() {
  const [active, setActive] = useState<string>(TABS[0]!.id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0]!;

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
          Scores cliniques en obstétrique, gynécologie, ménopause et classifications
          FIGO oncologiques. Les calculs sont reproduits fidèlement du référentiel
          v50 et restent à l&apos;appui du jugement médical — ne remplacent jamais
          une décision clinique.
        </p>
      </header>

      <nav
        aria-label="Catégories de scores"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-xs)] sm:p-4"
      >
        {(Object.keys(GROUP_LABELS) as Group[]).map((g) => {
          const items = TABS.filter((t) => t.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[110px] text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                {GROUP_LABELS[g]}
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
