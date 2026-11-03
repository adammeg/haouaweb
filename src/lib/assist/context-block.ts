import type { AssistRunResult } from "./types";

/** Bloc texte pour le prompt IA (équivalent _hawaeAssistHarnessBlock HTML). */
export function buildAssistContextBlock(result: AssistRunResult | null): string {
  if (!result || !result.executed.length) {
    return "--- Hawae Assist : aucune analyse récente — lancer l'analyse clinique ---";
  }
  const lines: string[] = [
    `--- Hawae Assist ${result.engine_version ?? "version inconnue"} — Évaluations locales ---`,
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
    lines.push(`Confiance: ${s.confidence}. ${s.disclaimer ?? ""}`);
    if (s.missing_inputs?.length) lines.push(`Entrées manquantes: ${s.missing_inputs.join(", ")}`);
  });
  if (result.contradictions.length) {
    lines.push("\nContradictions :");
    result.contradictions.forEach((c) => lines.push(`⚡ ${c.message}`));
  }
  if (result.questions_needed.length) lines.push("Questions à compléter:", ...result.questions_needed.map((q) => q.text));
  if (result.assessments) lines.push(`Couverture: ${result.assessments.filter((s) => s.status === "ok").length} calculs exploitables ; ${result.assessments.filter((s) => s.status === "incomplete" || s.status === "error").length} incomplets ou en échec.`);
  return lines.join("\n");
}
