"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { quickChatHistory } from "@/lib/ia/quick-chat";

type Message = { id: number; role: "user" | "assistant"; text: string; status: "complete" | "pending" | "cancelled" | "error" };
const SUGGESTIONS = [
  { label: "Contraception", question: "Quels points aborder pour discuter du choix d’une contraception ?" },
  { label: "Endométriose", question: "Peux-tu m’expliquer simplement l’endométriose ?" },
  { label: "Ménopause", question: "Quels sujets aborder lors d’une consultation de ménopause ?" },
  { label: "Discutons", question: "Bonjour Hawae, de quoi peut-on discuter en gynécologie ?" },
];

export function QuickAiBubble() {
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

  const stop = useCallback(() => {
    runRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    const assistantId = assistantRef.current;
    setMessages((current) => current.map((message) => message.id === assistantId && message.status === "pending" ? { ...message, status: "cancelled" } : message));
    setLoading(false);
  }, []);
  const close = useCallback(() => {
    stop(); setOpen(false); triggerRef.current?.focus();
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

  function clear() {
    stop(); setMessages([]); setQuestion(""); setError(""); nearBottomRef.current = true;
    inputRef.current?.focus();
  }

  async function ask(raw: string) {
    const text = raw.trim();
    if (!text || text.length > 2000 || abortRef.current) return;
    const history = quickChatHistory(messages);
    const ac = new AbortController();
    const run = ++runRef.current;
    abortRef.current = ac;
    const userId = nextId.current++, assistantId = nextId.current++;
    assistantRef.current = assistantId;
    setMessages((current) => [...current, { id: userId, role: "user" as const, text, status: "complete" as const }, { id: assistantId, role: "assistant" as const, text: "", status: "pending" as const }].slice(-30));
    setQuestion(""); setError(""); setLoading(true); nearBottomRef.current = true;
    function update(reply: string, status: Message["status"] = "pending") {
      if (ac.signal.aborted || run !== runRef.current) return;
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: reply, status } : message));
    }
    try {
      // General conversation only: never read or attach the active dossier.
      const res = await fetch("/api/ia", { method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", question: text, history, stream: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "L’assistant est momentanément indisponible.");
      }
      let reply = "";
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json() as { reply?: string };
        reply = data.reply ?? "";
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
      update(reply, "complete");
    } catch (cause) {
      if (ac.signal.aborted || run !== runRef.current) return;
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
          <div className="quick-ai-context"><span aria-hidden>◌</span> Discussion générale · aucun dossier joint</div>
          <div ref={messagesRef} className="quick-ai-messages" role="log" aria-label="Conversation avec Hawae" aria-live="polite" aria-relevant="additions text" aria-busy={loading}
            onScroll={(event) => { const node = event.currentTarget; nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}>
            {!messages.length ? (
              <div className="quick-ai-welcome">
                <div className="quick-ai-welcome-symbol" aria-hidden>✦</div>
                <strong>Un point de gynéco ?</strong>
                <p>Une notion à éclaircir, une question courte ou simplement envie d’échanger ? Je vous écoute.</p>
                <div>{SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion.label} type="button" onClick={() => void ask(suggestion.question)}><span>{suggestion.label}</span><span aria-hidden>↗</span></button>
                ))}</div>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`quick-ai-message quick-ai-${message.role}`}>
                <span className="sr-only">{message.role === "user" ? "Vous : " : "Hawae : "}</span>
                {message.text || (message.status === "pending" ? <span className="quick-ai-typing" aria-label="Hawae prépare sa réponse"><i /><i /><i /></span> : null)}
                {message.status === "cancelled" ? <span className="quick-ai-message-status">Réponse interrompue</span> : message.status === "error" ? <span className="quick-ai-message-status">Réponse non terminée</span> : null}
              </div>
            ))}
          </div>
          {error ? <p className="quick-ai-error" role="alert">{error}</p> : null}
          <form onSubmit={submit} className="quick-ai-form">
            <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
              }}
              maxLength={2000} rows={2} placeholder="Une petite question…" aria-label="Votre question de gynécologie" enterKeyHint="send" />
            {loading ? <button type="button" onClick={stop} aria-label="Arrêter la réponse" title="Arrêter"><span className="quick-ai-stop" aria-hidden /></button>
              : <button type="submit" disabled={!question.trim()} aria-label="Envoyer la question" title="Envoyer">↑</button>}
          </form>
          <p className="quick-ai-disclaimer">Échanges informatifs · pour un cas patient, utilisez l’analyse du dossier.</p>
        </section>
      ) : null}
      <button ref={triggerRef} type="button" className="quick-ai-trigger" onClick={() => open ? close() : setOpen(true)} aria-label={open ? "Fermer la discussion avec Hawae" : "Ouvrir la discussion avec Hawae"} aria-expanded={open} aria-controls={open ? panelId : undefined} aria-haspopup="dialog">
        <span aria-hidden>✦</span><span>Un mot avec Hawae</span>
      </button>
    </div>
  );
}
