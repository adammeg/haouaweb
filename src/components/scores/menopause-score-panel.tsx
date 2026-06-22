"use client";

import { useState } from "react";
import { GreeneScore, KuppermanScore } from "./menopause-scores";

export function MenopauseScorePanel() {
  const [sub, setSub] = useState<"greene" | "kupperman">("greene");

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`score-tab ${sub === "greene" ? "active" : ""}`}
          onClick={() => setSub("greene")}
        >
          Greene Climacteric Scale
        </button>
        <button
          type="button"
          className={`score-tab ${sub === "kupperman" ? "active" : ""}`}
          onClick={() => setSub("kupperman")}
        >
          Index de Kupperman
        </button>
      </nav>
      {sub === "greene" ? <GreeneScore /> : <KuppermanScore />}
    </div>
  );
}
