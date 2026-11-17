import { normalizeVoiceText, wakeRequest } from "./commands";

/** Browser fallback only. Realtime uses acoustic VAD instead of transcript heuristics. */
export function shouldInterruptPlayback(raw: string, playing: string) {
  if (wakeRequest(raw) !== null) return true;
  const text = normalizeVoiceText(raw);
  if (/^(?:stop|attends|attendez|arrete|silence)\b/.test(text)) return true;
  if (text.split(" ").filter(Boolean).length < 3) return false;
  const output = normalizeVoiceText(playing);
  return !!output && !output.includes(text);
}
