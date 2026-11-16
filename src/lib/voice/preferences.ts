export type VoicePreferences = { active: boolean; processing: "local" | "browser"; browserConsent: boolean };
export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = { active: true, processing: "local", browserConsent: false };

/** Only recognition preferences are persisted, never audio, transcripts or patient data. */
export function parseVoicePreferences(raw: string | null): VoicePreferences {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return { ...DEFAULT_VOICE_PREFERENCES };
    const prefs = value as Record<string, unknown>;
    return { active: prefs.active !== false, processing: prefs.processing === "browser" ? "browser" : "local", browserConsent: prefs.browserConsent === true };
  } catch { return { ...DEFAULT_VOICE_PREFERENCES }; }
}

export function canStartVoice(preferences: VoicePreferences, enabled: boolean, visible: boolean, blocked: boolean): boolean {
  return enabled && visible && !blocked && preferences.active && (preferences.processing === "local" || preferences.browserConsent);
}

export const VOICE_SESSION_END_EVENT = "hawae:voice-session-end";
