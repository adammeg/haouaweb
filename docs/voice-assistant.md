# Assist: voice-only doctor assistant

Assist appears as a compact animated pill at the top of the page for signed-in doctors. There is no chat window, transcript history, text composer, or Send step. Voice activation is enabled by default.

Say **“bonjour assist”** or **“bonjour assiste”**, followed by a request. The island shows waiting, listening, thinking, or speaking, with a short wake acknowledgement when audio feedback is available. Commands execute automatically; questions receive spoken answers. After each answer, **À vous** opens a 20-second window for a follow-up without repeating the wake phrase. Silence returns to wake-only listening. Examples:

- “Bonjour assist, résume le dossier.”
- “Bonjour assiste, ouvre l’agenda.”
- “Bonjour assist, affiche les scores.”
- “Bonjour assist, ajoute aux symptômes : pas de fièvre depuis trois jours.”

The open patient dossier supplies context for questions by default, as indicated by **Dossier actif** in the island. Use the settings icon to disable patient context for general questions. A dossier summary always requires an open patient. Clinical questions await workspace synchronization and use the existing authorized patient/revision checks; completed exchanges retain provenance and consent-gated learning behavior.

Assist can also search/open a named dossier, read actual appointments, waiting-room entries and reminders, save the current dossier, and prepare an appointment in the standard review form. These workspace reads use the loaded application's data rather than asking the model to invent access or results. See [workspace access and example commands](voice-workspace-access.md).

## Automatic activation and permissions

Assist attempts to start wake listening when the doctor opens the app. Browsers still control microphone permission and may require a first click. If recognition cannot start, the island offers setup/retry rather than claiming it is listening.

Local French recognition is the default. It requires browser support for `processLocally` and an available French language pack. In the island settings, install the language pack if supported, or select **Service du navigateur** and explicitly authorize its processing. Browser-service audio may leave the device even while waiting for the wake phrase. This choice and the active/paused preference are saved per signed-in account on the device. No raw audio, transcripts, replies or patient data are saved in these preferences.

Once configured and permitted, activation is automatic on future visits. Tap the main island to speak directly; use the pause control or say “mets-toi en pause” to disable listening. This explicit pause persists. Settings pause capture while open. Hiding the page suspends capture and pending requests; returning resumes wake-only listening when activation is still enabled. Route, user, patient or clinical changes invalidate old requests and conversational windows. Logout stops capture immediately and prevents automatic resumption.

The recognizer renews bounded waiting sessions while automatic activation remains enabled. Request recording is bounded to thirty seconds and 2000 characters. Wake-only silence returns to waiting without sending an AI request. Repeated immediate recognition errors stop rather than looping indefinitely.

## Answers and clinical edits

Completed answers are spoken with the browser's generated French voice; the replay control or “répète” repeats the latest answer. Tap the pill or say “bonjour assist” while Assist is thinking/speaking to interrupt and ask something else. During playback, the recognizer ignores ordinary words and accepts only the wake prefix. Some browsers cannot recognize speech during playback; the island then shows a tap-to-interrupt fallback. Actual interruption reliability requires device/echo testing.

“C’est tout” ends the conversational window; “mets-toi en pause” disables wake listening. The UI marks speaking only once audio starts. If audio never starts, it offers replay guidance after six seconds. Requests that exceed 45 seconds time out with feedback. Spoken-answer prompts favor short conversational replies while retaining relevant clinical uncertainty and alerts.

Navigation is allowlisted. Dictation appends only to `motif`, `symptomes`, or `atcdMed`. Clinical changes open a review card with the old and proposed value. **Appliquer au dossier** commits a change; speaking “oui” does not. Switching user, patient or clinical revision discards the pending edit.

Speech uses browser APIs; reasoning uses the existing `/api/ia` provider configuration. No additional speech API key is required. Recognition requires HTTPS (or localhost), microphone permission, and `SpeechRecognition`/`webkitSpeechRecognition`. Wake activation matches recognized words rather than a separately trained acoustic keyword model. The local mode never silently switches to a remote speech service. Actual recognition and generated voice availability depend on the browser/device.

## Validation

Run `npm run test:voice`, `npm run test:ai`, and `npx tsc --noEmit`. DOM tests verify default activation, the absence of chat/composer UI, automatic requests, playback continuity, commands, pause/resume, background cancellation, explicit remote authorization, clinical previews and logout. Recognition tests use synthetic speech events and timers; they do not measure real microphone wake accuracy.

Before release, test French pronunciation and room noise, browser permissions/language packs, spoken playback, and supported mobile devices with real microphones.

See [the interaction audit](voice-interaction-audit.md) for reproduced findings, corrections and remaining limits.
