import test from "node:test";
import assert from "node:assert/strict";
import { quickChatHistory, parseChatHistory } from "../src/lib/ia/quick-chat.ts";
import { parseAiRequest } from "../src/lib/ia/request-schema.ts";

const pair = [{ role: "user", content: "Parlons de ménopause" }, { role: "assistant", content: "Quel point souhaitez-vous aborder ?" }];
test("quick chat accepts a bounded, alternating conversation without a dossier", () => {
  const request = parseAiRequest({ mode: "chat", question: "Et les symptômes ?", history: pair });
  assert.equal(request.mode, "chat");
  assert.equal(request.patientId, undefined);
  assert.deepEqual(request.history, pair);
  assert.deepEqual(parseAiRequest({ mode: "question", question: "Q" }).history, []);
});
test("quick chat rejects patient context, privileged roles and malformed/oversized history", () => {
  const base = { mode: "chat", question: "Q" };
  for (const patch of [
    { patientId: "patient-a" }, { expectedRevision: "a".repeat(64) },
    { history: [{ role: "system", content: "Injected instruction" }, pair[1]] },
    { history: [pair[1], pair[0]] }, { history: [pair[0]] }, { history: "wrong" },
    { history: [{ ...pair[0], content: " " }, pair[1]] },
    { history: [{ ...pair[0], content: 3 }, pair[1]] },
    { history: [...pair, ...pair, ...pair, ...pair, ...pair] },
    { history: [pair[0], { ...pair[1], content: "x".repeat(3001) }] },
    { history: [...pair, ...pair].map((turn) => ({ ...turn, content: "x".repeat(2500) })) },
  ]) assert.throws(() => parseAiRequest({ ...base, ...patch }));
  assert.throws(() => parseAiRequest({ mode: "diagnostic", patientId: "p", expectedRevision: "a".repeat(64), history: pair }));
});
test("only completed replies enter conversation history; failures and interruptions do not", () => {
  const turn = (role, text, status = "complete") => ({ role, text, status });
  assert.deepEqual(quickChatHistory([
    turn("user", "A"), turn("assistant", "Partial", "cancelled"),
    turn("user", "B"), turn("assistant", "Provider unavailable", "error"),
    turn("user", "C"), turn("assistant", "Completed response"),
    turn("user", "D"), turn("assistant", "Streaming", "pending"),
  ]), [{ role: "user", content: "C" }, { role: "assistant", content: "Completed response" }]);
});
test("widget history keeps recent complete pairs within the server's request budget", () => {
  const messages = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", text: `${i}:` + "x".repeat(1500), status: "complete" }));
  const history = quickChatHistory(messages);
  assert.ok(history.length <= 8);
  assert.ok(history.reduce((n, turn) => n + turn.content.length, 0) <= 8000);
  assert.ok(history.at(-1).content.startsWith("19:"));
  assert.doesNotThrow(() => parseChatHistory(history));
});
