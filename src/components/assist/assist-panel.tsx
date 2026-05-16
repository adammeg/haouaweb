"use client";

import type { AssistRunResult, RiskLevel, ScoreOutput } from "@/lib/assist";

const RISK_STYLES: Record<
  RiskLevel,
  { bg: string; border: string; text: string; icon: string }
> = {
  low: { bg: "#F0FDF4", border: "#86EFAC", text: "#166534", icon: "🟢" },
  intermediate: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", icon: "🟡" },
  high: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", icon: "🔴" },
  critical: { bg: "#F5F3FF", border: "#C4B5FD", text: "#4C1D95", icon: "⛔" },
  unknown: { bg: "#F9FAFB", border: "#E5E7EB", text: "#6B7280", icon: "⚪" },
};

function ScoreCard({ s }: { s: ScoreOutput }) {
  const st = RISK_STYLES[s.risk_level] ?? RISK_STYLES.unknown;
  return (
    <details className="group overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[var(--surface-raised)] px-4 py-3 hover:bg-[var(--cream)]">
        <div>
          <div className="text-sm font-bold text-[var(--ink)]">
            {s.score_name.replace(/_/g, " ")}
          </div>
          <div className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">
            {s.interpretation}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--ink)]">
            {String(s.value ?? "—").slice(0, 28)}
          </span>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: st.bg,
              borderColor: st.border,
              color: st.text,
            }}
          >
            {st.icon} {s.risk_level}
          </span>
        </div>
      </summary>
      <div className="border-t border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--ink-mid)]">{s.interpretation}</p>
        {s.recommended_actions.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {s.recommended_actions.map((a, i) => (
              <li
                key={i}
                className="flex gap-2 border-b border-[var(--border)]/60 pb-1.5 text-xs text-[var(--ink-mid)] last:border-0"
              >
                <span className="font-bold text-[var(--teal)]">→</span>
                {a}
              </li>
            ))}
          </ul>
        )}
        {s.disclaimer ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">
            ⚠️ {s.disclaimer}
          </p>
        ) : null}
      </div>
    </details>
  );
}

export function AssistPanel({
  result,
  emptyMessage = "Cliquez sur Analyser pour lancer Hawae Assist (16 scores cliniques).",
}: {
  result: AssistRunResult | null;
  emptyMessage?: string;
}) {
  if (!result || !result.executed.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--teal-pale)]/30 px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--ink-mid)]">{emptyMessage}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          FMF T21/PE · FGR · ROMA · POSEIDON · VTE · GDM · miniPIERS…
        </p>
      </div>
    );
  }

  const meta = result.meta_risk;
  const st = RISK_STYLES[meta.overall] ?? RISK_STYLES.unknown;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border-2 px-4 py-3"
        style={{ background: st.bg, borderColor: st.border }}
      >
        <p className="text-base font-bold" style={{ color: st.text }}>
          {result.report.summary}
        </p>
        <p className="mt-1 text-xs opacity-80" style={{ color: st.text }}>
          {result.executed.length} score(s) · {result.alerts.length} alerte(s) ·{" "}
          {result.questions_needed.length} question(s)
        </p>
      </div>

      {result.alerts.map((a) => {
        const ast = RISK_STYLES[a.risk_level];
        return (
          <div
            key={a.score_name}
            className="flex gap-3 rounded-xl border px-4 py-3"
            style={{ background: ast.bg, borderColor: ast.border }}
          >
            <span className="text-lg">{ast.icon}</span>
            <div>
              <p
                className="text-[11px] font-bold uppercase"
                style={{ color: ast.text }}
              >
                {a.score_name}
              </p>
              <p className="text-sm" style={{ color: ast.text }}>
                {a.interpretation}
              </p>
            </div>
          </div>
        );
      })}

      {result.contradictions.map((c) => (
        <div
          key={c.rule_id}
          className="rounded-xl border-l-[3px] px-4 py-3 text-sm"
          style={{
            borderColor:
              c.severity === "error"
                ? "#991B1B"
                : c.severity === "warning"
                  ? "#D97706"
                  : "#1E40AF",
            background:
              c.severity === "error"
                ? "#FEF2F2"
                : c.severity === "warning"
                  ? "#FFFBEB"
                  : "#EFF6FF",
          }}
        >
          <p className="text-[11px] font-bold">⚡ {c.rule_id}</p>
          <p>{c.message}</p>
          <p className="mt-1 text-xs opacity-75">💡 {c.suggestion}</p>
        </div>
      ))}

      <div>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Scores calculés ({result.executed.length})
        </h3>
        <div className="space-y-2">
          {result.executed.map((s) => (
            <ScoreCard key={s.score_name} s={s} />
          ))}
        </div>
      </div>

      {result.questions_needed.length > 0 && (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Données manquantes
          </h3>
          <div className="space-y-2">
            {result.questions_needed.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
              >
                {q.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-[var(--muted)]">
        Hawae Assist Engine v2.2 — Aide à la décision uniquement
      </p>
    </div>
  );
}
