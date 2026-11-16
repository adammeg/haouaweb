"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceRecognitionSession, type CaptureState, type RecognitionConstructor } from "@/lib/voice/browser-recognition";
import { canStartVoice, DEFAULT_VOICE_PREFERENCES, parseVoicePreferences, VOICE_SESSION_END_EVENT, type VoicePreferences } from "@/lib/voice/preferences";

export function useVoiceSession(options: {
  enabled: boolean; blocked: boolean; accountId: string; contextKey: string;
  onTranscript: (text: string) => void; onWake: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [localSupported, setLocalSupported] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<VoicePreferences>(DEFAULT_VOICE_PREFERENCES);
  const [state, setState] = useState<CaptureState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const controller = useRef<VoiceRecognitionSession | null>(null);
  const constructor = useRef<RecognitionConstructor | null>(null);
  const latest = useRef({ ...options, preferences }); latest.current = { ...options, preferences };
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);
  const suspended = useRef(false);
  const resumeRef = useRef<() => void>(() => {});

  const pause = useCallback(() => {
    generation.current++;
    clearTimeout(resumeTimer.current); clearTimeout(speechTimer.current);
    controller.current?.stop();
    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (utterance) { utterance.onend = utterance.onerror = null; window.speechSynthesis?.cancel(); }
    setSpeaking(false);
  }, []);

  const eligible = useCallback(() => {
    const current = latest.current;
    return !suspended.current && canStartVoice(current.preferences, current.enabled, document.visibilityState === "visible", current.blocked);
  }, []);

  const resume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    if (!eligible()) return;
    resumeTimer.current = setTimeout(() => {
      if (eligible()) void controller.current?.start("wake", latest.current.preferences.processing === "local");
    }, 450);
  }, [eligible]);
  resumeRef.current = resume;

  const updatePreferences = useCallback((patch: Partial<VoicePreferences>) => {
    pause(); setError("");
    const next = { ...latest.current.preferences, ...patch };
    latest.current.preferences = next;
    setPreferences(next);
    try { localStorage.setItem(`hawae:voice:${latest.current.accountId}`, JSON.stringify(next)); } catch { /* Private browsing. */ }
  }, [pause]);

  const retry = useCallback(() => {
    suspended.current = false;
    updatePreferences({ active: true });
    if (!latest.current.blocked) resume();
  }, [resume, updatePreferences]);

  const speak = useCallback((text: string) => {
    pause();
    if (suspended.current || !latest.current.enabled || !latest.current.preferences.active || !text.trim() || document.visibilityState !== "visible") return;
    if (!("speechSynthesis" in window)) { setError("La lecture vocale est indisponible dans ce navigateur."); return; }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.lang.startsWith("fr") && voice.localService) ?? voices.find((voice) => voice.lang.startsWith("fr")) ?? null;
      utteranceRef.current = utterance; setSpeaking(true);
      const finish = (failed: boolean) => {
        if (utteranceRef.current !== utterance) return;
        pause();
        if (failed) setError("Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse.");
        else resume();
      };
      utterance.onend = () => finish(false); utterance.onerror = () => finish(true);
      speechTimer.current = setTimeout(() => finish(true), 180_000);
      window.speechSynthesis.speak(utterance);
    } catch { pause(); setError("Lecture bloquée. Touchez le bouton de lecture pour écouter la réponse."); }
  }, [pause, resume]);

  const installLocal = useCallback(async () => {
    pause();
    if (!latest.current.enabled || !constructor.current?.install) return;
    const run = generation.current;
    setInstalling(true); setError("");
    try {
      if (!(await constructor.current.install({ langs: ["fr-FR"] }))) throw new Error("Le pack français n’a pas pu être installé.");
      if (run === generation.current) resume();
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error ? cause.message : "Installation indisponible.");
    } finally { if (run === generation.current) setInstalling(false); }
  }, [pause, resume]);

  useEffect(() => {
    try { setPreferences(parseVoicePreferences(localStorage.getItem(`hawae:voice:${options.accountId}`))); } catch { /* Defaults remain active. */ }
    const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (Recognition && window.isSecureContext) {
      constructor.current = Recognition;
      setSupported(true); setLocalSupported("processLocally" in new Recognition()); setCanInstall(!!Recognition.install);
      controller.current = new VoiceRecognitionSession(Recognition, {
        state: setState, interim: setInterim,
        transcript: (text) => { if (!suspended.current && latest.current.enabled && latest.current.preferences.active && !latest.current.blocked) latest.current.onTranscript(text); },
        wake: () => latest.current.onWake(), error: setError, idle: () => resumeRef.current(),
      });
    }
    setReady(true);
    return () => { pause(); controller.current = null; };
  }, [options.accountId, pause]);

  useEffect(() => {
    pause(); setInstalling(false);
    if (ready && supported) resume();
  }, [options.contextKey, options.enabled, ready, supported, preferences, pause, resume]);

  useEffect(() => {
    if (options.blocked) pause();
    else if (!utteranceRef.current && ready && supported) resume();
  }, [options.blocked, ready, supported, pause, resume]);

  useEffect(() => {
    const visibility = () => { pause(); if (document.visibilityState === "visible") resume(); };
    const pageHide = () => pause();
    const sessionEnd = () => { suspended.current = true; pause(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", pageHide);
    window.addEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    return () => {
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pageHide);
      window.removeEventListener(VOICE_SESSION_END_EVENT, sessionEnd);
    };
  }, [pause, resume]);

  return { ready, supported, localSupported, canInstall, state, interim, error, speaking, installing, preferences,
    pause, resume, speak, retry, installLocal, updatePreferences };
}
