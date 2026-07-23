"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { HawaeIaExchange, PatientSnapshot } from "@/types/domain";
import {
  profileFromSnapshot,
  runAssist,
  type AssistRunResult,
} from "@/lib/assist";
import { AssistPanel } from "@/components/assist/assist-panel";
import {
  buildDossierContextForIa,
  stableClinicalDataKey,
} from "@/lib/ia/build-dossier-context";
import { getRagChunkCount } from "@/lib/rag/rag-engine";
import { useHawaeStore } from "@/stores/hawae-store";
import type {
  ClinicalAiAnalysis,
  ClinicalConfidence,
  ClinicalUrgency,
} from "@/lib/ia/clinical-analysis-schema";

/* ── Progression déterministe ── */
const PROGRESS: Record<string, number> = {
  idle: 0,
  scores: 15,
  context: 20,
};

/** Texte de statut affiché sous la barre selon la phase */
const STEP_LABELS: Record<string, string> = {
  scores: "Calcul des scores cliniques…",
  context: "Construction du dossier synthétique…",
  llm: "Analyse par l'assistant Hawae…",
};

async function consumeIaResponse(
  res: Response,
  onProgress?: (bytes: number) => void,
): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  if (res.status === 401) throw new Error("Session expirée. Reconnectez-vous.");
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
    onProgress?.(t.length);
    return t;
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Réponse vide du serveur.");
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    acc += text;
    onProgress?.(acc.length);
  }
  return acc;
}

function generationMeta(res: Response) {
  return {
    provider: res.headers.get("X-Hawae-AI-Provider") ?? undefined,
    model: res.headers.get("X-Hawae-AI-Model") ?? undefined,
    promptVersion: res.headers.get("X-Hawae-Prompt-Version") ?? undefined,
  };
}

async function consumeDiagnosticResponse(res: Response): Promise<{
  reply: string;
  analysis: ClinicalAiAnalysis;
  meta: { provider?: string; model?: string; promptVersion?: string };
}> {
  const data = (await res.json().catch(() => ({}))) as {
    reply?: string;
    analysis?: ClinicalAiAnalysis;
    error?: string;
    detail?: string;
    meta?: { provider?: string; model?: string; promptVersion?: string };
  };
  if (!res.ok) {
    throw new Error([data.error, data.detail].filter(Boolean).join(" — ") || res.statusText);
  }
  if (!data.reply || !data.analysis) throw new Error("Analyse clinique structurée absente.");
  return { reply: data.reply, analysis: data.analysis, meta: data.meta ?? {} };
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

/** Barre de progression réutilisable */
function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--ink-mid)]">
        <span>{label}</span>
        <span className="font-semibold tabular-nums text-[var(--teal)]">
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--teal-pale)]/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-teal-400 transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const CONFIDENCE_LABEL: Record<ClinicalConfidence, string> = {
  strongly_supported: "Fortement étayée",
  plausible: "Plausible",
  must_exclude: "À éliminer",
  insufficient_information: "Informations insuffisantes",
};
const URGENCY_LABEL: Record<ClinicalUrgency, string> = {
  none: "Aucune urgence identifiée",
  routine: "Suivi habituel",
  rapid: "Évaluation rapide",
  immediate: "Évaluation immédiate",
};

