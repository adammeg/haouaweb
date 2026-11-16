export const WAKE_PHRASE = "bonjour assist";
export const MAX_VOICE_CHARACTERS = 2000;

export function normalizeVoiceText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[’']/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** A prefix, never a substring: ordinary consultation speech must not activate Hawae. */
export function wakeRequest(text: string): string | null {
  const match = /^\s*bonjour[\s,;:!?.]+assiste?\b[\s,;:!?.-]*/i.exec(text);
  return match ? text.slice(match[0].length).trim() : null;
}

export type VoiceTab = "anamnese" | "examen" | "bilans" | "scores" | "hawae" | "docs";
export type DictationField = "motif" | "symptomes" | "atcdMed";
export const DICTATION_LABELS: Record<DictationField, string> = {
  motif: "Motif de consultation", symptomes: "Symptômes", atcdMed: "Antécédents médicaux",
};
export type VoiceCommand =
  | { type: "navigate"; href: "/agenda" | "/dossier" | "/salle-attente" | "/dashboard" }
  | { type: "tab"; tab: VoiceTab }
  | { type: "stop" }
  | { type: "summary" }
  | { type: "dictate"; field: DictationField; value: string }
  | { type: "unsupported" };

export function parseVoiceCommand(raw: string): VoiceCommand {
  if (!raw.trim() || raw.length > MAX_VOICE_CHARACTERS) return { type: "unsupported" };
  const text = normalizeVoiceText(raw);
  if (/^(arrete de parler|stop|silence)$/.test(text)) return { type: "stop" };
  if (/^(resume le dossier|fais un resume du dossier)$/.test(text)) return { type: "summary" };
  const navigate = /^(?:ouvre|affiche) (?:l |le |la )?(agenda|dossier|salle d attente|tableau de bord)$/.exec(text);
  if (navigate) {
    const routes = { agenda: "/agenda", dossier: "/dossier", "salle d attente": "/salle-attente", "tableau de bord": "/dashboard" } as const;
    return { type: "navigate", href: routes[navigate[1] as keyof typeof routes] };
  }
  const tab = /^(?:ouvre|affiche) (?:l |le |la |les )?(anamnese|examen clinique|bilans|scores|hawae|haoua|documents)$/.exec(text);
  if (tab) {
    const tabs = { anamnese: "anamnese", "examen clinique": "examen", bilans: "bilans", scores: "scores", hawae: "hawae", haoua: "hawae", documents: "docs" } as const;
    return { type: "tab", tab: tabs[tab[1] as keyof typeof tabs] };
  }
  // Parse the command prefix separately to preserve punctuation, case and negation in the dictated value.
  const dictation = /^\s*ajoute\s+(?:aux?\s+|au\s+)?(sympt[oô]mes|motif|ant[eé]c[eé]dents(?:\s+m[eé]dicaux)?)(?:\s*[:;,]\s*|\s+)([\s\S]+)$/i.exec(raw);
  if (dictation && dictation[2].trim()) {
    const field = normalizeVoiceText(dictation[1]);
    return { type: "dictate", field: field === "motif" ? "motif" : field === "symptomes" ? "symptomes" : "atcdMed", value: dictation[2].trim() };
  }
  return { type: "unsupported" };
}
