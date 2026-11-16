# Voice interaction audit

Scope: browser recognition lifecycle, doctor voice island, spoken playback, conversational history, request cancellation and `/api/ia` voice requests. This is source inspection plus synthetic DOM/API regression testing; it is not an acoustic accuracy or real-device certification.

## Findings and corrections

| Finding | Effect before this change | Correction and evidence |
| --- | --- | --- |
| Every reply ended the conversation | A natural follow-up without “bonjour assist” was silently ignored | A visible 20-second follow-up window accepts the next utterance directly. Silence returns to wake-only listening. DOM tests cover both paths and retained general conversation history. |
| Main island button meant pause | Clicking the assistant to speak disabled it | Main action now starts capture, including during an answer. A separate pause control and “mets-toi en pause” preserve deliberate disable behavior. |
| Navigation accepted only rigid imperative wording | “Peux-tu ouvrir l’agenda ?” missed the command path | Known polite prefixes and infinitive forms now normalize to the same allowlisted commands. Negated/composite commands remain rejected. |
| Recognition stopped during thinking/playback | A doctor could not interrupt by voice | A constrained recognizer accepts only the wake prefix while thinking or speaking. It cancels the previous request/output and captures the replacement request. Ordinary playback text is discarded. Tests cover both completed-output and pending-request interruption. |
| UI claimed audio was playing when it was merely queued | Autoplay failure could leave “Assist vous répond” visible for up to three minutes | Speaking state now follows the actual synthesis `start` event; queued audio shows a preparation state. Missing start fails after six seconds with replay guidance. |
| Responses used the document-style patient prompt | Long, formatted responses sounded like a report rather than a conversation | Explicit validated `voice: true` requests add concise spoken-answer instructions and a 600-token ceiling, retaining clinical uncertainty/alerts and existing authorization. Presentation markup is removed only for speech; provenance and original answers remain stored. |
| Local support was inferred from an API property alone | Missing French packs looked like an endless retry problem | Check language-pack availability where the browser exposes it and route to setup. No silent remote fallback. |
| No obvious wake acknowledgement | The doctor could not tell promptly whether the phrase had worked | Immediate listening state plus a short optional Web Audio earcon. A blocked earcon does not block capture. |
| Network requests had no client interaction deadline | A request could remain in “thinking” until upstream failure | A 45-second client timeout produces actionable feedback. Manual interruption and logout invalidate the request independently. |
| Incomplete recognized continuations could leave only a finalized fragment | An unfinished phrase could be sent without its final qualification | Reject a finalized fragment when a remaining interim continuation never finalizes. Regression test uses an interrupted clinical negation. |

The initial follow-up, tap-to-talk, interruption and false-speaking regressions were reproduced as failing tests before the fixes. Added tests also cover late responses after cancellation, repeated answers without a new model call, ending the conversation, explicit pause, local pack failure, follow-up isolation after patient changes, timeouts and browsers rejecting simultaneous recognition/playback.

## Limits that remain

- Speech still uses a browser recognition → text reasoning → browser speech pipeline. Reasoning waits for a completed answer before playback; this is not a realtime speech-to-speech session and latency is not measured by synthetic tests.
- Concurrent recognition and synthesis varies by browser/device. If interruption capture fails, playback continues and the island shows a tap-to-interrupt fallback. Headphones and real speaker-echo tests are needed. Ordinary non-wake echo is discarded, but actual false wake activations cannot be ruled out by mocked events.
- Wake activation still depends on transcription recognizing “bonjour assist” or “bonjour assiste”; no trained acoustic keyword model is shipped.
- Microphone permissions, local French language packs and speech-service availability still govern activation. Browser-service mode continues to require explicit authorization.
- Clinical edits still require the review card's Apply action. Voice conversation does not silently commit structured clinical changes.

## Real-device acceptance flow

1. Start with an authorized doctor and a known synthetic patient. Verify the actual microphone and selected speech engine are available.
2. Say “bonjour assist, résume le dossier”. Check recognition, saved dossier synchronization, audible output and the waiting/thinking/speaking states.
3. After the answer, ask “quelles informations manquent ?” without the wake phrase. Verify the same patient context is used.
4. During an answer, say “bonjour assist, répète”. Check interruption or the visible tap fallback. Test once with speakers and once with headphones.
5. Say “c’est tout”, then unrelated speech; it should not invoke the model. Say “bonjour assist, mets-toi en pause”; it should remain paused after page visibility changes.
6. Switch patient during capture and during model generation. No old answer, replay or pending clinical edit should carry into the new patient.

## Primary browser references

- [Speech synthesis start event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/start_event)
- [Local recognition requirements](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)
- [Language-pack availability](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static)
