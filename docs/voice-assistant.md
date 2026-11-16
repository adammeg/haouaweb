# Doctor voice assistant

Implemented in the global **Hawae · Chat & voix** panel. Speech uses browser APIs; AI reasoning continues through the existing authenticated `/api/ia` endpoint and configured OpenRouter/OpenAI model. No additional API key is required for speech.

## Use

1. Sign in with a doctor account and open **Hawae · Chat & voix**.
2. Select **Discussion générale**, **Question sur le dossier**, or **Commande vocale**. Patient mode requires an open dossier.
3. Open **Réglages vocaux**. Local recognition is the default. Install the French language pack if supported. If the browser does not support local recognition, select **Service du navigateur** and explicitly authorize its processing; audio may leave the device, including while waiting for the wake phrase.
4. Click **Activer « bonjour haoua »**, grant microphone permission, and say **“bonjour haoua”** followed by a request. The phrase and request can be spoken together. **Dicter** captures a request without the wake phrase.
5. Review/edit the transcription and send it. To send automatically, explicitly enable **Mode mains libres**. Completed AI answers are read aloud unless **Lire les réponses** is disabled; **Écouter** replays a completed answer.

Wake listening resumes after a completed answer when it is still enabled. Say the wake phrase before each new request. Use the visible **Arrêter** control to stop listening/playback. Recognition is paused while Hawae speaks, so spoken interruption during playback is not supported in this version.

Closing the panel, hiding the page, changing route, mode, user, patient or clinical data stops listening and cancels pending generation. Wake listening is bounded to five minutes per session; request recording is bounded to thirty seconds and 2000 characters. Silence after activation never creates an AI request.

## Commands

Use **Commande vocale** for application actions. Examples:

- “Bonjour haoua, ouvre l’agenda.”
- “Bonjour haoua, affiche les scores.”
- “Bonjour haoua, résume le dossier.”
- “Bonjour haoua, ajoute aux symptômes : pas de fièvre, douleur depuis trois jours.”

Navigation is restricted to known routes/tabs. Narrative dictation can append to `motif`, `symptomes`, or `atcdMed`. A preview shows the existing and proposed value. **Appliquer au dossier** commits it; speaking “oui” cannot commit it, including in hands-free mode. If the patient, user or clinical revision changes, discard the preview and dictate again.

## Compatibility and processing

Recognition requires HTTPS (or localhost), microphone permission, and a browser exposing `SpeechRecognition` or `webkitSpeechRecognition`. Local recognition additionally requires `processLocally` support and an available French language pack. Availability depends on browser/version; use keyboard input when unsupported. Browser speech synthesis supplies the generated voice and may depend on installed voices/browser services.

Wake activation matches the recognized phrase **“bonjour haoua”**. This implementation uses the selected speech recognizer, not a separately trained acoustic wake-word model. The local setting never silently falls back to a remote recognizer. Browser-service mode requires explicit consent each mounted session. Hawae does not store raw audio; the browser/recognition service's retention and processing are separate from application storage.

The microphone Permissions-Policy permits only the app's own origin. General chat attaches no patient context. Patient questions await saved workspace synchronization and check the server revision, then load at most four recent completed question/answer pairs from that same saved revision. Client-supplied patient chat history is rejected. Completed patient exchanges retain the existing provenance and consent-gated learning behavior.

## Validation

Run `npm run test:voice`, `npm run test:ai`, and `npx tsc --noEmit`. Voice tests use a synthetic browser recognizer and simulated timers; API tests exercise the real authorization/context pipeline against synthetic in-memory records.

Manual release checks still require real microphones, French pronunciation, browser language-pack installation, speech-service connectivity, generated audio playback, and supported mobile devices. Measure missed wake phrases and false activations in a consultation room; automated synthetic recognition events do not establish acoustic accuracy.
