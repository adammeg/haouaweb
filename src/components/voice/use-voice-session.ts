"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecognitionSession, type CaptureMode, type CaptureState, type RecognitionConstructor } from "@/lib/voice/browser-recognition";
import { canStartVoice, DEFAULT_VOICE_PREFERENCES, parseVoicePreferences, VOICE_SESSION_END_EVENT, type VoicePreferences } from "@/lib/voice/preferences";
import { spokenText } from "@/lib/voice/spoken-text";
import { shouldInterruptPlayback } from "@/lib/voice/interruption";
import { RealtimeVoiceSession, type RealtimeToolCall } from "@/lib/voice/realtime-session";
import { BrowserSpeechStream, type SpeechStream, type SpeechStreamCallbacks } from "@/lib/voice/speech-stream";
import { OpenRouterSpeechStream } from "@/lib/voice/openrouter-speech-stream";

export function useVoiceSession(options: {
  enabled: boolean; blocked: boolean; thinking: boolean; accountId: string; contextKey: string;
  onTranscript: (text: string) => void; onWake: () => void; onInterrupt: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [localSupported, setLocalSupported] = useState(false);
  const [localAvailable, setLocalAvailable] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<VoicePreferences>(DEFAULT_VOICE_PREFERENCES);
  const [state, setState] = useState<CaptureState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [preparingSpeech, setPreparingSpeech] = useState(false);
  const [conversation, setConversation] = useState(false);
  const [interruptAvailable, setInterruptAvailable] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [realtimeAvailable, setRealtimeAvailable] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [realtimeThinking, setRealtimeThinking] = useState(false);
  const [realtimeSupported, setRealtimeSupported] = useState(false);
  const [serverSpeechAvailable, setServerSpeechAvailable] = useState(false);
  const serverSpeechAllowed = useRef(false); serverSpeechAllowed.current = serverSpeechAvailable && preferences.serverSpeech !== false;
  const beginOutput = useRef<() => number | null>(() => null);
  const realtime = useRef<RealtimeVoiceSession | null>(null);
  const realtimeCall = useRef<RealtimeToolCall | null>(null);
  const realtimeAllowed = useRef(false); realtimeAllowed.current = !serverSpeechAvailable && realtimeAvailable && preferences.realtime !== false;
  const spokenOutput = useRef("");
  const streamedSpeech = useRef<{ id: number; stream: SpeechStream } | null>(null);
  const speechSequence = useRef(0);
  const activateRealtime = useRef<(text: string) => void>(() => {});
  const controller = useRef<VoiceRecognitionSession | null>(null);
  const constructor = useRef<RecognitionConstructor | null>(null);
  const latest = useRef({ ...options, preferences }); latest.current = { ...options, preferences };
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);
  const suspended = useRef(false);
  const conversationUntil = useRef(0);
  const captureMode = useRef<CaptureMode>("wake");
  const captureState = useRef<CaptureState>("idle");
  const resumeRef = useRef<() => void>(() => {});
  const audioContext = useRef<AudioContext | null>(null);

  const setCaptureState = useCallback((value: CaptureState) => { captureState.current = value; setState(value); }, []);
  const stopSpeech = useCallback(() => {
    clearTimeout(speechTimer.current); clearTimeout(startTimer.current);
    const stream = streamedSpeech.current; streamedSpeech.current = null; stream?.stream.cancel();
    const utterance = utteranceRef.current; utteranceRef.current = null;
    if (utterance) utterance.onstart = utterance.onend = utterance.onerror = null;
    window.speechSynthesis?.cancel();
    spokenOutput.current = "";
    setSpeaking(false); setPreparingSpeech(false);
  }, []);
  const pause = useCallback(() => {
    generation.current++; clearTimeout(resumeTimer.current);
    controller.current?.stop(); stopSpeech();
  }, [stopSpeech]);
  const shutdown = useCallback(() => {
    pause(); latest.current.onInterrupt(); realtimeCall.current = null;
    const session = realtime.current; realtime.current = null; session?.close(); setRealtimeActive(false); setRealtimeThinking(false);
  }, [pause]);
  const eligible = useCallback(() => {
    const current = latest.current;
    return !suspended.current && canStartVoice(current.preferences, current.enabled, document.visibilityState === "visible", current.blocked);
  }, []);
  const beginCapture = useCallback((mode: CaptureMode) => {
    if (!eligible()) return;
    captureMode.current = mode;
    void controller.current?.start(mode, latest.current.preferences.processing === "local");
  }, [eligible]);
  const resume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    if (!eligible() || utteranceRef.current || streamedSpeech.current || realtime.current) return;
    resumeTimer.current = setTimeout(() => {
      if (!eligible() || utteranceRef.current || streamedSpeech.current || realtime.current || captureState.current === "recording") return;
      const followingUp = conversationUntil.current > Date.now();
      setConversation(followingUp);
      beginCapture(latest.current.thinking ? "interrupt" : followingUp ? "followup" : "wake");
    }, 120);
  }, [beginCapture, eligible]);
  resumeRef.current = resume;

  const chime = useCallback(() => {
    // Optional short earcon: failure to unlock Web Audio must never prevent recording.
    try {
      if (!("AudioContext" in window)) return;
      const context = audioContext.current ?? new AudioContext(); audioContext.current = context;
      void context.resume().then(() => {
        if (!eligible() || captureState.current !== "recording") return;
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.frequency.value = 660; gain.gain.setValueAtTime(.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .09);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(); oscillator.stop(context.currentTime + .1);
      }).catch(() => {});
    } catch { /* Audio feedback is best-effort. */ }
  }, [eligible]);

  const updatePreferences = useCallback((patch: Partial<VoicePreferences>) => {
    shutdown(); conversationUntil.current = 0; setConversation(false); setError(""); setSpeechError("");
    const next = { ...latest.current.preferences, ...patch }; latest.current.preferences = next; setPreferences(next);
    try { localStorage.setItem(`hawae:voice:${latest.current.accountId}`, JSON.stringify(next)); } catch { /* Private browsing. */ }
  }, [shutdown]);
  const retry = useCallback(() => { suspended.current = false; updatePreferences({ active: true }); resume(); }, [resume, updatePreferences]);
  const startTalk = useCallback(() => {
    if (realtime.current) { realtimeCall.current = null; realtime.current.interrupt(); return; }
    pause(); latest.current.onInterrupt(); setError("");
    if (!eligible()) return;
    // Unlock Web Audio in the click gesture before any network request.
    if (serverSpeechAllowed.current && window.AudioContext) {
      try { audioContext.current ??= new window.AudioContext(); void audioContext.current.resume().catch(() => {}); } catch { /* Playback reports the error. */ }
    }
    if (realtimeAllowed.current && "RTCPeerConnection" in window && typeof navigator.mediaDevices?.getUserMedia === "function") { activateRealtime.current(""); return; }
    conversationUntil.current = Date.now() + 20_000; setConversation(true); beginCapture("dictate");
  }, [beginCapture, eligible, pause]);
  const endConversation = useCallback(() => {
    shutdown(); conversationUntil.current = 0; setConversation(false); resume();
  }, [shutdown, resume]);

  const speak = useCallback((text: string) => {
    setSpeechError("");
    if (realtime.current) {
      const call = realtimeCall.current; realtimeCall.current = null;
      if (call) realtime.current.completeTool(call, text); else realtime.current.say(text);
      return;
    }
    if (serverSpeechAllowed.current) {
      const id = beginOutput.current();
      if (id !== null && streamedSpeech.current?.id === id) { streamedSpeech.current.stream.append(text); streamedSpeech.current?.stream.finish(); }
      return;
    }
    pause();
    if (!eligible() || !text.trim()) return;
    if (!("speechSynthesis" in window)) { setError("La lecture vocale est indisponible dans ce navigateur."); resume(); return; }
    try {
      const utterance = new SpeechSynthesisUtterance(spokenText(text)); utterance.lang = "fr-FR"; spokenOutput.current = text;
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.lang.startsWith("fr") && voice.localService) ?? voices.find((voice) => voice.lang.startsWith("fr")) ?? null;
      utteranceRef.current = utterance; setPreparingSpeech(true); setError("");
      const finish = (failed: boolean) => {
        if (utteranceRef.current !== utterance) return;
        pause();
        if (failed) { setError("Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse."); resume(); }
        else { conversationUntil.current = Date.now() + 20_000; setConversation(true); resume(); }
      };
      utterance.onstart = () => {
        if (utteranceRef.current !== utterance) return;
        clearTimeout(startTimer.current); setPreparingSpeech(false); setSpeaking(true);
      };
      utterance.onend = () => finish(false); utterance.onerror = () => finish(true);
      startTimer.current = setTimeout(() => finish(true), 6000);
      speechTimer.current = setTimeout(() => finish(true), 180_000);
      window.speechSynthesis.speak(utterance);
      // Browser fallback: accept wake/control words and ignore matching playback text.
      if (utteranceRef.current === utterance) beginCapture("interrupt");
    } catch { pause(); setError("Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse."); resume(); }
  }, [beginCapture, eligible, pause, resume]);

  const beginSpeechStream = useCallback((): number | null => {
    if (realtime.current || !eligible() || (!serverSpeechAllowed.current && !("speechSynthesis" in window))) return null;
    pause(); const id = ++speechSequence.current;
    const callbacks: SpeechStreamCallbacks = {
      start: (text) => {
        if (streamedSpeech.current?.id !== id) return;
        spokenOutput.current = text; setPreparingSpeech(false); setSpeaking(true);
        beginCapture("interrupt");
      },
      waiting: () => { if (streamedSpeech.current?.id === id) { setSpeaking(false); setPreparingSpeech(true); } },
      done: () => {
        if (streamedSpeech.current?.id !== id) return;
        streamedSpeech.current = null; controller.current?.stop(); spokenOutput.current = "";
        setSpeaking(false); setPreparingSpeech(false); conversationUntil.current = Date.now() + 20_000; setConversation(true); resume();
      },
      error: (message) => {
        if (streamedSpeech.current?.id !== id) return;
        streamedSpeech.current = null; setSpeaking(false); setPreparingSpeech(false); spokenOutput.current = "";
        setSpeechError(message || "Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse."); resume();
      },
    };
    try {
      let stream: SpeechStream;
      if (serverSpeechAllowed.current) {
        audioContext.current ??= new window.AudioContext();
        stream = new OpenRouterSpeechStream(audioContext.current, callbacks);
      } else stream = new BrowserSpeechStream(window.speechSynthesis, (text) => {
        const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "fr-FR";
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find((voice) => voice.lang.startsWith("fr") && voice.localService) ?? voices.find((voice) => voice.lang.startsWith("fr")) ?? null;
        return utterance;
      }, callbacks);
      streamedSpeech.current = { id, stream }; setPreparingSpeech(true); setError(""); setSpeechError("");
      // Listen during provider preparation as well as during playback.
      beginCapture("interrupt"); return id;
    } catch { setSpeechError("Lecture indisponible. Choisissez la voix de l’appareil dans les réglages."); resume(); return null; }
  }, [beginCapture, eligible, pause, resume]);
  beginOutput.current = beginSpeechStream;
  const enqueueSpeech = useCallback((id: number | null, text: string) => { if (id !== null && streamedSpeech.current?.id === id) streamedSpeech.current.stream.append(text); }, []);
  const finishSpeechStream = useCallback((id: number | null) => { if (id !== null && streamedSpeech.current?.id === id) streamedSpeech.current.stream.finish(); }, []);

  const deliverTranscript = useCallback((text: string) => {
    if (!eligible()) return;
    if (!realtimeAllowed.current || !("RTCPeerConnection" in window) || !navigator.mediaDevices?.getUserMedia) { latest.current.onTranscript(text); return; }
    pause();
    const run = generation.current;
    const session = new RealtimeVoiceSession({
      state: (value) => {
        if (realtime.current !== session) return;
        setRealtimeActive(value !== "closed"); setSpeaking(value === "speaking"); setPreparingSpeech(value === "connecting");
        setRealtimeThinking(value === "thinking");
        setCaptureState(value === "connecting" ? "starting" : value === "listening" ? "recording" : "waiting");
        setConversation(true);
      },
      interrupt: () => { if (realtime.current === session) { realtimeCall.current = null; latest.current.onInterrupt(); latest.current.onWake(); } },
      transcript: (value) => { if (realtime.current === session) setInterim(value); },
      tool: (call) => {
        if (realtime.current !== session || !eligible()) return;
        realtimeCall.current = call; latest.current.onWake(); latest.current.onTranscript(call.request);
      },
      error: (message) => { if (realtime.current === session) setError(message); },
      close: () => {
        if (realtime.current !== session) return;
        realtime.current = null; realtimeCall.current = null; latest.current.onInterrupt(); setRealtimeActive(false); setRealtimeThinking(false); setSpeaking(false); setPreparingSpeech(false);
        conversationUntil.current = 0; setConversation(false); resumeRef.current();
      },
    });
    realtime.current = session; setRealtimeActive(true);
    void session.connect(text).catch(() => { if (text.trim() && run === generation.current && eligible()) latest.current.onTranscript(text); });
  }, [eligible, pause, setCaptureState]);
  activateRealtime.current = deliverTranscript;

  const installLocal = useCallback(async () => {
    pause();
    if (!latest.current.enabled || !constructor.current?.install) return;
    const run = generation.current; setInstalling(true); setError("");
    try {
      if (!(await constructor.current.install({ langs: ["fr-FR"] }))) throw new Error("Le pack français n’a pas pu être installé.");
      if (run === generation.current) { setLocalAvailable(true); resume(); }
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error ? cause.message : "Installation indisponible.");
    } finally { if (run === generation.current) setInstalling(false); }
  }, [pause, resume]);

  useEffect(() => {
    let mounted = true;
    const configAbort = new AbortController();
    setRealtimeSupported("RTCPeerConnection" in window && !!navigator.mediaDevices?.getUserMedia);
    void fetch("/api/voice/realtime", { credentials: "same-origin", signal: configAbort.signal }).then(async (response) => {
      if (!response.ok) return;
      const config = await response.json(); if (mounted) setRealtimeAvailable(config.available === true);
    }).catch(() => {});
    void fetch("/api/voice/speech", { credentials: "same-origin", signal: configAbort.signal }).then(async (response) => {
      if (!response.ok) return;
      const config = await response.json(); if (mounted) setServerSpeechAvailable(config.available === true && !!window.AudioContext);
    }).catch(() => {});
    try { setPreferences(parseVoicePreferences(localStorage.getItem(`hawae:voice:${options.accountId}`))); } catch { /* Defaults remain active. */ }
    const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (Recognition && window.isSecureContext) {
      constructor.current = Recognition;
      const hasLocal = "processLocally" in new Recognition();
      setSupported(true); setLocalSupported(hasLocal); setLocalAvailable(hasLocal); setCanInstall(!!Recognition.install);
      if (hasLocal && Recognition.available) void Recognition.available({ langs: ["fr-FR"], processLocally: true })
        .then((availability) => { if (mounted) setLocalAvailable(availability === "available"); })
        .catch(() => { if (mounted) setLocalAvailable(false); });
      controller.current = new VoiceRecognitionSession(Recognition, {
        state: (value) => {
          setCaptureState(value);
          if (captureMode.current === "interrupt" && value === "waiting") setInterruptAvailable(true);
        }, interim: setInterim,
        transcript: deliverTranscript,
        interruption: (text) => {
          if ((!utteranceRef.current && !streamedSpeech.current) || !shouldInterruptPlayback(text, spokenOutput.current)) return false;
          stopSpeech(); latest.current.onInterrupt(); latest.current.onWake();
          captureMode.current = "dictate"; conversationUntil.current = Date.now() + 20_000; setConversation(true); return true;
        },
        capture: () => latest.current.onWake(),
        wake: () => {
          if (captureMode.current === "interrupt") { stopSpeech(); latest.current.onInterrupt(); }
          captureMode.current = "dictate";
          conversationUntil.current = Date.now() + 20_000; setConversation(true);
          latest.current.onWake(); chime();
        },
        error: (message) => {
          if (message && captureMode.current === "interrupt" && (utteranceRef.current || streamedSpeech.current || latest.current.thinking)) { setInterruptAvailable(false); return; }
          setError(message);
        },
        idle: () => { conversationUntil.current = 0; setConversation(false); resumeRef.current(); },
      });
    }
    setReady(true);
    return () => { mounted = false; configAbort.abort(); shutdown(); controller.current = null; void audioContext.current?.close().catch(() => {}); audioContext.current = null; };
  }, [options.accountId, chime, deliverTranscript, eligible, shutdown, setCaptureState, stopSpeech]);

  useEffect(() => {
    shutdown(); conversationUntil.current = 0; setConversation(false); setInstalling(false);
    if (ready && supported) resume();
  }, [options.contextKey, options.enabled, ready, supported, preferences, shutdown, resume]);
  useEffect(() => {
    if (options.blocked) { shutdown(); conversationUntil.current = 0; setConversation(false); }
    else if (!utteranceRef.current && !streamedSpeech.current && ready && supported) resume();
  }, [options.blocked, ready, supported, shutdown, resume]);
  useEffect(() => {
    if (!utteranceRef.current && !streamedSpeech.current && captureState.current !== "recording") resume();
  }, [options.thinking, resume]);
  useEffect(() => {
    const visibility = () => {
      shutdown(); conversationUntil.current = 0; setConversation(false);
      if (document.visibilityState === "visible") resume();
    };
    const pageHide = () => { shutdown(); conversationUntil.current = 0; setConversation(false); };
    const sessionEnd = () => { suspended.current = true; pageHide(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", pageHide);
    window.addEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    return () => {
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide);
      window.removeEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    };
  }, [shutdown, resume]);

  return { ready, supported, localSupported, localAvailable, canInstall, state, interim, error: speechError || error, speaking, preparingSpeech, conversation, interruptAvailable, installing, preferences, realtimeAvailable, realtimeActive, realtimeSupported, realtimeThinking, serverSpeechAvailable,
    pause, suspend: shutdown, resume, speak, retry, startTalk, endConversation, installLocal, updatePreferences, beginSpeechStream, enqueueSpeech, finishSpeechStream };
}
