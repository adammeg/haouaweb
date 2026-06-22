"use client";

import { useState } from "react";
import { SCORE_TABS } from "./score-tabs";

/** Panneau scores intégré dans l'onglet Dossier — parité v51 */
export function DossierScoresTab() {
  const [active, setActive] = useState<string>(SCORE_TABS[0]!.id);
  const tab = SCORE_TABS.find((t) => t.id === active) ?? SCORE_TABS[0]!;

  return (
    <div className="space-y-4">
      <nav
        aria-label="Scores cliniques dossier"
        className="score-tabs flex flex-wrap gap-1.5 overflow-x-auto pb-1"
      >
        {SCORE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`score-tab whitespace-nowrap ${t.id === active ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div>{tab.render()}</div>
    </div>
  );
}
