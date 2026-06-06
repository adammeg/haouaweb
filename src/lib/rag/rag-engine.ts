/**
 * BM25 search engine + RAG context block builder (port v50 BLOC 14).
 * Pure JS tokenisation française (stop words + NFD normalisation).
 */

import { SEED_KB, type RagChunk } from "@/lib/rag/knowledge-base";

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "est",
  "pour", "par", "sur", "avec", "dans", "qui", "que", "ou", "si", "au",
  "aux", "ce", "se", "ne", "pas", "sont", "ont", "etre", "avoir",
  "mais", "comme", "il", "elle", "ils", "elles", "on", "leur", "nous",
  "vous", "tout", "cette", "aussi", "tres", "bien", "meme", "dont",
  "lors", "car", "donc", "puis", "chez", "sans", "sous",
  "apres", "avant", "entre", "peut", "plus",
]);

function tokenise(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

type IndexChunk = {
  freq: Record<string, number>;
  len: number;
};

type Bm25Index = {
  N: number;
  avgdl: number;
  df: Record<string, number>;
  tf: IndexChunk[];
};

function buildIndex(chunks: RagChunk[]): Bm25Index {
  const N = chunks.length;
  let avgdl = 0;
  const df: Record<string, number> = {};
  const tf: IndexChunk[] = [];

  for (const c of chunks) {
    // Keywords boosted ×3 (same as v50)
    const raw =
      c.title +
      " " +
      c.text +
      " " +
      c.source +
      " " +
      c.topic +
      " " +
      c.keywords.join(" ") +
      " " +
      c.keywords.join(" ") +
      " " +
      c.keywords.join(" ");
    const toks = tokenise(raw);
    const freq: Record<string, number> = {};
    for (const t of toks) freq[t] = (freq[t] || 0) + 1;
    tf.push({ freq, len: toks.length });
    avgdl += toks.length;
    for (const t of Object.keys(freq)) df[t] = (df[t] || 0) + 1;
  }

  return { N, avgdl: avgdl / (N || 1), df, tf };
}

function search(
  idx: Bm25Index,
  chunks: RagChunk[],
  query: string,
  topK = 4,
): RagChunk[] {
  const toks = tokenise(query);
  if (!toks.length) return [];

  const K1 = 1.5;
  const B = 0.75;
  const qLower = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const scored = chunks
    .map((c, i) => {
      let score = 0;
      for (const t of toks) {
        const n = idx.df[t] || 0;
        if (!n) continue;
        const f = idx.tf[i]?.freq[t] || 0;
        const idf = Math.log((idx.N - n + 0.5) / (n + 0.5) + 1);
        const tfScore =
          (f * (K1 + 1)) /
          (f + K1 * (1 - B + B * (idx.tf[i]?.len ?? 1) / idx.avgdl));
        score += idf * tfScore;
      }
      // Topic boost
      const topicNorm = (c.topic || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (qLower.includes(topicNorm) && topicNorm.length > 2) score *= 1.5;
      // Keyword exact boost
      for (const kw of c.keywords) {
        const kwNorm = kw
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (qLower.includes(kwNorm) && kwNorm.length > 3) score *= 1.2;
      }
      return { c, s: score };
    })
    .filter((r) => r.s > 0.05)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map((r) => r.c);

  return scored;
}

// Singleton index (built once on first call)
let _idx: Bm25Index | null = null;
let _chunks: RagChunk[] = [];

function ensureIndex() {
  if (!_idx) {
    _chunks = SEED_KB;
    _idx = buildIndex(_chunks);
  }
}

/**
 * Build a formatted RAG block for injection into the LLM system prompt.
 * Matches v50 _buildRagBlock exactly.
 */
export function buildRagBlock(query: string): string {
  ensureIndex();
  const hits = search(_idx!, _chunks, query, 4);
  if (!hits.length) return "";

  let block =
    "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "📚 RÉFÉRENTIELS OFFICIELS — HawaeMD Knowledge System v1.0\n" +
    "Sources validées | BM25 retrieval | Contexte automatique\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  hits.forEach((c, i) => {
    block += `\n[${i + 1}] ${c.source} — ${c.title}\n`;
    block += `Niveau de preuve : ${c.evidence} | Année : ${c.year}\n`;
    block += c.text + "\n";
  });

  block +=
    "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "INSTRUCTION RAG : Base tes réponses en PRIORITÉ sur ces référentiels. " +
    "Cite toujours la source entre crochets ex [FIGO 2021] ou [CNGOF 2020]. " +
    "Si un point n'est pas couvert par ces extraits, complète depuis ta mémoire d'entraînement en le signalant.\n";

  return block;
}

/**
 * Search the KB directly (for UI display / debugging).
 */
export function ragSearch(
  query: string,
  topK = 5,
): { chunk: RagChunk; score: number }[] {
  ensureIndex();
  const toks = tokenise(query);
  if (!toks.length) return [];

  const K1 = 1.5;
  const B = 0.75;
  const qLower = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return _chunks
    .map((c, i) => {
      let score = 0;
      for (const t of toks) {
        const n = _idx!.df[t] || 0;
        if (!n) continue;
        const f = _idx!.tf[i]!.freq[t] || 0;
        const idf = Math.log((_idx!.N - n + 0.5) / (n + 0.5) + 1);
        const tfScore =
          (f * (K1 + 1)) /
          (f + K1 * (1 - B + B * (_idx!.tf[i]?.len ?? 1) / _idx!.avgdl));
        score += idf * tfScore;
      }
      const topicNorm = (c.topic || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (qLower.includes(topicNorm) && topicNorm.length > 2) score *= 1.5;
      for (const kw of c.keywords) {
        const kwNorm = kw
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (qLower.includes(kwNorm) && kwNorm.length > 3) score *= 1.2;
      }
      return { chunk: c, score };
    })
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}