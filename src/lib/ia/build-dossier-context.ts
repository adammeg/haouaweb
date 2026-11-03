import {
  SPECIALTY_LABELS,
  type PatientSnapshot,
  type Specialty,
} from "@/types/domain";
import { buildAssistContextBlock } from "@/lib/assist/context-block";
import { profileFromSnapshot } from "@/lib/assist/profile";
import { runAssist } from "@/lib/assist/run";
import { ageYears as parsedAge } from "@/lib/clinical/parse";
import { clinicalProjection } from "./clinical-revision";
export { stableClinicalDataKey } from "./clinical-revision";
import { stableClinicalDataKey } from "./clinical-revision";

function add(label: string, value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  return `${label}: ${v.length > 600 ? v.slice(0, 600) + " [champ tronqué]" : v}`;
}

function formatOrdonnanceBlock(d: PatientSnapshot): string {
  const lines = d.ordonnanceLines?.filter(
    (l) =>
      (l.dci ?? "").trim() ||
      (l.posologie ?? "").trim() ||
      (l.dose ?? "").trim(),
  );
  if (!lines?.length && !(d.ordonnanceNote ?? "").trim()) {
    return "";
  }
  const parts: string[] = ["--- Ordonnance enregistrée dans le dossier ---"];
  for (const l of lines ?? []) {
    const row = [
      l.dci,
      l.dose && `dose ${l.dose}`,
      l.posologie,
      l.duree && `durée ${l.duree}`,
    ]
      .filter(Boolean)
      .join(" · ");
    if (row.trim()) parts.push(row);
  }
  if ((d.ordonnanceNote ?? "").trim()) {
    parts.push(`Note: ${d.ordonnanceNote!.trim()}`);
  }
  if ((d.ordonnanceValidite ?? "").trim()) {
    parts.push(`Validité: ${d.ordonnanceValidite!.trim()}`);
  }
  return parts.join("\n");
}

function ageYears(ddn?: string): string | undefined {
  const age = parsedAge(ddn);
  return age == null ? undefined : String(age);
}

/**
 * Export structuré du dossier pour l’IA : données cliniques, ordonnance, historique Hawae.
 */
