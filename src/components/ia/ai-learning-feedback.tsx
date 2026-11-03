"use client";
import { useEffect, useRef, useState } from "react";

export function AiLearningFeedback({ generationId, patientId, revision }: { generationId: string; patientId: string; revision: string }) {
  const [editing, setEditing] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [correction, setCorrection] = useState("");
  const [rationale, setRationale] = useState("");
  const [outcome, setOutcome] = useState("pending");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function submit(verdict: "helpful" | "rejected" | "corrected") {
    setBusy(true); setMessage(""); setError("");
    const ac = new AbortController(); abortRef.current = ac;
    try {
      const res = await fetch("/api/ia/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
        body: JSON.stringify({ generationId, patientId, revision, verdict, outcome: verdict === "corrected" ? outcome : "pending", confirmedDiagnosis: diagnosis, correctedResponse: correction, rationale, confirmedByClinician: verdict === "corrected" && confirmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Retour non enregistré");
      setMessage(data.use === "reviewed_memory" ? "Cas revu enregistré pour les futures réponses pertinentes." : data.use === "evaluation_holdout" ? "Cas revu réservé à l’évaluation des réponses." : "Avis enregistré. Il ne devient pas une preuve clinique.");
      setEditing(false);
    } catch (e) { if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "Retour non enregistré"); }
    finally { if (!ac.signal.aborted) setBusy(false); }
  }
  return (
    <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/20 p-4 text-sm">
      <p className="font-semibold">Améliorer les prochaines réponses</p>
      <p className="mt-1 text-xs text-[var(--muted)]">Évaluez cette réponse ou ajoutez votre correction. Seuls les cas confirmés par le praticien peuvent aider les réponses futures ; certains restent réservés à l’évaluation.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} className="rounded-lg border bg-white px-3 py-1.5 text-xs" onClick={() => void submit("helpful")}>Utile</button>
        <button type="button" disabled={busy} className="rounded-lg border bg-white px-3 py-1.5 text-xs" onClick={() => void submit("rejected")}>Réponse incorrecte</button>
        <button type="button" disabled={busy} className="rounded-lg border bg-white px-3 py-1.5 text-xs" onClick={() => setEditing(!editing)}>Saisir une correction clinique</button>
      </div>
      {editing ? <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void submit("corrected"); }}>
        <label className="block text-xs">Diagnostic ou conclusion clinique retenue
          <input required maxLength={240} className="mt-1 w-full rounded-lg border bg-white p-2" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </label>
        <label className="block text-xs">Votre réponse corrigée, avec les limites et la conduite à discuter
          <textarea required maxLength={4000} rows={5} className="mt-1 w-full rounded-lg border bg-white p-2" value={correction} onChange={(e) => setCorrection(e.target.value)} />
        </label>
        <label className="block text-xs">Éléments cliniques, examens ou évolution qui justifient cette conclusion
          <textarea required maxLength={1200} rows={3} className="mt-1 w-full rounded-lg border bg-white p-2" value={rationale} onChange={(e) => setRationale(e.target.value)} />
        </label>
        <label className="block text-xs">État de confirmation
          <select className="ml-2 rounded-lg border bg-white p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="pending">À confirmer — ne pas réutiliser</option><option value="confirmed">Confirmé par le bilan ou l’évolution</option></select>
        </label>
        {outcome === "confirmed" ? <label className="flex items-start gap-2 text-xs"><input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Je confirme les éléments cliniques et j’ai retiré les identifiants de ces textes.</label> : null}
        <button type="submit" disabled={busy} className="rounded-lg bg-[var(--teal)] px-4 py-2 text-xs font-semibold text-white">{busy ? "Enregistrement…" : "Enregistrer ma correction"}</button>
      </form> : null}
      {message ? <p className="mt-3 text-xs text-[var(--green)]" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-700" role="alert">{error}</p> : null}
    </section>
  );
}
