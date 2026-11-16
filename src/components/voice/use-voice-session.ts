"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecognitionSession, type CaptureState, type RecognitionConstructor } from "@/lib/voice/browser-recognition";

export function useVoiceSession(options: {
  enabled: boolean; contextKey: string; onTranscript: (text: string) => void; onWake: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [localSupported, setLocalSupported] = useState(false);
  const [state, setState] = useState<CaptureState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [processing, setProcessing] = useState<"local" | "browser">("local");
  const [browserConsent, setBrowserConsent] = useState(false);
  const controller = useRef<VoiceRecognitionSession | null>(null);
  const constructor = useRef<RecognitionConstructor | null>(null);
  const latest = useRef(options); latest.current = options;
  const wakeWanted = useRef(false);
  const local = useRef(true); local.current = processing === "local";
  const consent = useRef(false); consent.current = browserConsent;
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);

  const stopSpeech = useCallback(() => {
    clearTimeout(speechTimer.current);
    const utterance = speech.current;
    speech.current = null;
    if (utterance) {
      utterance.onend = utterance.onerror = null;
      window.speechSynthesis?.cancel();
    }
    setSpeaking(false);
  }, []);

  const stop = useCallback(() => {
    generation.current++;
    wakeWanted.current = false; setWakeEnabled(false); setInstalling(false);
    clearTimeout(resumeTimer.current);
    controller.current?.stop(); stopSpeech();
  }, [stopSpeech]);

  const pause = useCallback(() => {
    clearTimeout(resumeTimer.current);
    controller.current?.stop(); stopSpeech();
  }, [stopSpeech]);

  const resume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    if (!wakeWanted.current || !latest.current.enabled || document.visibilityState !== "visible") return;
    // Let the audio output settle before listening again.
    resumeTimer.current = setTimeout(() => {
      if (wakeWanted.current && latest.current.enabled && document.visibilityState === "visible") {
        void controller.current?.start("wake", local.current);
      }
    }, 400);
  }, []);

  const speak = useCallback((text: string) => {
    pause();
    if (!latest.current.enabled || !text.trim() || document.visibilityState !== "visible") return;
    if (!("speechSynthesis" in window)) { setError("Lecture vocale indisponible. La réponse reste affichée."); resume(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR"; utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.startsWith("fr") && voice.localService) ?? voices.find((voice) => voice.lang.startsWith("fr")) ?? null;
    speech.current = utterance; setSpeaking(true);
    const finish = (failed: boolean) => {
      if (speech.current !== utterance) return;
      stopSpeech();
      if (failed) setError("Lecture interrompue. Vous pouvez relire la réponse à l’écran.");
      resume();
    };
    utterance.onend = () => finish(false);
    utterance.onerror = () => finish(true);
    speechTimer.current = setTimeout(() => finish(true), 180_000);
    window.speechSynthesis.speak(utterance);
  }, [pause, resume, stopSpeech]);

  const start = useCallback((mode: "wake" | "dictate") => {
    pause();
    if (!latest.current.enabled || document.visibilityState !== "visible") return;
    if (!local.current && !consent.current) { setError("Autorisez explicitement le service du navigateur avant de l’utiliser."); return; }
    wakeWanted.current = mode === "wake"; setWakeEnabled(mode === "wake");
    void controller.current?.start(mode, local.current);
  }, [pause]);

  const installLocal = useCallback(async () => {
    stop();
    if (!latest.current.enabled || !constructor.current?.install) return;
    const run = generation.current;
    setInstalling(true); setError("");
    try {
      if (!(await constructor.current.install({ langs: ["fr-FR"] }))) throw new Error("Le pack français n’a pas pu être installé.");
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error ? cause.message : "Installation indisponible.");
    } finally { if (run === generation.current) setInstalling(false); }
  }, [stop]);

  useEffect(() => {
    const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || !window.isSecureContext) return;
    constructor.current = Recognition;
    setSupported(true); setLocalSupported("processLocally" in new Recognition());
    controller.current = new VoiceRecognitionSession(Recognition, {
      state: setState, interim: setInterim,
      transcript: (text) => latest.current.onTranscript(text),
      wake: () => latest.current.onWake(),
      error: (message) => {
        setError(message);
        if (message) { wakeWanted.current = false; setWakeEnabled(false); }
      },
    });
    return () => { stop(); controller.current = null; };
  }, [stop]);

  useEffect(() => { stop(); }, [options.contextKey, options.enabled, stop]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState !== "visible") stop(); };
    const pageHide = () => stop();
    document.addEventListener("visibilitychange", hide); window.addEventListener("pagehide", pageHide);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", pageHide); };
  }, [stop]);

  return { supported, localSupported, state, interim, error, wakeEnabled, speaking, installing,
    processing, browserConsent, start, stop, pause, resume, speak, installLocal,
    setProcessing: (value: "local" | "browser") => { stop(); setError(""); setProcessing(value); },
    setBrowserConsent: (value: boolean) => { stop(); setBrowserConsent(value); },
  };
}

export type VoiceSessionControls = ReturnType<typeof useVoiceSession>;
