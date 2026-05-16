import {
  SPECIALTY_LABELS,
  type PatientSnapshot,
  type Specialty,
} from "@/types/domain";
import { getPatientDisplayName } from "@/lib/patient-utils";
import { buildAssistContextBlock } from "@/lib/assist/context-block";
import type { AssistRunResult } from "@/lib/assist";

const MAX_LEN = 18_000;
const MAX_IA_HISTORY_CHARS = 9_000;

function add(label: string, value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  return `${label}: ${v}`;
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

function formatIaHistoryBlock(d: PatientSnapshot): string {
  const h = d.hawaeIaHistory;
  if (!h?.length) return "";
  const sorted = [...h].sort((a, b) => a.at.localeCompare(b.at));
  let block =
    "--- Historique assistant Hawae (sessions précédentes — contexte pour la suite du suivi) ---\n";
  for (const e of sorted) {
    const head =
      e.mode === "diagnostic"
        ? `[${e.at}] Analyse automatique Hawae`
        : `[${e.at}] Question au assistant`;
    const q =
      e.mode === "question" && e.question?.trim()
        ? `\nQuestion médecin : ${e.question.trim()}`
        : "";
    const piece = `${head}${q}\nRéponse :\n${e.reply.trim()}\n\n`;
    if (block.length + piece.length > MAX_IA_HISTORY_CHARS) {
      block += "[… historique IA tronqué pour limite de contexte]\n";
      break;
    }
    block += piece;
  }
  return block.trimEnd();
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
    "--- Identité & filière ---",
    `Identité: ${getPatientDisplayName(d)}`,
    add("CIN", d.cin),
    add("Spécialité dossier", spec || undefined),
    add("DDN", d.ddn),
    add("Téléphone", d.tel),
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
    add("Nombre de CPN", d.o_ncs),
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

  let assistBlock = "";
  if (d.hawaeAssistResultJson) {
    try {
      const ar = JSON.parse(d.hawaeAssistResultJson) as AssistRunResult;
      assistBlock = buildAssistContextBlock(ar);
    } catch {
      assistBlock = "";
    }
  }

  const clinical = lines.join("\n");
  const ordo = formatOrdonnanceBlock(d);
  const iaHist = formatIaHistoryBlock(d);

  let text = [clinical, assistBlock, ordo, iaHist].filter(Boolean).join("\n\n");
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN) + "\n[… contexte global tronqué]";
  }
  return text;
}

/**
 * Empreinte stable des données « médecin » (sans timestamps ni historique IA).
 * Les réponses IA ne doivent pas modifier cette clé, sinon relance en boucle de l’analyse auto.
 */
export function stableClinicalDataKey(d: PatientSnapshot | null): string {
  if (!d) return "";
  const clinical: Record<string, unknown> = { ...d };
  delete clinical.updatedAt;
  delete clinical.lastSaved;
  delete clinical.hawaeIaHistory;
  return JSON.stringify(clinical);
}

/** @deprecated préférer stableClinicalDataKey — alias historique */
export function dossierContextFingerprint(d: PatientSnapshot | null): string {
  return stableClinicalDataKey(d);
}
