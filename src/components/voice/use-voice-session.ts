"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecognitionSession, type CaptureMode, type CaptureState, type RecognitionConstructor } from "@/lib/voice/browser-recognition";
import { canStartVoice, DEFAULT_VOICE_PREFERENCES, parseVoicePreferences, VOICE_SESSION_END_EVENT, type VoicePreferences } from "@/lib/voice/preferences";
import { spokenText } from "@/lib/voice/spoken-text";

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
  const [speaking, setSpeaking] = useState(false);
  const [preparingSpeech, setPreparingSpeech] = useState(false);
  const [conversation, setConversation] = useState(false);
  const [interruptAvailable, setInterruptAvailable] = useState(true);
  const [installing, setInstalling] = useState(false);
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
    const utterance = utteranceRef.current; utteranceRef.current = null;
    if (utterance) { utterance.onstart = utterance.onend = utterance.onerror = null; window.speechSynthesis?.cancel(); }
    setSpeaking(false); setPreparingSpeech(false);
  }, []);
  const pause = useCallback(() => {
    generation.current++; clearTimeout(resumeTimer.current);
    controller.current?.stop(); stopSpeech();
  }, [stopSpeech]);
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
    if (!eligible() || utteranceRef.current) return;
    resumeTimer.current = setTimeout(() => {
      if (!eligible() || utteranceRef.current || captureState.current === "recording") return;
      const followingUp = conversationUntil.current > Date.now();
      setConversation(followingUp);
      beginCapture(latest.current.thinking ? "interrupt" : followingUp ? "followup" : "wake");
    }, 400);
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
    pause(); conversationUntil.current = 0; setConversation(false); setError("");
    const next = { ...latest.current.preferences, ...patch }; latest.current.preferences = next; setPreferences(next);
    try { localStorage.setItem(`hawae:voice:${latest.current.accountId}`, JSON.stringify(next)); } catch { /* Private browsing. */ }
  }, [pause]);
  const retry = useCallback(() => { suspended.current = false; updatePreferences({ active: true }); resume(); }, [resume, updatePreferences]);
  const startTalk = useCallback(() => {
    pause(); latest.current.onInterrupt(); setError("");
    if (!eligible()) return;
    conversationUntil.current = Date.now() + 20_000; setConversation(true); beginCapture("dictate");
  }, [beginCapture, eligible, pause]);
  const endConversation = useCallback(() => {
    pause(); conversationUntil.current = 0; setConversation(false); resume();
  }, [pause, resume]);

  const speak = useCallback((text: string) => {
    pause();
    if (!eligible() || !text.trim()) return;
    if (!("speechSynthesis" in window)) { setError("La lecture vocale est indisponible dans ce navigateur."); resume(); return; }
    try {
      const utterance = new SpeechSynthesisUtterance(spokenText(text)); utterance.lang = "fr-FR";
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
      // During output, recognize only the wake prefix. Ordinary speaker echo is discarded.
      resumeTimer.current = setTimeout(() => { if (utteranceRef.current === utterance) beginCapture("interrupt"); }, 400);
    } catch { pause(); setError("Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse."); resume(); }
  }, [beginCapture, eligible, pause, resume]);

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
        transcript: (text) => { if (eligible()) latest.current.onTranscript(text); },
        capture: () => latest.current.onWake(),
        wake: () => {
          if (captureMode.current === "interrupt") { stopSpeech(); latest.current.onInterrupt(); }
          captureMode.current = "dictate";
          conversationUntil.current = Date.now() + 20_000; setConversation(true);
          latest.current.onWake(); chime();
        },
        error: (message) => {
          if (message && captureMode.current === "interrupt" && (utteranceRef.current || latest.current.thinking)) { setInterruptAvailable(false); return; }
          setError(message);
        },
        idle: () => { conversationUntil.current = 0; setConversation(false); resumeRef.current(); },
      });
    }
    setReady(true);
    return () => { mounted = false; pause(); controller.current = null; void audioContext.current?.close().catch(() => {}); audioContext.current = null; };
  }, [options.accountId, chime, eligible, pause, setCaptureState, stopSpeech]);

  useEffect(() => {
    pause(); conversationUntil.current = 0; setConversation(false); setInstalling(false);
    if (ready && supported) resume();
  }, [options.contextKey, options.enabled, ready, supported, preferences, pause, resume]);
  useEffect(() => {
    if (options.blocked) { pause(); conversationUntil.current = 0; setConversation(false); }
    else if (!utteranceRef.current && ready && supported) resume();
  }, [options.blocked, ready, supported, pause, resume]);
  useEffect(() => {
    if (!utteranceRef.current && captureState.current !== "recording") resume();
  }, [options.thinking, resume]);
  useEffect(() => {
    const visibility = () => {
      pause(); conversationUntil.current = 0; setConversation(false);
      if (document.visibilityState === "visible") resume();
    };
    const pageHide = () => { pause(); conversationUntil.current = 0; setConversation(false); };
    const sessionEnd = () => { suspended.current = true; pageHide(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", pageHide);
    window.addEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    return () => {
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide);
      window.removeEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    };
  }, [pause, resume]);

  return { ready, supported, localSupported, localAvailable, canInstall, state, interim, error, speaking, preparingSpeech, conversation, interruptAvailable, installing, preferences,
    pause, resume, speak, retry, startTalk, endConversation, installLocal, updatePreferences };
}
