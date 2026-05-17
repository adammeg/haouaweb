"use client";

import type { IvfAnalysis } from "@/lib/pma/ivf-types";

const RESPONSE_COLORS: Record<string, string> = {
  Poor: "#dc2626",
  Suboptimal: "#d97706",
  Normal: "#16a34a",
  Hyper: "#7c3aed",
};

function responseColor(type: string): string {
  const key = Object.keys(RESPONSE_COLORS).find((k) => type.includes(k));
  return key ? RESPONSE_COLORS[key]! : "#374151";
}

export function PmaAnalysisPanel({ analysis }: { analysis: IvfAnalysis }) {
  const a = analysis;
  const rc = responseColor(a.response.responseType);

  return (
    <>
      <div className="pma-summary-strip">
        <div className="pma-summary-item">
          <div className="pma-summary-label">Groupe POSEIDON</div>
          <div className="pma-summary-val">G{a.poseidon.group}</div>
          <div className="pma-summary-sub">
            {a.poseidon.subgroup ? "Sous-groupe " + a.poseidon.subgroup : "—"}
          </div>
        </div>
        <div className="pma-summary-item">
          <div className="pma-summary-label">Bologne</div>
          <div className="pma-summary-val" style={{ fontSize: "1rem" }}>
            {a.bologna.positive ? "✅ POR" : "❌ Non-POR"}
          </div>
          <div className="pma-summary-sub">{a.bologna.criteria}/3 critères</div>
        </div>
        <div className="pma-summary-item">
          <div className="pma-summary-label">Ovocytes attendus</div>
          <div className="pma-summary-val">
            {a.response.expectedOocytes != null
              ? "~" + a.response.expectedOocytes
              : "?"}
          </div>
          <div className="pma-summary-sub">par ponction</div>
        </div>
        <div className="pma-summary-item">
          <div className="pma-summary-label">Risque OHSS</div>
          <div className="pma-summary-val" style={{ fontSize: "0.85rem" }}>
            <span className={"pma-ohss-badge " + a.ohss.level}>
              {a.ohss.label}
            </span>
          </div>
          <div className="pma-summary-sub">Score {a.ohss.score}/12</div>
        </div>
      </div>

      <div className="pma-analysis-layout">
        <div>
          <div className="pma-poseidon-card">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider opacity-70 mb-1.5">
              Classification POSEIDON 2016
            </p>
            <div className="pma-poseidon-group">G{a.poseidon.group}</div>
            <p className="pma-poseidon-label">{a.poseidon.desc}</p>
            <p className="pma-poseidon-desc">
              {a.poseidon.lowReserve
                ? "🔴 Réserve diminuée"
                : "🟢 Réserve adéquate"}
              <br />
              {a.poseidon.poorPrevResponse
                ? "🔴 Mauvaise réponse antérieure"
                : a.poseidon.group <= 2
                  ? "🟢 Bonne réponse prédite"
                  : "—"}
            </p>
            <div
              className={
                "pma-bologna-badge " + (a.bologna.positive ? "pos" : "neg")
              }
            >
              {a.bologna.positive
                ? "🔴 POR confirmée (Bologne +)"
                : "🟢 Non-POR (Bologne négatif)"}
            </div>
            {a.bologna.details.length > 0 ? (
              <p className="mt-2 text-[0.65rem] opacity-65 leading-relaxed">
                {a.bologna.details.join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="pma-response-card">
            <div className="pma-hawae-label">Type de réponse ovarienne</div>
            <div className="pma-response-type" style={{ color: rc }}>
              {a.response.responseType}
            </div>
            {a.response.prognosis != null ? (
              <>
                <div className="pma-hawae-label mt-2.5">Pronostic par cycle</div>
                <div className="pma-prognosis-bar">
                  <div
                    className="pma-prognosis-fill"
                    style={{ width: a.response.prognosis + "%" }}
                  />
                </div>
                <p className="pma-prognosis-label">
                  ~{a.response.prognosis}% de succès estimé
                </p>
              </>
            ) : null}
            {a.ohss.factors.length > 0 ? (
              <div className="mt-2.5">
                <div className="pma-hawae-label">Facteurs OHSS</div>
                <p className="text-[0.7rem] text-[var(--ink-mid)] leading-relaxed">
                  {a.ohss.factors.join(" · ")}
                </p>
                <p className="text-[0.7rem] font-bold text-[var(--teal)] mt-1">
                  {a.ohss.strategy}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="pma-explanation-card">
            <div className="pma-hawae-label">
              🤖 Raisonnement clinique — IVF Engine
            </div>
            <p className="pma-explanation-text">{a.explanation}</p>
          </div>
          <div className="pma-disclaimer">
            ⚠️ Aide à la décision médicale uniquement — Validation médicale
            requise avant toute prescription.
          </div>
        </div>
      </div>
    </>
  );
}

