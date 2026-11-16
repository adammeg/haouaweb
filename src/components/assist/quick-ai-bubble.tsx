"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { quickChatHistory } from "@/lib/ia/quick-chat";
import { usePathname, useRouter } from "next/navigation";
import { useHawaeStore } from "@/stores/hawae-store";
import { preparePatientAiRequest, isCurrentAiRequest } from "@/lib/ia/patient-request-client";
import { stableClinicalDataKey } from "@/lib/ia/clinical-revision";
import { parseVoiceCommand, DICTATION_LABELS } from "@/lib/voice/commands";
import { stageVoiceEdit, voiceEditIsCurrent, type PendingVoiceEdit } from "@/lib/voice/draft-edit";
import { VoiceControls } from "@/components/voice/voice-controls";
import { useVoiceSession } from "@/components/voice/use-voice-session";
import type { HawaeIaExchange } from "@/types/domain";

type Message = { id: number; role: "user" | "assistant"; text: string; status: "complete" | "pending" | "cancelled" | "error" };
const SUGGESTIONS = [
  { label: "Contraception", question: "Quels points aborder pour discuter du choix d’une contraception ?" },
  { label: "Endométriose", question: "Peux-tu m’expliquer simplement l’endométriose ?" },
  { label: "Ménopause", question: "Quels sujets aborder lors d’une consultation de ménopause ?" },
  { label: "Discutons", question: "Bonjour Hawae, de quoi peut-on discuter en gynécologie ?" },
];