export function buildDossierContextForIa(d: PatientSnapshot | null): string {
  if (!d) return "";

  const spec = d.specialite
    ? SPECIALTY_LABELS[d.specialite as Specialty] ?? d.specialite
    : "";

  const lines = [
    "--- Profil clinique pseudonymisé ---",
    `Référence dossier: ${d.id}`,
    add("Spécialité dossier", spec || undefined),
    add("Âge", ageYears(d.ddn)),
    add("Profession", d.profession),
    "--- Motif & terrain ---",
    add("Motif de consultation", d.motif),
    add("Symptômes", d.symptomes),
    add("Début des symptômes", d.debut),
    add("HTA", d.hta),
    add("Diabète", d.diabete),
    add("Thyroïde", d.thyroide),
    add("ATCD médicaux", d.atcdMed),
    add("Chirurgie", d.chir),
    add("Tabac", d.tabac),
    add("Traitements en cours", d.traitements),
    add("IMC", d.imc),
    add("Allergies", d.allergies),
    add("EVA douleur", d.eva),
    "--- Gynécologie ---",
    add("DDR", d.g_ddr),
    add("Cycle", d.g_cycle),
    add("Règles", d.g_regles),
    add("Régularité", d.g_reg),
    add("Dysménorrhée", d.g_dysmen),
    add("Abondance", d.g_abond),
    add("Métrorragies", d.g_metro),
    add("Leucorrhée", d.g_leuco),
    add("Ménarche", d.g_menarche),
    add("Ménopause", d.g_meno),
    add("Activité sexuelle", d.g_sex),
    add("Dyspareunie", d.g_dysp),
    add("Contraception", d.g_contra),
    add("FCV / frottis", d.g_fcv),
    add("Résultat FCV", d.g_fcv_res),
    add("IST", d.g_ist),
    add("Pathologies gynécologiques", d.g_patho),
    add("Gestité / parité (gyn)", [d.g_gest, d.g_par].filter(Boolean).join(" / ")),
    add("IVG / fausses couches", d.g_abort),
    "--- Obstétrique ---",
    add("Gestité / parité (obs)", d.o_gest ? `G${d.o_gest}P${d.o_par ?? "?"}` : ""),
    add("IVG / fausses couches (obs)", d.o_abort),
    add("DDR (grossesse)", d.o_ddr),
    add("Terme", d.o_terme),
    add("DPA", d.o_dpa),
    add("Type de grossesse", d.o_type),
    add("Conception / FIV", d.o_concept),
    add("Suivi grossesse", d.o_suivi),
    add("Groupe sanguin", d.o_grp),
    add("RAI", d.o_rai),
    add("Toxoplasmose", d.o_toxo),
    add("Rubéole", d.o_rubeo),
    add("VIH", d.o_vih),
    add("Hépatite B", d.o_hbv),
    add("ECBU", d.o_ecbu),
    add("Hb", d.o_hb),
    add("Glycémie", d.o_gly),
    add("Hauteur utérine", d.o_hu),
    add("Présentation", d.o_pres),
    add("BCF", d.o_bcf),
    add("TA grossesse", d.o_ta),
    add("Poids (suivi)", d.o_poids),
    add("Césariennes antérieures", d.o_ncs),
    add("Indications / projet", d.o_indcs),
    add("ATCD obstétricaux", d.o_atcd_gross),
    add("Complications", d.o_complic),
    "--- Infertilité / AMP ---",
    add("Durée infertilité", d.i_duree),
    add("Type / bilan", d.i_type),
    add("DDR (bilan)", d.i_ddr),
    add("Cycle (bilan)", d.i_cycle),
    "--- Examen clinique (dernière saisie) ---",
    add("TA", d.ec_ta),
    add("Pouls", d.ec_pouls),
    add("Température", d.ec_temp),
    add("Poids", d.ec_poids),
    add("Taille", d.ec_taille),
    add("HU", d.ec_hu),
    add("Présentation", d.ec_presentation),
    add("BCF", d.ec_bcf),
    add("Dilatation", d.ec_dil),
    add("Effacement", d.ec_eff),
    add("Consistance", d.ec_cons),
    add("Hauteur présentation", d.ec_hpres),
    add("Conclusion examen", d.ec_conclusion),
    d.ec_chips
      ? `Sémiologie examen (puces): ${(() => {
          try {
            const arr = JSON.parse(d.ec_chips) as string[];
            return Array.isArray(arr) ? arr.join(", ") : d.ec_chips;
          } catch {
            return d.ec_chips;
          }
        })()}`
      : null,
    add("Imagerie / écho", d.bio_imagerie),
    add("Hb", d.bio_hb),
    add("Plaquettes", d.bio_plq),
    add("AMH", d.bio_amh),
    add("βhCG", d.bio_bhcg),
    add("Glycémie jeûn", d.bio_gly),
    add("HGPO T1", d.bio_hgpo1),
    add("HGPO T2", d.bio_hgpo2),
  ].filter((x): x is string => x != null && x.length > 0);

  // Never trust persisted/client-generated score JSON for inference.
  const profile = profileFromSnapshot(d);
  const assistBlock = buildAssistContextBlock(runAssist(profile));

  const clinical = lines.join("\n");
  const ordo = formatOrdonnanceBlock(d);
  const normalized = `--- Mesures normalisées (mmHg, mm, g, AMH ng/mL ou pmol/L, glucose mmol/L ; null = inconnu) ---\n${JSON.stringify(profile)}`;
  const rawFields = Object.entries(clinicalProjection(d)).map(([key, value]) => {
    const entry = JSON.stringify(value, (_k, v) => typeof v === "string" && v.length > 400 ? v.slice(0, 400) + " [champ tronqué]" : v);
    return `${key}: ${entry}`;
  });
  const raw: string[] = [];
  let remaining = 6000;
  for (const line of rawFields) {
    if (line.length + 1 > remaining) { raw.push("[autres données complémentaires omises]"); break; }
    raw.push(line); remaining -= line.length + 1;
  }
  // Reserve independent budgets: a long narrative cannot remove scores/allergies/medications.
  const safety = `Allergies: ${(d.allergies ?? "inconnues").slice(0, 1000)}\nTraitements: ${(d.traitements ?? "inconnus").slice(0, 1500)}`;
  let text = [safety, normalized, assistBlock, ordo.length > 3000 ? ordo.slice(0, 3000) + " [ordonnance tronquée]" : ordo, clinical.length > 7000 ? clinical.slice(0, 7000) + " [export descriptif tronqué]" : clinical, `--- Autres données saisies ---\n${raw.join("\n")}`].filter(Boolean).join("\n\n");
  // Remove known identity strings even if they were pasted into narrative fields.
  for (const identifier of [d.nom, d.prenom, d.cin, d.tel, d.ddn]) {
    if (identifier && identifier.trim().length >= 3) text = text.replace(new RegExp(identifier.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[identité retirée]");
  }
  return text;
}

/** @deprecated préférer stableClinicalDataKey — alias historique */
export function dossierContextFingerprint(d: PatientSnapshot | null): string {
  return stableClinicalDataKey(d);
}
