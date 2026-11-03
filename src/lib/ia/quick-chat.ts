export type ChatHistoryTurn = { role: "user" | "assistant"; content: string };
export const CHAT_HISTORY_LIMIT = 8;
export const CHAT_HISTORY_CHARACTERS = 8000;

/** Only complete user/assistant pairs become model history; failures aren't assistant facts. */
export function quickChatHistory(messages: { role: "user" | "assistant"; text: string; status: "complete" | "pending" | "cancelled" | "error" }[]): ChatHistoryTurn[] {
  const history: ChatHistoryTurn[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const user = messages[i], assistant = messages[i + 1];
    if (user.role !== "user" || assistant.role !== "assistant" || user.status !== "complete" || assistant.status !== "complete" || !assistant.text.trim()) continue;
    history.push({ role: "user", content: user.text.slice(0, 3000) }, { role: "assistant", content: assistant.text.slice(0, 3000) });
    i++;
    while (history.length > CHAT_HISTORY_LIMIT || history.reduce((n, turn) => n + turn.content.length, 0) > CHAT_HISTORY_CHARACTERS) history.splice(0, 2);
  }
  return history;
}

export function parseChatHistory(value: unknown): ChatHistoryTurn[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > CHAT_HISTORY_LIMIT || value.length % 2 !== 0) throw new Error("Historique de discussion invalide");
  let characters = 0;
  const result = value.map((turn, i): ChatHistoryTurn => {
    if (!turn || typeof turn !== "object" || Array.isArray(turn) || turn.role !== (i % 2 === 0 ? "user" : "assistant") || typeof turn.content !== "string" || !turn.content.trim() || turn.content.length > 3000) throw new Error("Message d'historique invalide");
    characters += turn.content.length;
    return { role: turn.role, content: turn.content.trim() };
  });
  if (characters > CHAT_HISTORY_CHARACTERS) throw new Error("Historique trop long");
  return result;
}
