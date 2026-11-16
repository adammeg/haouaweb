import type { PatientSnapshot } from "@/types/domain";
import { quickChatHistory } from "@/lib/ia/quick-chat";

/** The server loads this from the authorized saved patient, never from client-supplied turns. */
export function patientConversationHistory(patient: PatientSnapshot, revision: string) {
  const exchanges = patient.hawaeIaHistory ?? [];
  const current = [];
  for (let i = exchanges.length - 1; i >= 0; i--) {
    const exchange = exchanges[i];
    if (exchange.revision !== revision) break;
    if (exchange.mode === "question" && exchange.question?.trim() && exchange.reply?.trim()) current.unshift(exchange);
    if (current.length === 4) break;
  }
  return quickChatHistory(current.flatMap((entry) => [
    { role: "user" as const, text: entry.question!, status: "complete" as const },
    { role: "assistant" as const, text: entry.reply, status: "complete" as const },
  ]));
}
