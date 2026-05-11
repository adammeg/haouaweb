"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { HawaeIaExchange, PatientSnapshot } from "@/types/domain";
import {
  buildDossierContextForIa,
  stableClinicalDataKey,
} from "@/lib/ia/build-dossier-context";
import { useHawaeStore } from "@/stores/hawae-store";

async function consumeIaResponse(
  res: Response,
  onStreamChunk: (text: string) => void,
): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";

  if (res.status === 401) {
    throw new Error("Session expirée. Reconnectez-vous.");
  }
  if (res.status === 429) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Trop de requêtes. Patientez un instant.");
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
    };
    const msg = [data.error, data.detail].filter(Boolean).join(" — ");
    throw new Error(msg || res.statusText);
  }

  if (ct.includes("application/json")) {
    const data = (await res.json()) as { reply?: string };
    const t = data.reply ?? "";
    onStreamChunk(t);
    return t;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Réponse vide du serveur.");

  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    onStreamChunk(acc);
  }
  return acc;
}

function appendIaToDraft(
  patchDraft: (p: Partial<PatientSnapshot>) => void,
  entry: Omit<HawaeIaExchange, "id"> & { id?: string },
) {
  const st = useHawaeStore.getState();
  const d = st.draft;
  if (!d?.id) return;
  const row: HawaeIaExchange = {
    ...entry,
    id: entry.id ?? `ia_${nanoid(12)}`,
  };
  patchDraft({
    hawaeIaHistory: [...(d.hawaeIaHistory ?? []), row].slice(-60),
  });
}