export function QuickAiBubble({ access }: { access: "enabled" | "sign-in" | "restricted" }) {
  const router = useRouter();
  const pathname = usePathname();
  const draft = useHawaeStore((state) => state.draft);
  const currentUserId = useHawaeStore((state) => state.currentUserId);
  const [mode, setMode] = useState<"chat" | "patient" | "command">("chat");
  const [readReplies, setReadReplies] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<PendingVoiceEdit | null>(null);
  const [notice, setNotice] = useState("");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const assistantRef = useRef<number | null>(null);
  const nearBottomRef = useRef(true);
  const nextId = useRef(1);
  const contextKey = `${access}:${pathname}:${currentUserId}:${draft?.id}:${stableClinicalDataKey(draft)}:${mode}`;
  const contextRef = useRef(contextKey); contextRef.current = contextKey;
  const askRef = useRef<(text: string) => void>(() => {});
  const voice = useVoiceSession({
    enabled: access === "enabled", contextKey,
    onWake: () => { setOpen(true); setNotice("Bonjour Docteur. Je vous écoute."); },
    onTranscript: (text) => {
      setOpen(true); setQuestion(text);
      if (autoSend) askRef.current(text);
      else setNotice("Relisez la transcription, puis envoyez votre demande.");
    },
  });
  const stopVoice = voice.stop;

  const stop = useCallback(() => {
    stopVoice();
    runRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    const assistantId = assistantRef.current;
    setMessages((current) => current.map((message) => message.id === assistantId && message.status === "pending" ? { ...message, status: "cancelled" } : message));
    setLoading(false);
  }, [stopVoice]);
  const close = useCallback(() => {
    stop(); setPendingEdit(null); setOpen(false); triggerRef.current?.focus();
  }, [stop]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); close(); }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, close]);
  useEffect(() => {
    if (open && nearBottomRef.current && messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [open, messages]);
  useEffect(() => () => { runRef.current++; abortRef.current?.abort(); }, []);
  useEffect(() => {
    stop(); setPendingEdit(null); setNotice(""); setError(""); setQuestion(""); setMessages([]);
  }, [contextKey, stop]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState !== "visible") stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [stop]);

  function clear() {
    stop(); setPendingEdit(null); setNotice(""); setMessages([]); setQuestion(""); setError(""); nearBottomRef.current = true;
    inputRef.current?.focus();
  }

  function runCommand(text: string) {
    voice.pause(); setError(""); setNotice(""); setPendingEdit(null);
    const command = parseVoiceCommand(text);
    const state = useHawaeStore.getState();
    if (command.type === "stop") { stop(); setNotice("Écoute et lecture arrêtées."); return; }
    if (command.type === "navigate") { stop(); router.push(command.href); setNotice("Navigation effectuée."); return; }
    if (command.type === "tab") {
      if (!state.draft?.id) { setError("Ouvrez un dossier avant de sélectionner un onglet."); voice.resume(); return; }
      stop(); router.push(`/dossier?voiceTab=${command.tab}`); return;
    }
    if (command.type === "dictate") {
      if (!state.draft?.id || !state.currentUserId) { setError("Ouvrez un dossier avant de dicter une modification."); voice.resume(); return; }
      setPendingEdit(stageVoiceEdit(state.draft, state.currentUserId, command.field, command.value)); return;
    }
    if (command.type === "summary") {
      if (!state.draft?.id) { setError("Ouvrez un dossier avant de demander son résumé."); voice.resume(); return; }
      void ask("Résume le dossier actuel et signale les informations manquantes.", true); return;
    }
    setError("Commande non reconnue. Essayez « ouvre l’agenda », « affiche les scores » ou « ajoute aux symptômes : … ».");
    voice.resume();
  }

  askRef.current = (text) => { void ask(text); };

  function applyEdit() {
    const state = useHawaeStore.getState();
    if (!pendingEdit || !voiceEditIsCurrent(pendingEdit, state.draft, state.currentUserId)) {
      setPendingEdit(null); setError("Le dossier a changé. Dictez de nouveau la modification."); return;
    }
    state.patchDraft({ [pendingEdit.field]: pendingEdit.proposed });
    setPendingEdit(null); setQuestion("");
  }

  async function ask(raw: string, forcePatient = false) {
    const text = raw.trim();
    if (access !== "enabled" || !text || text.length > 2000 || abortRef.current) return;
    if (mode === "command" && !forcePatient) { runCommand(text); return; }
    const patientMode = mode === "patient" || forcePatient;
    const snapshot = useHawaeStore.getState();
    if (patientMode && !snapshot.draft?.id) { setError("Ouvrez un dossier pour poser une question sur une patiente."); return; }
    voice.pause(); setPendingEdit(null); setNotice("");
    const dispatchedContext = contextRef.current;
    const workspaceUserId = snapshot.currentUserId;
    const patientId = snapshot.draft?.id;
    const clinicalKey = stableClinicalDataKey(snapshot.draft);
    const current = () => {
      const state = useHawaeStore.getState();
      return dispatchedContext === contextRef.current && workspaceUserId === state.currentUserId && patientId === state.draft?.id && clinicalKey === stableClinicalDataKey(state.draft);
    };
    const history = quickChatHistory(messages);
    const ac = new AbortController();
    const run = ++runRef.current;
    abortRef.current = ac;
    const userId = nextId.current++, assistantId = nextId.current++;
    assistantRef.current = assistantId;
    setMessages((current) => [...current, { id: userId, role: "user" as const, text, status: "complete" as const }, { id: assistantId, role: "assistant" as const, text: "", status: "pending" as const }].slice(-30));
    setQuestion(""); setError(""); setLoading(true); nearBottomRef.current = true;
    function update(reply: string, status: Message["status"] = "pending") {
      if (ac.signal.aborted || run !== runRef.current || !current()) return;
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: reply, status } : message));
    }
    try {
      // Patient context is opt-in; general chat never attaches a dossier.
      const prepared = patientMode ? await preparePatientAiRequest(patientId!, ac.signal) : null;
      const res = await fetch("/api/ia", { method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared
          ? { mode: "question", question: text, patientId: prepared.patientId, expectedRevision: prepared.expectedRevision, conversation: true, stream: false }
          : { mode: "chat", question: text, history, stream: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "L’assistant est momentanément indisponible.");
      }
      let reply = "";
      let meta: Partial<HawaeIaExchange> | undefined;
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json() as { reply?: string; meta?: Partial<HawaeIaExchange> };
        reply = data.reply ?? "";
        meta = data.meta;
      } else {
        if (!res.body) throw new Error("Réponse vide.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            reply += decoder.decode(value, { stream: true });
            update(reply);
          }
          reply += decoder.decode();
        } finally { reader.releaseLock(); }
      }
      if (!reply.trim()) throw new Error("Aucune réponse reçue. Réessayez dans un instant.");
      if (ac.signal.aborted || run !== runRef.current || !current()) return;
      if (prepared) {
        if (!isCurrentAiRequest(prepared.patientId, prepared.key) || meta?.revision !== prepared.expectedRevision) throw new Error("Le dossier a changé. Relancez votre demande.");
        const state = useHawaeStore.getState();
        const entry: HawaeIaExchange = { ...meta, id: crypto.randomUUID(), at: new Date().toISOString(), mode: "question", question: text, reply, contextKeyAtGeneration: prepared.key };
        state.patchDraft({ hawaeIaHistory: [...(state.draft?.hawaeIaHistory ?? []), entry].slice(-60) });
        state.saveDraft();
      }
      update(reply, "complete");
      if (readReplies) voice.speak(reply); else voice.resume();
    } catch (cause) {
      if (ac.signal.aborted || run !== runRef.current || !current()) return;
      voice.stop();
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, status: "error" } : message));
      setQuestion(text);
    } finally {
      if (run === runRef.current) { abortRef.current = null; setLoading(false); }
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(question); }

  return (
    <div className="quick-ai print:hidden">
      {open ? (
        <section id={panelId} className="quick-ai-panel" role="dialog" aria-modal="false" aria-labelledby={`${panelId}-title`}>
          <header className="quick-ai-header">
            <div className="quick-ai-mark" aria-hidden>✦</div>
            <div className="min-w-0 flex-1">
              <h2 id={`${panelId}-title`}>Hawae · En bref</h2>
              <p>Gynécologie, fertilité & petites questions</p>
            </div>
            <button type="button" onClick={clear} aria-label="Nouvelle conversation" title="Nouvelle conversation" disabled={!messages.length && !question}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={close} aria-label="Fermer la discussion" title="Fermer">×</button>
          </header>
          <div className="quick-ai-context"><span aria-hidden>◌</span>{mode === "chat" ? "Discussion générale · aucun dossier joint" : draft?.id ? `Dossier : ${[draft.prenom, draft.nom].filter(Boolean).join(" ") || "patiente active"}` : "Aucun dossier ouvert"}</div>
          {access === "enabled" && <div className="voice-mode-bar">
            <label htmlFor={`${panelId}-mode`}>Mode</label>
            <select id={`${panelId}-mode`} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              <option value="chat">Discussion générale</option><option value="patient">Question sur le dossier</option><option value="command">Commande vocale</option>
            </select>
          </div>}
          <div ref={messagesRef} className="quick-ai-messages" role="log" aria-label="Conversation avec Hawae" aria-live="polite" aria-relevant="additions text" aria-busy={loading}
            onScroll={(event) => { const node = event.currentTarget; nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}>
            {!messages.length && mode === "chat" ? (
              <div className="quick-ai-welcome">
                <div className="quick-ai-welcome-symbol" aria-hidden>✦</div>
                <strong>Un point de gynéco ?</strong>
                <p>Une notion à éclaircir, une question courte ou simplement envie d’échanger ? Je vous écoute.</p>
                {access === "enabled" ? <div>{SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion.label} type="button" onClick={() => void ask(suggestion.question)}><span>{suggestion.label}</span><span aria-hidden>↗</span></button>
                ))}</div> : <p className="quick-ai-access">
                  {access === "sign-in" ? <>Connectez-vous à votre compte pour discuter avec Hawae. <a href="/login">Se connecter →</a></> : "La discussion médicale est réservée aux comptes médecins et administrateurs."}
                </p>}
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`quick-ai-message quick-ai-${message.role}`}>
                <span className="sr-only">{message.role === "user" ? "Vous : " : "Hawae : "}</span>
                {message.text || (message.status === "pending" ? <span className="quick-ai-typing" aria-label="Hawae prépare sa réponse"><i /><i /><i /></span> : null)}
                {message.status === "cancelled" ? <span className="quick-ai-message-status">Réponse interrompue</span> : message.status === "error" ? <span className="quick-ai-message-status">Réponse non terminée</span> : null}
                {access === "enabled" && message.role === "assistant" && message.status === "complete" && <button type="button" className="voice-read" disabled={loading} onClick={() => voice.speak(message.text)} aria-label="Lire la réponse à voix haute">Écouter</button>}
              </div>
            ))}
          </div>
          {mode === "command" && !pendingEdit && <p className="voice-hint">« ouvre l’agenda » · « affiche les scores » · « résume le dossier » · « ajoute aux symptômes : … »</p>}
          {notice && <p className="voice-hint" role="status">{notice}</p>}
          {pendingEdit && <section className="voice-edit" aria-label="Modification à relire">
            <strong>{DICTATION_LABELS[pendingEdit.field]} · ajout proposé</strong>
            <p>Valeur actuelle : {pendingEdit.previous || "Vide"}</p><p>Après ajout : {pendingEdit.proposed}</p>
            <div className="voice-actions"><button type="button" onClick={applyEdit}>Appliquer au dossier</button><button type="button" onClick={() => { setPendingEdit(null); voice.resume(); }}>Annuler</button></div>
          </section>}
          {error ? <p className="quick-ai-error" role="alert">{error}</p> : null}
          {access === "enabled" && <VoiceControls voice={voice} busy={loading} readReplies={readReplies} autoSend={autoSend} onAutoSend={setAutoSend} onReadReplies={(value) => { setReadReplies(value); if (!value) voice.pause(); }} />}
          {access === "enabled" ? <form onSubmit={submit} className="quick-ai-form">
            <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
              }}
              maxLength={2000} rows={2} placeholder="Une petite question…" aria-label="Votre question de gynécologie" enterKeyHint="send" />
            {loading ? <button type="button" onClick={stop} aria-label="Arrêter la réponse" title="Arrêter"><span className="quick-ai-stop" aria-hidden /></button>
              : <button type="submit" disabled={!question.trim()} aria-label="Envoyer la question" title="Envoyer">↑</button>}
          </form> : null}
          <p className="quick-ai-disclaimer">{mode === "chat" ? "Échanges informatifs · aucun dossier joint." : "Aide au médecin · vérifiez toute transcription et proposition clinique."}</p>
        </section>
      ) : null}
      <button ref={triggerRef} type="button" className="quick-ai-trigger" onClick={() => open ? close() : setOpen(true)} aria-label={open ? "Fermer la discussion avec Hawae" : "Ouvrir la discussion avec Hawae"} aria-expanded={open} aria-controls={open ? panelId : undefined} aria-haspopup="dialog">
        <span aria-hidden><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 11h.01M12 11h.01M17 11h.01" strokeWidth="3" strokeLinecap="round" /></svg></span><span>{voice.state === "waiting" ? "● En attente de bonjour haoua" : voice.state === "recording" ? "● Je vous écoute" : "Hawae · Chat & voix"}</span>
      </button>
    </div>
  );
}
