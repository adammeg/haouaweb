# HeyGen voice through OpenRouter

Assist uses `heygen/heygen-voice-1-turbo:free` for **spoken output** when an OpenRouter key is configured. HeyGen converts text to speech; it does not transcribe the doctor, reason about patient data, call application tools or provide a WebRTC conversation. Wake recognition and interruption detection remain in the browser. Hawae still handles dossier and agenda commands and uses its separately configured reasoning model for questions.

## Configuration

Set these server variables and restart or redeploy:

```dotenv
OPENROUTER_API_KEY=<your OpenRouter key>
VOICE_SPEECH_PROVIDER=openrouter
VOICE_SPEECH_MODEL=heygen/heygen-voice-1-turbo:free
VOICE_SPEECH_VOICE=nadine
```

The speech provider/model/voice values above are the defaults and are also in `.env.example`. Keep `OPENROUTER_MODEL` set to a chat/reasoning model. Do not set it to the HeyGen speech model. A direct OpenAI key and `VOICE_REALTIME_ENABLED` are not needed for this path. When OpenRouter speech is configured, it takes precedence over the optional OpenAI native audio path.

OpenRouter's [model page](https://openrouter.ai/heygen/heygen-voice-1-turbo%3Afree) and [models API](https://openrouter.ai/api/v1/models?output_modalities=speech) list the free endpoint as expiring **November 30, 2026** (checked November 18, 2026). Free requests also have provider limits. The integration sends exactly the configured model ID and never retries with a paid model. If the free endpoint fails or retires, Assist reports the error. Uncheck **Voix OpenRouter** in Assist settings to use the device voice, or set `VOICE_SPEECH_PROVIDER=browser` on the server. Changing to another speech model is explicit and currently requires compatible 44.1 kHz mono PCM output and a matching voice.

## Streaming, interruption and data flow

The authenticated `/api/voice/speech` endpoint accepts at most 5,000 characters, validates the doctor's active access, origin and request bounds, and rate-limits synthesis. It calls OpenRouter's `/api/v1/audio/speech` endpoint using a server-held key and the configured voice. The response is raw PCM audio, which is forwarded without buffering the whole answer. Provider JSON errors and incompatible audio formats are rejected. No permanent key is exposed to the client.

The browser decodes PCM16 samples at 44.1 kHz and starts scheduling audio while the response is still open. The first available sentence can start before text reasoning is complete. Sentences accumulated during synthesis are combined into the next request to reduce extra requests and pauses. Playback order is retained, including when generation ends before audio drains. A blocked AudioContext offers a tap-to-enable message instead of claiming that speech has started. HeyGen treats square brackets as control tags or unspoken text, so synthesis removes the delimiters and retains their contents; bracketed clinical numbers and qualifiers must remain audible.

Interruption aborts outstanding text and synthesis requests and immediately stops all playing/scheduled audio nodes once the browser detects the interrupt. Late chunks cannot resume playback. Browser recognition still determines when that event is detected; this path does not have the native realtime provider's speech-onset VAD. Speaker echo, wake accuracy and concurrent recognition/playback need real-device testing. The follow-up window remains 20 seconds.

Settings explain that the answer text, including requested patient or agenda information, is sent to OpenRouter and its speech provider. This speech path does not upload microphone recordings to HeyGen. The browser recognition mode has its own local/service setting. Audio and transcripts are not stored in device preferences, and synthesis is separate from consent-gated clinical learning. Page hiding, pause, logout, review forms and patient/context changes stop active playback and pending work.

## Verification

`npm run test:voice` covers authenticated proxying, correct model/voice selection, separate reasoning configuration, PCM byte boundaries, playback before response completion, sentence order/coalescing, cancellation, provider failures and dossier/agenda integration. `npm run test:ai` covers the AI/API regressions. Tests use synthetic audio and data; a configured live provider and target microphone/speakers are still required to measure response latency and French output quality.

Protocol references: [OpenRouter speech documentation](https://openrouter.ai/docs/guides/overview/multimodal/tts), [speech tutorial](https://openrouter.ai/blog/tutorials/text-to-speech/), [HeyGen model](https://openrouter.ai/heygen/heygen-voice-1-turbo%3Afree), [supported voices and expiration](https://openrouter.ai/api/v1/models?output_modalities=speech).
