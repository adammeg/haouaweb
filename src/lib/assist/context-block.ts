import type { AssistRunResult } from "./types";

/** Bloc texte pour le prompt IA (équivalent _hawaeAssistHarnessBlock HTML). */
export function buildAssistContextBlock(result: AssistRunResult | null): string {
  if (!result || !result.executed.length) {
    return "--- Hawae Assist : aucune analyse récente — lancer l'analyse clinique ---";
  }
  const lines: string[] = [
    "--- Hawae Assist Engine v2.2 — Scores calculés ---",
    result.report.summary,
  ];
  if (result.alerts.length) {
    lines.push("\nAlertes :");
    result.alerts.forEach((a) => {
      lines.push(`• ${a.score_name}: ${a.interpretation}`);
      if (a.recommended_actions[0]) {
        lines.push(`  → ${a.recommended_actions[0]}`);
      }
    });
  }
  result.executed.forEach((s) => {
    lines.push(
      `[${s.score_name}] ${s.value} — ${s.risk_level} — ${s.interpretation}`,
    );
  });
  if (result.contradictions.length) {
    lines.push("\nContradictions :");
    result.contradictions.forEach((c) => lines.push(`⚡ ${c.message}`));
  }
  return lines.join("\n");
}
