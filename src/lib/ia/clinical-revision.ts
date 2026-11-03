import type { PatientSnapshot } from "@/types/domain";
import { ageYears } from "@/lib/clinical/parse";
import { AI_CACHE_VERSION } from "./versions";

const CORE = new Set(["id", "specialite", "motif", "symptomes", "debut", "hta", "diabete", "thyroide", "atcdMed", "chir", "tabac", "traitements", "imc", "allergies", "eva", "ethnie", "pfdi20_items", "ordonnanceLines", "ordonnanceNote", "ordonnanceValidite"]);

export function clinicalProjection(d: PatientSnapshot): Record<string, unknown> {
  return Object.fromEntries(Object.entries(d)
    .filter(([k, v]) => v !== undefined && (CORE.has(k) || /^(g_|o_|i_|bio_|ec_|t2_|popq_)/.test(k)) && !k.includes("ia_") && !["t2_operateur", "t2_machine"].includes(k))
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

export function stableClinicalDataKey(d: PatientSnapshot | null): string {
  return d ? JSON.stringify({ version: AI_CACHE_VERSION, age: ageYears(d.ddn), clinical: clinicalProjection(d) }) : "";
}

export async function clinicalRevision(d: PatientSnapshot): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableClinicalDataKey(d)));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}
