/**
 * Fiches d'orientation générées depuis le référentiel pour les pathologies sans fiche de synthèse.
 * Elles ne contiennent aucune conduite à tenir : seulement le périmètre du thème, les sociétés sources
 * et les documents de référence à consulter, tels que listés dans le référentiel.
 */

import type { RagChunk, RagDomain, RagReference } from "./knowledge-base";
import { REFERENTIEL, type RefPathology } from "./referentiel";
import { SOCIETIES } from "./referentiel-annexes";

function domainOf(p: RefPathology): RagDomain {
  if (p.id.startsWith("PM")) return "PMA";
  if (p.id.startsWith("OB")) return "OBST";
  if (p.id.startsWith("EC")) return p.id === "EC-07" || p.id === "EC-08" ? "GYN" : "OBST";
  return "GYN";
}

function latestYear(p: RefPathology): number {
  const years = p.documents.flatMap((d) => d.title.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
  return years.length ? Math.max(...years) : 2026;
}

function keywordsOf(p: RefPathology): string[] {
  return [p.title, ...p.scope.split(/[,;/()]/)]
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/** Société éditrice = début du titre jusqu'au premier tiret ; principale si elle figure parmi les sociétés principales. */
export function referencesOf(p: RefPathology): RagReference[] {
  return p.documents.map((d) => {
    const [head, ...rest] = d.title.split(" – ");
    const society = rest.length ? head!.trim() : p.societies[0] ?? "Référentiel";
    const isMain = p.societies.some((s) => society.split(/[\s/]/).includes(s));
    return {
      society,
      title: rest.length ? rest.join(" – ").trim() : d.title,
      role: isMain ? "principale" : "complementaire",
      check: d.verified ? "verifie_referentiel" : "a_reconfirmer",
      scope: SOCIETIES[society.split(/[\s/]/)[0] ?? ""]?.[1],
    };
  });
}

function textOf(p: RefPathology): string {
  const lines = [
    `FICHE D'ORIENTATION — ${p.title} (${p.id}, priorité ${p.priority}).`,
    "Aucune synthèse clinique validée n'est encore disponible pour ce thème dans la base : ne pas en déduire de conduite à tenir. Se reporter aux documents de référence ci-dessous, dans leur version en vigueur.",
    `SECTION : ${p.sectionTitle}.`,
  ];
  if (p.scope) lines.push(`PÉRIMÈTRE : ${p.scope}.`);
  lines.push(`SOCIÉTÉS SOURCES PRINCIPALES : ${p.societies.join(", ")}.`);
  if (p.complementary.length) lines.push(`SOCIÉTÉS COMPLÉMENTAIRES : ${p.complementary.join(", ")}.`);
  lines.push("DOCUMENTS DE RÉFÉRENCE (ordre de priorité) :");
  for (const d of p.documents) {
    lines.push(`- ${d.title} ${d.verified ? "[version 2024–2026 vérifiée dans le référentiel]" : "[version à reconfirmer]"}`);
  }
  return lines.join("\n");
}

export function buildOrientationChunks(coveredIds: ReadonlySet<string>): RagChunk[] {
  return REFERENTIEL.filter((p) => !coveredIds.has(p.id)).map((p) => ({
    id: `ref-${p.id.toLowerCase()}`,
    kind: "orientation" as const,
    pathologyIds: [p.id],
    source: p.societies.join(" · "),
    domain: domainOf(p),
    topic: p.sectionTitle,
    title: `${p.title} — sources de référence`,
    year: latestYear(p),
    evidence: "Sans objet : fiche d'orientation sans contenu clinique",
    keywords: keywordsOf(p),
    text: textOf(p),
    references: referencesOf(p),
    status: "en_vigueur" as const,
    reviewStatus: "unreviewed" as const,
    reviewNote: "Transcription du référentiel v1.0 : titres et versions à vérifier sur les sites officiels avant ingestion des textes.",
  }));
}
