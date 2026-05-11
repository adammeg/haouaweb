/**
 * Résout la clé, l’URL et le modèle pour /api/ia.
 * Priorité : OpenRouter (`OPENROUTER_API_KEY`), sinon OpenAI direct (`OPENAI_API_KEY`).
 */

export type IaProviderConfig = {
  label: "openrouter" | "openai";
  apiKey: string;
  chatCompletionsUrl: string;
  headers: Record<string, string>;
  model: string;
};

function trimEnv(name: string): string | undefined {
  const v = process.env[name];
  return v?.trim() || undefined;
}

export function resolveIaProvider(): IaProviderConfig | null {
  const openrouterKey = trimEnv("OPENROUTER_API_KEY");
  if (openrouterKey) {
    const base = (
      trimEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1"
    ).replace(/\/$/, "");
    const referer =
      trimEnv("OPENROUTER_HTTP_REFERER") || "http://localhost:3000";
    const title = trimEnv("OPENROUTER_APP_TITLE") || "HawaeMD";
    const model =
      trimEnv("OPENROUTER_MODEL") ||
      trimEnv("IA_MODEL") ||
      "openai/gpt-4o-mini";

    return {
      label: "openrouter",
      apiKey: openrouterKey,
      chatCompletionsUrl: `${base}/chat/completions`,
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": title,
      },
      model,
    };
  }

  const openaiKey = trimEnv("OPENAI_API_KEY");
  if (openaiKey) {
    const model =
      trimEnv("OPENAI_MODEL") || trimEnv("IA_MODEL") || "gpt-4o-mini";
    return {
      label: "openai",
      apiKey: openaiKey,
      chatCompletionsUrl: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      model,
    };
  }

  return null;
}
