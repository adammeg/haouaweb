import { SEED_KB, type RagChunk } from "./knowledge-base";
import { REFERENTIEL, REFERENTIEL_VERSION, getPathology, type RefPathology, type RefPriority } from "./referentiel";
import { SOURCE_PRINCIPLES } from "./referentiel-annexes";
import { KNOWLEDGE_VERSION } from "@/lib/ia/versions";

/** Superseded or withdrawn sources are never offered to generation. */
const ACTIVE_KB: RagChunk[] = SEED_KB.filter((chunk) => chunk.status === "en_vigueur" || chunk.status === "en_revision");

const STOP_WORDS = new Set("le la les de du des un une et en est pour par sur avec dans qui que ou si au aux ce se ne pas sont ont etre avoir mais comme il elle ils elles on leur nous vous tout cette aussi tres bien meme dont lors car donc puis chez sans sous apres avant entre peut plus".split(" "));
const ABBREVIATIONS = new Set(["pe", "dv", "ao", "ip", "nt", "cl", "lh", "t1", "t2"]);
const SYNONYMS: Record<string, string[]> = {
  pe: ["preeclampsie"], preeclampsie: ["pe"], rciu: ["fgr"], fgr: ["rciu"],
  cfa: ["afc"], afc: ["cfa"], fiv: ["ivf"], ivf: ["fiv"],
  dv: ["ductus"], ao: ["ombilicale"], acm: ["cerebrale"], sopk: ["pcos"], pcos: ["sopk"],
};
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/pre[\s-]+eclampsie/g, "preeclampsie");
}
function tokens(text: string, expand = false): string[] {
  const base = normalize(text).replace(/[^\w\s]/g, " ").split(/\s+/).filter((t) => (t.length > 2 || ABBREVIATIONS.has(t)) && !STOP_WORDS.has(t));
  return expand ? [...new Set(base.flatMap((t) => [t, ...(SYNONYMS[t] ?? [])]))] : base;
}

export type RagHit = { chunk: RagChunk; score: number; matchedTerms: string[] };
let index: { freq: Map<string, number>; length: number }[] | undefined;
let df: Map<string, number>;
let averageLength: number;
function ensureIndex() {
  if (index) return;
  df = new Map();
  index = ACTIVE_KB.map((chunk) => {
    const words = tokens(`${chunk.title} ${chunk.text} ${chunk.topic} ${chunk.keywords.join(" ")} ${chunk.keywords.join(" ")}`);
    const freq = new Map<string, number>();
    for (const word of words) freq.set(word, (freq.get(word) ?? 0) + 1);
    for (const word of freq.keys()) df.set(word, (df.get(word) ?? 0) + 1);
    return { freq, length: words.length };
  });
  averageLength = index.reduce((n, d) => n + d.length, 0) / Math.max(1, index.length);
}

/** Shared scoring for generation, UI, and evaluation. Scores are lexical, not confidence. */
export function ragSearch(query: string, topK = 5): RagHit[] {
  ensureIndex();
  const words = tokens(query, true);
  if (!words.length || !Number.isFinite(topK) || topK <= 0) return [];
  const normalized = normalize(query);
  return ACTIVE_KB.map((chunk, i) => {
    const document = index![i];
    const matchedTerms = words.filter((t) => document.freq.has(t));
    let score = matchedTerms.reduce((total, term) => {
      const f = document.freq.get(term)!;
      const n = df.get(term)!;
      const idf = Math.log(1 + (ACTIVE_KB.length - n + 0.5) / (n + 0.5));
      return total + idf * f * 2.5 / (f + 1.5 * (0.25 + 0.75 * document.length / averageLength));
    }, 0);
    const exactKeywords = chunk.keywords.filter((kw) => normalized.includes(normalize(kw))).length;
    score *= 1 + Math.min(3, exactKeywords) * 0.1;
    // Une fiche de synthèse passe avant une fiche d'orientation de pertinence voisine.
    if (chunk.kind === "orientation") score *= 0.8;
    return { chunk, score, matchedTerms };
  }).filter((hit) => hit.score > 0.05).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id)).slice(0, Math.floor(topK));
}

export function retrieveRagChunks(query: string, topK = 4): RagChunk[] {
  return ragSearch(query, topK).map((hit) => hit.chunk);
}
export function getRagChunkCount(): number { return ACTIVE_KB.length; }

/** Retrieve the question independently so patient narratives cannot displace it. */
export function retrieveRagEvidence(question: string, patientQuery = "", topK = 4): RagHit[] {
  const candidates = [...ragSearch(question, topK), ...ragSearch(patientQuery, topK * 2)];
  const seen = new Set<string>();
  const selected: RagHit[] = [];
  for (const hit of candidates) {
    if (seen.has(hit.chunk.id)) continue;
    seen.add(hit.chunk.id);
    selected.push(hit);
    if (selected.length === topK) break;
  }
  return selected;
}

/** Evidence data only. Grounding policy belongs in the system prompt. */
export function formatRagEvidence(hits: RagHit[]): string {
  return JSON.stringify({
    knowledgeVersion: KNOWLEDGE_VERSION,
    referentielVersion: REFERENTIEL_VERSION,
    sourcePrinciples: SOURCE_PRINCIPLES,
    status: hits.length ? "excerpts_available" : "no_relevant_evidence",
    excerpts: hits.map(({ chunk }) => ({
      chunkId: chunk.id,
      kind: chunk.kind ?? "synthese",
      referentielDocuments: referentielDocumentsFor(chunk),
      pathologyIds: chunk.pathologyIds,
      source: chunk.source,
      title: chunk.title,
      year: chunk.year,
      sourceUrl: chunk.sourceUrl ?? null,
      status: chunk.status,
      reviewStatus: chunk.reviewStatus,
      reviewNote: chunk.reviewNote ?? null,
      evidenceAsDeclared: chunk.evidence,
      references: chunk.references.map((r) => `${r.society} — ${r.title}${r.year ? ` (${r.year})` : ""}${r.check === "a_reconfirmer" ? " [version à reconfirmer]" : ""}`),
      divergences: chunk.divergences ?? [],
      text: chunk.text,
    })),
  });
}

/** Référentiel pathologies that only have an orientation fiche (no clinical synthesis yet), optionally by priority. */
export function missingReferentielCoverage(priority?: RefPriority): RefPathology[] {
  const covered = new Set<string>(ACTIVE_KB.filter((chunk) => chunk.kind !== "orientation").flatMap((chunk) => chunk.pathologyIds));
  return REFERENTIEL.filter((p) => !covered.has(p.id) && (!priority || p.priority === priority));
}
export function buildRagBlock(query: string): string {
  return formatRagEvidence(ragSearch(query, 4));
}

/** Documents que le référentiel désigne pour la pathologie principale d'une fiche de synthèse. */
function referentielDocumentsFor(chunk: RagChunk): string[] {
  if (chunk.kind === "orientation" || !chunk.pathologyIds.length) return [];
  return getPathology(chunk.pathologyIds[0]!).documents.map(
    (d) => `${d.title}${d.verified ? " [version 2024–2026 vérifiée]" : " [version à reconfirmer]"}`,
  );
}