function StructuredClinicalAnalysis({ analysis }: { analysis: ClinicalAiAnalysis }) {
  return (
    <div className="space-y-5 text-sm text-[var(--ink)]">
      <section>
        <h4 className="mb-2 font-display text-sm font-bold text-[var(--teal)]">Synthèse clinique</h4>
        <ul className="list-disc space-y-1 pl-5">{analysis.summary.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section>
        <h4 className="mb-2 font-display text-sm font-bold text-[var(--teal)]">Hypothèses à discuter</h4>
        <div className="space-y-3">
          {analysis.hypotheses.length ? analysis.hypotheses.map((h, i) => (
            <article key={`${h.label}-${i}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{h.label}</strong>
                <span className="rounded-full bg-[var(--teal-pale)] px-2 py-0.5 text-[10px] font-bold text-[var(--teal)]">{CONFIDENCE_LABEL[h.confidence]}</span>
              </div>
              {h.supportingFacts.length ? <p className="mt-2 text-xs text-[var(--ink-mid)]"><strong>Éléments en faveur :</strong> {h.supportingFacts.join(" · ")}</p> : null}
              {h.limitingFacts.length ? <p className="mt-1 text-xs text-[var(--muted)]"><strong>Limites :</strong> {h.limitingFacts.join(" · ")}</p> : null}
            </article>
          )) : <p className="text-xs text-[var(--muted)]">Aucune hypothèse structurée.</p>}
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-display text-sm font-bold text-[var(--red)]">Signaux d&apos;alerte</h4>
        <div className="space-y-2">
          {analysis.redFlags.length ? analysis.redFlags.map((f, i) => (
            <div key={`${f.label}-${i}`} className="rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong>{f.label}</strong><span className="text-[10px] font-bold uppercase text-red-700">{URGENCY_LABEL[f.urgency]}</span></div>
              <p className="mt-1 text-xs text-red-900">{f.rationale}</p>
            </div>
          )) : <p className="text-xs text-[var(--muted)]">Aucun signal d&apos;alerte ajouté par le modèle. Les alertes déterministes restent prioritaires.</p>}
        </div>
      </section>

      {([
        ["Informations à compléter", analysis.missingInformation],
        ["Examens à discuter", analysis.suggestedInvestigations],
        ["Orientation et suivi", analysis.followUp],
        ["Limites de l’analyse", analysis.limitations],
      ] as const).map(([title, items]) => items.length ? (
        <section key={title}><h4 className="mb-2 font-display text-sm font-bold text-[var(--ink)]">{title}</h4><ul className="list-disc space-y-1 pl-5">{items.map((x) => <li key={x}>{x}</li>)}</ul></section>
      ) : null)}

      {analysis.citations.length ? (
        <section className="border-t border-[var(--border)] pt-3">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Références déclarées</h4>
          <ul className="space-y-1 text-xs text-[var(--ink-mid)]">{analysis.citations.map((c, i) => <li key={`${c.source}-${c.title}-${i}`}>[{c.source}{c.year ? ` ${c.year}` : ""}] {c.title}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

export function HawaeUnifiedPanel({
  draft,
}: {
  draft: PatientSnapshot | null;
}) {
  const patchDraft = useHawaeStore((s) => s.patchDraft);
  const dataKey = draft ? stableClinicalDataKey(draft) : "";

  /* ── Scores engine (client-side) ── */
  const [scoresResult, setScoresResult] = useState<AssistRunResult | null>(
    () => {
      if (!draft?.hawaeAssistResultJson) return null;
      try {
        return JSON.parse(draft.hawaeAssistResultJson) as AssistRunResult;
      } catch {
        return null;
      }
    },
  );

  /* ── LLM diagnostic ── */
  const [diagnosticText, setDiagnosticText] = useState("");
  const [structuredAnalysis, setStructuredAnalysis] = useState<ClinicalAiAnalysis | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagErr, setDiagErr] = useState<string | null>(null);
  const abortDiagRef = useRef<AbortController | null>(null);
  const diagRunIdRef = useRef(0);

  /* ── Suivi LLM (questions) ── */
  const [q, setQ] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [followErr, setFollowErr] = useState<string | null>(null);
  const abortFollowRef = useRef<AbortController | null>(null);

  /* ── Progression ── */
  const [progress, setProgress] = useState(0);
  const ragCount = getRagChunkCount();
  const [phase, setPhase] = useState<
    "idle" | "scores" | "context" | "llm" | "done"
  >("idle");

  /**
   * Phase 1 : lancer les scores cliniques (client-side)
   * Phase 2 : déclencher le LLM (serveur)
   */
  const runFullAnalysis = useCallback(() => {
    if (!draft?.id) return;
    abortDiagRef.current?.abort();

    const runId = ++diagRunIdRef.current;
    const ac = new AbortController();
    abortDiagRef.current = ac;

    // Vérifier cache IA
    const history = draft.hawaeIaHistory ?? [];
    const lastDiag = [...history]
      .reverse()
      .find((e) => e.mode === "diagnostic");
    if (
      lastDiag?.reply &&
      lastDiag.contextKeyAtGeneration === dataKey &&
      draft.hawaeAssistResultJson
    ) {
      setDiagnosticText(lastDiag.reply);
      if (lastDiag.structuredAnalysisJson) {
        try {
          setStructuredAnalysis(JSON.parse(lastDiag.structuredAnalysisJson) as ClinicalAiAnalysis);
        } catch {
          setStructuredAnalysis(null);
        }
      }
      setPhase("done");
      setProgress(100);
      return;
    }

    // Phase 1 : scores cliniques (client-side, synchrone)
    setDiagLoading(true);
    setPhase("scores");
    setProgress(PROGRESS.scores);
    setDiagErr(null);
    setDiagnosticText("");
    setStructuredAnalysis(null);

    const profile = profileFromSnapshot(draft);
    const sr = runAssist(profile);
    setScoresResult(sr);
    patchDraft({
      hawaeAssistResultJson: JSON.stringify(sr),
      hawaeAssistAt: new Date().toISOString(),
    });

    // Phase 2 : contexte (très rapide, synchrone)
    setPhase("context");
    setProgress(PROGRESS.context);

    // Phase 3 : LLM
    setPhase("llm");
    setDiagLoading(true);

    window.setTimeout(async () => {
      if (runId !== diagRunIdRef.current) return;
      try {
        const dNow = useHawaeStore.getState().draft;
        const res = await fetch("/api/ia", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "diagnostic",
            patientId: dNow?.id,
            stream: false,
          }),
        });
        const result = await consumeDiagnosticResponse(res);
        const final = result.reply;
        const meta = result.meta;
        setDiagnosticText(final);
        setStructuredAnalysis(result.analysis);
        setProgress(100);
        const keyNow = stableClinicalDataKey(
          useHawaeStore.getState().draft,
        );
        appendIaToDraft(patchDraft, {
          mode: "diagnostic",
          reply: final,
          contextKeyAtGeneration: keyNow || dataKey,
          at: new Date().toISOString(),
          ...meta,
          structuredAnalysisJson: JSON.stringify(result.analysis),
        });
        setPhase("done");
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setDiagErr(e instanceof Error ? e.message : "Erreur");
        setPhase("done");
        setProgress(100);
      } finally {
        setDiagLoading(false);
      }
    }, 200);
  }, [draft, dataKey, patchDraft]);

  /* Déclenchement automatique à l'ouverture */
  const scoredPatientRef = useRef<string | null>(null);
  useEffect(() => {
    if (!draft?.id || scoredPatientRef.current === draft.id) return;
    scoredPatientRef.current = draft.id;
    const profile = profileFromSnapshot(draft);
    const result = runAssist(profile);
    setScoresResult(result);
    patchDraft({
      hawaeAssistResultJson: JSON.stringify(result),
      hawaeAssistAt: new Date().toISOString(),
    });
    const lastDiag = [...(draft.hawaeIaHistory ?? [])]
      .reverse()
      .find((entry) => entry.mode === "diagnostic");
    if (lastDiag?.contextKeyAtGeneration === dataKey) {
      setDiagnosticText(lastDiag.reply);
      if (lastDiag.structuredAnalysisJson) {
        try {
          setStructuredAnalysis(JSON.parse(lastDiag.structuredAnalysisJson) as ClinicalAiAnalysis);
        } catch {
          setStructuredAnalysis(null);
        }
      }
      setPhase("done");
      setProgress(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  /* ── Q&R ── */
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
      const res = await fetch("/api/ia", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "question",
          question: qTrim,
          patientId: dNow?.id,
        }),
      });
      const meta = generationMeta(res);
      const final = await consumeIaResponse(res);
      setFollowUpText(final);
      const key = stableClinicalDataKey(useHawaeStore.getState().draft);
      appendIaToDraft(patchDraft, {
        mode: "question",
        question: qTrim,
        reply: final,
        contextKeyAtGeneration: key || dataKey,
        at: new Date().toISOString(),
        ...meta,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setFollowErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      abortFollowRef.current = null;
      setFollowLoading(false);
    }
  }, [draft, q, dataKey, patchDraft]);

  const isWorking = phase !== "idle" && phase !== "done" || diagLoading;
  const progressLabel =
    phase === "llm"
      ? "Analyse par l'assistant Hawae…"
      : STEP_LABELS[phase] ?? "Analyse en cours…";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span
          id="hawae-rag-badge"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#d6f0ef] shadow-md"
          style={{
            background: "linear-gradient(135deg,#0a5c5c 0%,#1a8c7c 100%)",
            boxShadow: "0 2px 8px rgba(10,92,92,0.4)",
          }}
          title="Base de connaissances RAG sélectionnée côté serveur selon le dossier"
        >
          <span aria-hidden>📚</span>
          <span id="hawae-rag-count">{ragCount} guidelines</span>
        </span>
      </div>
      {/* Bannière avec barre de progression déterministe */}
      {isWorking ? (
        <div className="rounded-xl border border-[var(--teal)]/40 bg-[var(--teal-pale)]/50 px-5 py-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--teal)] border-t-transparent" />
            <span className="text-sm font-semibold text-[var(--teal)]">
              Hawae analyse le dossier…
            </span>
          </div>
          <ProgressBar value={progress} label={progressLabel} />
        </div>
      ) : null}

      {/* Barre d'actions */}
      <div className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold-surface)] px-4 py-3 text-xs leading-relaxed text-[var(--ink-mid)]">
        <strong>Analyse externe sur demande.</strong> Le serveur vérifie l&apos;accès au dossier et retire le nom, le CIN, le téléphone et la date de naissance exacte avant l&apos;envoi. Les scores cliniques restent calculés localement.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-[var(--teal)]">
          Analyse Hawae — scores cliniques + intelligence artificielle
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {diagLoading && (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium"
              onClick={() => {
                abortDiagRef.current?.abort();
                setDiagLoading(false);
                setPhase("done");
                setProgress(100);
              }}
            >
              Arrêter
            </button>
          )}
          <button
            type="button"
            disabled={diagLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--teal)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            onClick={runFullAnalysis}
          >
            {diagLoading ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>
                  {phase === "scores"
                    ? "Scores cliniques…"
                    : phase === "context"
                      ? "Construction du dossier…"
                      : "Analyse IA en cours…"}
                </span>
              </>
            ) : (
            "🔐 Lancer l'analyse IA"
            )}
          </button>
        </div>
      </div>

      {/* Bloc scores cliniques */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          🧮 Moteur de scores cliniques (19 scores)
        </h3>
        <AssistPanel
          result={scoresResult}
          emptyMessage="Analyse en cours — calcul des scores cliniques…"
        />
      </div>

      {/* Bloc analyse LLM */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          🤖 Analyse diagnostique (Hawae IA)
        </h3>
        {diagErr && (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {diagErr}
          </p>
        )}
        {structuredAnalysis ? (
          <StructuredClinicalAnalysis analysis={structuredAnalysis} />
        ) : diagnosticText ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--ink)]">
            {diagnosticText}
          </pre>
        ) : !diagLoading ? (
          <p className="text-sm text-[var(--muted)]">
            Cliquez sur « Relancer l&apos;analyse complète » pour générer
            l&apos;analyse.
          </p>
        ) : null}

        {/* Copier le diagnostic */}
        {!!diagnosticText.trim() && !diagLoading && (
          <button
            type="button"
            className="mt-3 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium"
            onClick={() => {
              if (!diagnosticText.trim() || !navigator.clipboard) return;
              navigator.clipboard.writeText(diagnosticText).catch(() => {});
            }}
          >
            Copier l&apos;analyse
          </button>
        )}
      </div>

      {/* Contexte envoyé (détails repliables) */}
      <details className="rounded-xl border border-[var(--border)] bg-[var(--teal-pale)]/30 p-4">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--ink-mid)]">
          Aperçu pseudonymisé du contexte clinique (le serveur vérifie et reconstruit le dossier)
        </summary>
        <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--ink-mid)]">
          {draft ? buildDossierContextForIa(draft) || "Aucun champ renseigné." : ""}
        </pre>
      </details>

      {/* ── Q&R ── */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-[var(--ink)]">
          Question complémentaire
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Posez une question sur le dossier. Le contexte clinique complet
          (données + scores) sera envoyé à l&apos;IA.
        </p>
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
              onClick={() => {
                abortFollowRef.current?.abort();
                setFollowLoading(false);
              }}
            >
              Arrêter
            </button>
          )}
          {!!followUpText.trim() && !followLoading && (
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium"
              onClick={() => {
                if (!followUpText.trim() || !navigator.clipboard) return;
                navigator.clipboard.writeText(followUpText).catch(() => {});
              }}
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

      <p className="text-center text-[10px] text-[var(--muted)]">
        Hawae v2.2 — Aide à la décision uniquement. Ne remplace pas le jugement
        clinique.
      </p>
    </div>
  );
}
