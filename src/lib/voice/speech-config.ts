export const DEFAULT_SPEECH_MODEL = "heygen/heygen-voice-1-turbo:free";
export const SPEECH_SAMPLE_RATE = 44_100;

/** Speech credentials and model choice are independent of the clinical reasoning model. */
export function speechConfig() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  const provider = process.env.VOICE_SPEECH_PROVIDER?.trim() || "openrouter";
  return {
    enabled: provider === "openrouter" && !!key,
    key,
    model: process.env.VOICE_SPEECH_MODEL?.trim() || DEFAULT_SPEECH_MODEL,
    voice: process.env.VOICE_SPEECH_VOICE?.trim() || "nadine",
    url: `${(process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1").replace(/\/$/, "")}/audio/speech`,
  };
}
