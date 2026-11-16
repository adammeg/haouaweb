import type { RagChunk, RagDomain, RagReference } from "./knowledge-base";
import { referencesOf } from "./knowledge-base-orientation";
import { getPathology, type PathologyId } from "./referentiel";

/** Référence principale ; `verified` = version contrôlée dans le référentiel (2024–2026). */
export function main(society: string, title: string, year?: number, verified = false): RagReference {
  return { society, title, year, role: "principale", check: verified ? "verifie_referentiel" : "a_reconfirmer" };
}

export function compl(society: string, title: string, year?: number, verified = false): RagReference {
  return { society, title, year, role: "complementaire", check: verified ? "verifie_referentiel" : "a_reconfirmer" };
}

export const NOT_GRADED = "Non coté dans cette fiche — se reporter au grade publié par la source";

type FicheInput = {
  id: string;
  p: PathologyId[];
  /** Par défaut : sociétés principales du référentiel pour la première pathologie. */
  source?: string;
  domain: RagDomain;
  topic: string;
  title: string;
  year: number;
  kw: string[];
  /** Par défaut : documents de référence du référentiel pour la première pathologie. */
  refs?: RagReference[];
  text: string;
  /** Fiche rédigée sur une version antérieure à celle que le référentiel désigne. */
  revise?: string;
  divergences?: string[];
};

/** Fiche de synthèse non relue : statut « en révision » quand une version plus récente reste à intégrer. */
export function fiche(f: FicheInput): RagChunk {
  return {
    id: f.id,
    pathologyIds: f.p,
    source: f.source ?? getPathology(f.p[0]!).societies.join(" · "),
    domain: f.domain,
    topic: f.topic,
    title: f.title,
    year: f.year,
    evidence: NOT_GRADED,
    keywords: f.kw,
    text: f.text,
    references: f.refs ?? referencesOf(getPathology(f.p[0]!)),
    divergences: f.divergences,
    status: f.revise ? "en_revision" : "en_vigueur",
    reviewStatus: "unreviewed",
    reviewNote: f.revise,
  };
}