export function HawaePanel({ draft }: { draft: PatientSnapshot | null }) {
  const patchDraft = useHawaeStore((s) => s.patchDraft);

  const dataKey = draft ? stableClinicalDataKey(draft) : "";
  const previewContext = draft ? buildDossierContextForIa(draft) : "";
  const iaCount = draft?.hawaeIaHistory?.length ?? 0;

  const [diagnosticText, setDiagnosticText] = useState("");
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagErr, setDiagErr] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [q, setQ] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [followErr, setFollowErr] = useState<string | null>(null);

  const abortDiagRef = useRef<AbortController | null>(null);
  const abortFollowRef = useRef<AbortController | null>(null);
  const diagRunIdRef = useRef(0);

  const runFollowUp = useCallback(async () => {
    if (!draft || !q.trim()) return;
    setFollowLoading(true);
    setFollowErr(null);
    setFollowUpText("");
    const ac = new AbortController();
    abortFollowRef.current = ac;
    const qTrim = q.trim();
    try {
      const dNow = useHawaeStore.getState().draft;
      const summary = dNow ? buildDossierContextForIa(dNow) : "";
      const res = await fetch("/api/ia", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "question",
          question: qTrim,
          dossierSummary: summary,
        }),
      });
      const final = await consumeIaResponse(res, setFollowUpText);
      const key = stableClinicalDataKey(useHawaeStore.getState().draft);
      appendIaToDraft(patchDraft, {
        mode: "question",
        question: qTrim,
        reply: final,
        contextKeyAtGeneration: key || dataKey,
        at: new Date().toISOString(),
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setFollowErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      abortFollowRef.current = null;
      setFollowLoading(false);
    }
  }, [draft, q, dataKey, patchDraft]);

  useEffect(() => {
    if (!draft?.id) return;

    const runId = ++diagRunIdRef.current;
    abortDiagRef.current?.abort();
    const ac = new AbortController();
    abortDiagRef.current = ac;

    if (refreshNonce === 0) {
      const history = draft.hawaeIaHistory ?? [];
      const lastDiag = [...history]
        .reverse()
        .find((e) => e.mode === "diagnostic");
      if (
        lastDiag?.reply &&
        lastDiag.contextKeyAtGeneration === dataKey
      ) {
        setDiagnosticText(lastDiag.reply);
        setDiagLoading(false);
        setDiagErr(null);
        return;
      }
    }

    const timer = window.setTimeout(async () => {
      if (runId !== diagRunIdRef.current) return;
      setDiagLoading(true);
      setDiagErr(null);
      setDiagnosticText("");
      try {
        const dNow = useHawaeStore.getState().draft;
        const summary = dNow ? buildDossierContextForIa(dNow) : "";
        const res = await fetch("/api/ia", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "diagnostic",
            dossierSummary: summary,
            stream: true,
          }),
        });
        let final = "";
        const onChunk = (text: string) => {
          final = text;
          setDiagnosticText(text);
        };
        final = await consumeIaResponse(res, onChunk);
        const keyNow = stableClinicalDataKey(useHawaeStore.getState().draft);
        appendIaToDraft(patchDraft, {
          mode: "diagnostic",
          reply: final,
          contextKeyAtGeneration: keyNow || dataKey,
          at: new Date().toISOString(),
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setDiagErr(e instanceof Error ? e.message : "Erreur");
      } finally {
        setDiagLoading(false);
        setRefreshNonce((n) => (n > 0 ? 0 : n));
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
    /**
     * `draft.hawaeIaHistory` n'est lu qu'à titre de cache (pour afficher la
     * dernière analyse correspondant au `dataKey` courant). L'inclure dans les
     * deps déclencherait une boucle infinie puisque l'effet écrit lui-même
     * dans `hawaeIaHistory` via `appendIaToDraft`. Les vraies dépendances sont
     * `draft?.id`, `dataKey` et `refreshNonce`.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id, dataKey, refreshNonce, patchDraft]);

  function stopDiagnostic() {
    abortDiagRef.current?.abort();
    setDiagLoading(false);
  }

  function stopFollowUp() {
    abortFollowRef.current?.abort();
    setFollowLoading(false);
  }

  async function copyDiagnostic() {
    if (!diagnosticText.trim() || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(diagnosticText);
    } catch {
      setDiagErr("Copie impossible dans ce navigateur.");
    }
  }

  async function copyFollowUp() {
    if (!followUpText.trim() || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(followUpText);
    } catch {
      setFollowErr("Copie impossible dans ce navigateur.");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Les analyses et réponses sont{" "}
        <strong className="text-[var(--ink)]">enregistrées sur le dossier patient</strong> (local +
        synchro compte) et réinjectées dans les prochains échanges avec le modèle, avec l’ordonnance
        et les données cliniques. Configurez{" "}
        <code className="rounded bg-[var(--cream)] px-1">OPENROUTER_API_KEY</code> ou{" "}
        <code className="rounded bg-[var(--cream)] px-1">OPENAI_API_KEY</code>. Sortie informative :
        décision médicale sous votre responsabilité.
      </p>
      {iaCount > 0 && (
        <p className="text-xs text-[var(--teal)]">
          {iaCount} échange{iaCount > 1 ? "s" : ""} Hawae déjà enregistré{iaCount > 1 ? "s" : ""} sur ce
          dossier (rechargés dans le contexte IA).
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[var(--teal)]">
            Analyse diagnostique (automatique)
          </h2>
          <div className="flex flex-wrap gap-2">
            {diagLoading && (
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium"
                onClick={stopDiagnostic}
              >
                Arrêter
              </button>
            )}
            <button
              type="button"
              disabled={diagLoading}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              onClick={() => setRefreshNonce((n) => n + 1)}
            >
              Mettre à jour l’analyse
            </button>
            {!!diagnosticText.trim() && !diagLoading && (
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium"
                onClick={copyDiagnostic}
              >
                Copier
              </button>
            )}
          </div>
        </div>
        {diagErr && (
          <p className="text-sm text-red-600" role="alert">
            {diagErr}
          </p>
        )}
        {diagLoading && !diagnosticText && (
          <p className="text-sm text-[var(--muted)]">Génération de l’analyse à partir du dossier…</p>
        )}
        {diagnosticText && (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">
              {diagnosticText}
            </pre>
          </div>
        )}
      </section>

      <details className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/30 p-4">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--ink-mid)]">
          Voir le contexte envoyé au modèle (dossier + ordonnance + historique Hawae)
        </summary>
        <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--ink-mid)]">
          {previewContext || "Aucun champ renseigné."}
        </pre>
      </details>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--ink)]">
          Question complémentaire
        </h2>
        <textarea
          className="min-h-[90px] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm shadow-sm focus:border-[var(--teal)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
          placeholder="Affinez un point clinique, demandez une piste de suivi…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={followLoading || !q.trim()}
            className="rounded-xl bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
            onClick={runFollowUp}
          >
            {followLoading ? "Réponse…" : "Envoyer à Hawae"}
          </button>
          {followLoading && (
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium"
              onClick={stopFollowUp}
            >
              Arrêter
            </button>
          )}
          {!!followUpText.trim() && !followLoading && (
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium"
              onClick={copyFollowUp}
            >
              Copier la réponse
            </button>
          )}
        </div>
        {followErr && (
          <p className="text-sm text-red-600" role="alert">
            {followErr}
          </p>
        )}
        {followUpText && (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">
              {followUpText}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
