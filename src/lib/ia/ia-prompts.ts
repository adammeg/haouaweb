/** Prompt système — questions complémentaires du médecin */
export const SYSTEM_PROMPT_QUESTION =
  "Tu es un assistant d'aide à la décision clinique pour gynécologie-obstétrique (français). " +
  "Réponds de façon structurée : synthèse courte, éléments utiles, red flags si pertinents. " +
  "Ne pose pas de diagnostic définitif ni de prescription dosée sans contexte complet. " +
  "Rappelle que la décision finale appartient au médecin et que le dossier peut être incomplet.";

/** Prompt système — analyse diagnostique automatique du dossier */
export const SYSTEM_PROMPT_DIAGNOSTIC =
  "Tu es un assistant senior en gynécologie-obstétrique (français), mode aide à la décision. " +
  "Tu t’appuies strictement sur le dossier fourni ; tu indiques clairement les lacunes d’information. " +
  "Tu restes prudent : hypothèses classées par probabilité, jamais de diagnostic définitif ni certitude abusive. " +
  "Pas de prescription dosée ; orientation générale et examens à discuter seulement.";

/**
 * Message utilisateur pour l’analyse diagnostique structurée (tout le dossier est déjà dans dossierBlock).
 */
export function buildDiagnosticUserContent(dossierBlock: string): string {
  const block =
    dossierBlock.trim() ||
    "Aucune donnée clinique saisie pour le moment (dossier vide ou minimal).";

  return (
    `Voici l’export structuré du dossier patient (tous les champs renseignés côté application). ` +
    `Appuie-toi sur ces informations ; signale explicitement ce qui manque pour affiner l’analyse.\n\n` +
    `[DOSSIER]\n${block}\n\n` +
    `---\n\n` +
    `Tâche : rédige une analyse d’aide à la décision pour le médecin prescripteur, en français, ` +
    `avec les sections suivantes (utilise des titres clairs) :\n\n` +
    `1) **Synthèse clinique** — faits saillants (concis).\n` +
    `2) **Hypothèses diagnostiques** — classe-les (ex. hautement probable / probable / à évoquer / moins probable) ` +
    `avec justification courte. Précise bien qu’il s’agit d’hypothèses, pas d’un diagnostic définitif.\n` +
    `3) **Signes d’alerte et urgences** — ce qui impose une orientation rapide ou une évaluation immédiate.\n` +
    `4) **Examens complémentaires et données manquantes** — quoi demander ou compléter selon le contexte.\n` +
    `5) **Orientation et suivi** — pistes de prise en charge ou surveillance sans posologie détaillée.\n\n` +
    `Termine par un rappel : la décision médicale relève du médecin ; les données peuvent être incomplètes.`
  );
}

export function buildQuestionUserContent(
  dossierBlock: string,
  question: string,
): string {
  return (
    `Dossier (extrait structuré) :\n${dossierBlock.trim() || "non fourni"}\n\n` +
    `Question du médecin :\n${question}`
  );
}
