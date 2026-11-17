# Realtime voice setup

Assist uses [HeyGen speech through OpenRouter](voice-openrouter.md) when an OpenRouter key is configured. That path recognizes speech in the browser, streams text from `/api/ia` and synthesizes spoken output with HeyGen. A device-voice fallback is also available. This document describes the separate optional native audio path, which connects a conversation to OpenAI over WebRTC, continuously captures the microphone during that conversation, and uses semantic voice activity detection to interrupt output at speech onset. Wake listening still uses the chosen browser recognizer.

## Server configuration

Configure these server environment variables and restart or redeploy:

```dotenv
VOICE_REALTIME_ENABLED=true
VOICE_REALTIME_API_KEY=<direct OpenAI API key>
VOICE_REALTIME_MODEL=gpt-realtime-2.1
```

`OPENAI_API_KEY` can supply the key when `VOICE_REALTIME_API_KEY` is absent. An OpenRouter key can supply text reasoning and HeyGen synthesis, but does not enable this OpenAI WebRTC endpoint. The OpenAI account must have access to the configured realtime model and billing. Existing text-provider configuration remains necessary for clinical reasoning through `/api/ia`. OpenRouter synthesis takes priority when configured; set `VOICE_SPEECH_PROVIDER=browser` to select the native path with the realtime variables above.

This is opt-in at server level. When enabled, the doctor's **Conversation audio temps réel** preference defaults on and can be disabled in Assist settings. Settings explain that conversation audio is sent to OpenAI. Local/browser-service wake recognition keeps its separate settings. A compatible secure browser, microphone permission, WebRTC and microphone capture support are required. If local wake recognition is unavailable, the main island button can start native audio directly.

## Conversation and application access

The server authenticates an active doctor, rejects cross-origin session creation, bounds the SDP offer and rate-limits handshakes. It sends the offer and trusted session configuration to OpenAI, returning only the SDP answer. The permanent key stays on the server.

After an accepted wake request, the browser recognizer stops and its completed request is passed into the native conversation. Native audio then handles follow-ups without repeating the wake phrase. The model can ask clarifying questions and invokes the single `hawae_request` tool for cabinet data, clinical questions and application actions. That tool dispatches through the existing app handlers: loaded dossier/agenda reads, authorized saved-revision clinical reasoning, patient choices and review forms. No database is preloaded into the audio session. Tool replies and conversation audio may contain the requested patient information and are sent to OpenAI. Clinical questions are instructed to retain the doctor's wording, numbers and negations, and the audio model is instructed to read clinical tool results faithfully.

On `input_audio_buffer.speech_started`, the client immediately mutes and pauses remote output, clears its audio buffer, cancels the active response and invalidates application work from the interrupted turn. This does not wait for the final transcript. Late results and duplicate tool events cannot restart an old answer. A new turn can then produce new audio. **C'est tout**, explicit pause, backgrounding, logout, patient/context changes and review forms close the session and stop its microphone tracks. Disconnection also cancels pending app work. Idle native sessions close after 90 seconds; a session lasts at most ten minutes, then returns to wake listening when eligible.

## Browser fallback

Without a configured native service, Assist keeps working with the browser. Partial recognition of **bonjour assist**, **bonjour assiste**, **bonjour assistant** or **bonjour l'assist** acknowledges immediately. Only finalized words become requests. Repeated local language-pack checks are cached after success. Capture resumption waits 120 ms and the final-result silence window is 450 ms; neither is an end-to-end latency measurement.

Text answers stream through a sentence queue before generation completes. Patient revision headers are checked before any streamed answer is spoken. Only completed/current answers become history. Interruption cancels the request and all queued speech. Interim controls such as **stop** or **attends** can stop playback before recognition finalizes; other speech can interrupt when it differs from the text being spoken. This echo filter is a heuristic, not acoustic echo cancellation. Browsers that cannot recognize and synthesize concurrently still need the tap-to-interrupt control. The native path requests microphone echo cancellation and uses provider VAD; its real acoustic behavior also needs device testing.

## Validation and limits

Run `npm run test:voice`, `npm run test:ai`, `npx tsc --noEmit` and the production build. Tests simulate WebRTC, speech events, streaming responses, permissions resolving after shutdown, tool dispatch, cancellation, data authorization and microphone cleanup. They do not establish live provider compatibility, French wake accuracy, echo rejection, clinical model fidelity or measured response latency.

For release, enable native audio on a configured test server. With a synthetic dossier and agenda, test wake pronunciation, an ordinary follow-up, an interruption mid-answer without the wake phrase, a correction with clinical negation, a pending dossier request interrupted by a calendar question, patient changes, pause/logout and speaker/headphone echo. Verify that the doctor hears only the new answer and that microphone capture ends when the session closes. Compare speech-end-to-first-audio timing on the target devices for both modes.

References: [OpenAI WebRTC connection](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime), [realtime conversations and tools](https://developers.openai.com/api/docs/guides/realtime-conversations), [voice activity detection](https://developers.openai.com/api/docs/guides/realtime-vad).
