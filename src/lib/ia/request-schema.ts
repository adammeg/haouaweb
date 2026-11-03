import { parseChatHistory, type ChatHistoryTurn } from "./quick-chat";
export type AiRequestBody = { mode: "diagnostic" | "question" | "chat"; question: string; patientId?: string; expectedRevision?: string; stream: boolean; history: ChatHistoryTurn[] };
export function parseAiRequest(value: unknown): AiRequestBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Objet JSON attendu");
  const body = value as Record<string, unknown>;
  if (body.mode != null && body.mode !== "diagnostic" && body.mode !== "question" && body.mode !== "chat") throw new Error("Mode invalide");
  if (body.question != null && typeof body.question !== "string") throw new Error("Question invalide");
  if (body.patientId != null && (typeof body.patientId !== "string" || !body.patientId.trim() || body.patientId.length > 160)) throw new Error("Dossier invalide");
  if (body.stream != null && typeof body.stream !== "boolean") throw new Error("Option de flux invalide");
  const mode = body.mode === "diagnostic" ? "diagnostic" : body.mode === "chat" ? "chat" : "question";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : undefined;
  if (question.length > 4000 || (mode !== "diagnostic" && !question)) throw new Error("Question vide ou trop longue (4000 caractères maximum)");
  if (mode === "diagnostic" && !patientId) throw new Error("Dossier requis pour l'analyse");
  if (mode === "chat" && (patientId || body.expectedRevision != null)) throw new Error("La discussion rapide utilise uniquement vos messages, sans dossier patient");
  if (mode !== "chat" && body.history != null) throw new Error("Historique réservé à la discussion rapide");
  const history = mode === "chat" ? parseChatHistory(body.history) : [];
  if (patientId && (typeof body.expectedRevision !== "string" || !/^[a-f0-9]{64}$/.test(body.expectedRevision))) throw new Error("Révision enregistrée du dossier requise");
  return { mode, question, patientId, expectedRevision: typeof body.expectedRevision === "string" ? body.expectedRevision : undefined, stream: body.stream !== false, history };
}

export function boundedNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  const value = raw?.trim() ? Number(raw) : NaN;
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}
