"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useHawaeStore } from "@/stores/hawae-store";

type Message = { id: number; role: "user" | "assistant"; text: string };
const SUGGESTIONS = [
  "Quels sont les principaux red flags à vérifier ?",
  "Résume les recommandations utiles en quelques points.",
  "Quelles informations manquent avant de décider ?",
];

export function QuickAiBubble() {
  const patientId = useHawaeStore((s) => s.currentPatientId);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  async function ask(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;
    const assistantId = nextId.current + 1;
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text },
      { id: nextId.current++, role: "assistant", text: "" },
    ]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text, patientId: patientId ?? undefined, mode: "question", stream: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "L’assistant est momentanément indisponible.");
      }
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json() as { reply?: string };
        setMessages((current) => current.map((message) =>
          message.id === assistantId
            ? { ...message, text: data.reply || "Aucune réponse disponible." }
            : message
        ));
        return;
      }
      if (!res.body) throw new Error("Réponse vide.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) =>
          message.id === assistantId ? { ...message, text: reply } : message
        ));
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Une erreur est survenue.";
      setMessages((current) => current.map((message) =>
        message.id === assistantId ? { ...message, text } : message
      ));
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="quick-ai">
      {open ? (
        <section className="quick-ai-panel" aria-label="Assistant IA rapide">
          <header className="quick-ai-header">
            <div className="quick-ai-mark" aria-hidden>✦</div>
            <div className="min-w-0 flex-1">
              <h2>Hawae AI</h2>
              <p>{patientId ? "Dossier actif pris en compte" : "Question générale"}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l’assistant">×</button>
          </header>
          <div className="quick-ai-messages" aria-live="polite">
            {!messages.length ? (
              <div className="quick-ai-welcome">
                <strong>Bonjour Docteur</strong>
                <p>Posez une question courte. Si un dossier est ouvert, sa synthèse sera utilisée automatiquement.</p>
                <div>{SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => void ask(suggestion)}>{suggestion}</button>
                ))}</div>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`quick-ai-message quick-ai-${message.role}`}>
                {message.text || <span className="quick-ai-typing"><i /><i /><i /></span>}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit} className="quick-ai-form">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={4000}
              rows={1}
              placeholder="Votre question…"
              disabled={loading}
              aria-label="Question pour Hawae AI"
            />
            <button type="submit" disabled={loading || !question.trim()} aria-label="Envoyer">↑</button>
          </form>
          <p className="quick-ai-disclaimer">Aide informative — décision médicale sous votre responsabilité.</p>
        </section>
      ) : null}
      <button type="button" className="quick-ai-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span aria-hidden>✦</span><span>Demander à Hawae</span>
      </button>
    </div>
  );
}
