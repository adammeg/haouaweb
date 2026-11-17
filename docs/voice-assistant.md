# Assist: voice-only doctor assistant

Assist appears as a compact animated pill at the top of the page for signed-in doctors. There is no chat window, transcript history, text composer, or Send step. Voice activation is enabled by default.

Say **“bonjour assist”** or **“bonjour assiste”**, followed by a request. Recognition variants **“bonjour assistant”** and **“bonjour l'assist”** are accepted too. The island acknowledges interim wake detection immediately, but submits finalized words only. It shows waiting, listening, thinking, or speaking, with an optional short wake sound. Commands execute automatically; questions receive spoken answers. The optional native audio mode supports continuous follow-ups during an active conversation. In the browser fallback, **À vous** opens a 20-second follow-up window after each answer, then returns to wake-only listening. Examples:

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

With an OpenRouter key configured, Assist speaks using **HeyGen Voice Turbo (free)** by default. This is speech synthesis: browser recognition captures requests, Hawae's existing reasoning and workspace handlers produce answers, and HeyGen voices them. Playback streams and remains cancellable; no direct OpenAI key is needed. Settings let the doctor choose the device voice instead. See [OpenRouter setup, data flow and the announced November 30, 2026 free endpoint retirement](voice-openrouter.md).

When the optional native realtime path is configured and OpenRouter synthesis is disabled, Assist uses WebRTC speech-to-speech with semantic VAD and an application tool for dossier/agenda access. Speaking during output immediately mutes and clears the old audio at speech onset, before transcription completes. Follow-ups do not need the wake phrase. The microphone stays open only during the bounded active conversation. See [configuration, data flow and validation](voice-realtime.md).

The browser fallback streams text answers and speaks complete sentences before generation finishes. Tap the pill, say “bonjour assist”, use an interim control such as “stop” or “attends”, or speak a new request to interrupt. Matching playback text is ignored as likely echo; other speech uses a heuristic and may misclassify room noise or echo. Some browsers cannot recognize speech during playback; the island then shows a tap-to-interrupt fallback. Actual interruption reliability requires device/echo testing. Replay or “répète” repeats the latest completed answer.

“C’est tout” ends the conversational window; “mets-toi en pause” disables wake listening. The UI marks speaking once output starts. Browser voice start and Web Audio unlocking have a six-second deadline. OpenRouter synthesis requests have a 30-second deadline; reasoning requests have a 45-second deadline. Spoken-answer prompts favor short conversational replies while retaining relevant clinical uncertainty and alerts.

Navigation is allowlisted. Dictation appends only to `motif`, `symptomes`, or `atcdMed`. Clinical changes open a review card with the old and proposed value. **Appliquer au dossier** commits a change; speaking “oui” does not. Switching user, patient or clinical revision discards the pending edit.

The device-voice fallback needs no speech API key; HeyGen synthesis reuses `OPENROUTER_API_KEY`. Reasoning uses the existing `/api/ia` provider configuration and its own chat model. Native OpenAI audio requires separate explicit server configuration and a direct OpenAI key; an OpenRouter key cannot enable that WebRTC endpoint. Wake recognition requires HTTPS (or localhost), microphone permission, and `SpeechRecognition`/`webkitSpeechRecognition`. Wake activation matches recognized words rather than a separately trained acoustic keyword model. The local wake mode never silently switches to a remote recognizer. Native audio can also start by tapping the island on compatible browsers without local recognition. Actual recognition, output and latency depend on the browser/device and provider.

## Validation

Run `npm run test:voice`, `npm run test:ai`, and `npx tsc --noEmit`. DOM tests verify default activation, the absence of chat/composer UI, automatic requests, playback continuity, commands, pause/resume, background cancellation, explicit remote authorization, clinical previews and logout. Recognition tests use synthetic speech events and timers; they do not measure real microphone wake accuracy.

Before release, test French pronunciation and room noise, browser permissions/language packs, spoken playback, and supported mobile devices with real microphones.

See [the interaction audit](voice-interaction-audit.md) for reproduced findings, corrections and remaining limits.
