import { SEED_KB, type RagChunk } from "./knowledge-base";
import { KNOWLEDGE_VERSION } from "@/lib/ia/versions";

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
  index = SEED_KB.map((chunk) => {
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
  return SEED_KB.map((chunk, i) => {
    const document = index![i];
    const matchedTerms = words.filter((t) => document.freq.has(t));
    let score = matchedTerms.reduce((total, term) => {
      const f = document.freq.get(term)!;
      const n = df.get(term)!;
      const idf = Math.log(1 + (SEED_KB.length - n + 0.5) / (n + 0.5));
      return total + idf * f * 2.5 / (f + 1.5 * (0.25 + 0.75 * document.length / averageLength));
    }, 0);
    const exactKeywords = chunk.keywords.filter((kw) => normalized.includes(normalize(kw))).length;
    score *= 1 + Math.min(3, exactKeywords) * 0.1;
    return { chunk, score, matchedTerms };
  }).filter((hit) => hit.score > 0.05).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id)).slice(0, Math.min(26, Math.floor(topK)));
}

export function retrieveRagChunks(query: string, topK = 4): RagChunk[] {
  return ragSearch(query, topK).map((hit) => hit.chunk);
}
export function getRagChunkCount(): number { return SEED_KB.length; }

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
    status: hits.length ? "excerpts_available" : "no_relevant_evidence",
    excerpts: hits.map(({ chunk }) => ({ chunkId: chunk.id, source: chunk.source, title: chunk.title, year: chunk.year, sourceUrl: chunk.sourceUrl ?? null, reviewStatus: chunk.reviewStatus ?? "unreviewed", evidenceAsDeclared: chunk.evidence, text: chunk.text })),
  });
}
export function buildRagBlock(query: string): string {
  return formatRagEvidence(ragSearch(query, 4));
}
