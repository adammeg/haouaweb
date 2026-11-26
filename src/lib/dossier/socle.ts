import type { PatientSnapshot, SocleLogEntry } from "@/types/domain";
import {
  ETHNIE_OPTIONS,
  GYN_ABOND,
  GYN_CONTRA,
  GYN_DYSMEN,
  GYN_FCV_RES,
  GYN_REG,
  O_GRP,
  O_INDCS,
  O_RUBEO,
  O_TOXO,
} from "@/lib/dossier/anamnese-config";

/**
 * Anamnèse commune (socle) : ce qui est vrai pour la patiente quelle que soit la consultation.
 * Saisie une fois, reprise à l'identique à chaque nouvelle consultation, quelle que soit la spécialité.
 * Spécification : docs/refonte-dossier-etape-1-socle-commun.md
 */

type Key = keyof PatientSnapshot & string;
type Option = { value: string; label: string };

export type SocleField = {
  key: Key;
  label: string;
  type: "text" | "number" | "date" | "select" | "pills" | "textarea";
  options?: Option[];
  placeholder?: string;
  /** Libellé utilisé dans le résumé ; par défaut le libellé du champ. */
  short?: string;
  /** Valeur qui ne mérite pas d'apparaître dans le résumé (« non », « aucune »…). */
  quiet?: string[];
  wide?: boolean;
};

export type SocleSection = { id: string; title: string; ar: string; fields: SocleField[] };

const NON_OUI: Option[] = [
  { value: "non", label: "Non" },
  { value: "oui", label: "Oui" },
];
const QUIET = ["non", "Non", "Aucune", "Absente", "—", ""];

export const SOCLE_SECTIONS: SocleSection[] = [
  {
    id: "identite",
    title: "Identité",
    ar: "هوية المريضة",
    fields: [
      { key: "nom", label: "Nom *", type: "text", placeholder: "Ben Ali" },
      { key: "prenom", label: "Prénom *", type: "text", placeholder: "Fatma" },
      { key: "ddn", label: "Date de naissance", type: "date" },
      { key: "tel", label: "Téléphone", type: "text", placeholder: "+216 …" },
      { key: "cin", label: "CIN", type: "text" },
      { key: "profession", label: "Profession", type: "text" },
      { key: "ec_taille", label: "Taille (cm)", type: "number", placeholder: "163", short: "Taille" },
      {
        key: "ethnie",
        label: "Origine (utilisée par les calculs FMF et MFMU)",
        short: "Origine",
        type: "select",
        options: ETHNIE_OPTIONS,
      },
    ],
  },
  {
    id: "medical",
    title: "Antécédents médicaux et mode de vie",
    ar: "السوابق الطبية",
    fields: [
      {
        key: "hta",
        label: "HTA",
        type: "pills",
        options: [...NON_OUI, { value: "traite", label: "Traitée" }],
        quiet: QUIET,
      },
      {
        key: "diabete",
        label: "Diabète",
        type: "pills",
        options: [
          { value: "non", label: "Non" },
          { value: "t1", label: "DT1" },
          { value: "t2", label: "DT2" },
          { value: "gesta", label: "Gestationnel" },
        ],
        quiet: QUIET,
      },
      {
        key: "thyroide",
        label: "Thyroïde",
        type: "pills",
        options: [
          { value: "non", label: "Non" },
          { value: "hypo", label: "Hypo" },
          { value: "hyper", label: "Hyper" },
        ],
        quiet: QUIET,
      },
      { key: "o_atcd_vte", label: "Thrombose (TVP/EP)", type: "pills", options: NON_OUI, quiet: QUIET },
      {
        key: "o_thrombophilie",
        label: "Thrombophilie",
        type: "select",
        options: [
          { value: "non", label: "Aucune" },
          { value: "basse", label: "Faible risque" },
          { value: "haute", label: "Haut risque" },
        ],
        quiet: QUIET,
      },
      { key: "o_led", label: "Lupus (LED)", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "o_apl", label: "SAPL", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "atcdMed", label: "Autres antécédents", type: "text", placeholder: "asthme, épilepsie…", wide: true },
      { key: "allergies", label: "Allergies", type: "text", placeholder: "médicaments, latex…", wide: true },
      { key: "traitements", label: "Traitements en cours", type: "text", placeholder: "médicaments, compléments…", wide: true },
      {
        key: "tabac",
        label: "Tabac",
        type: "pills",
        options: [...NON_OUI, { value: "sevré", label: "Sevré" }],
        quiet: QUIET,
      },
    ],
  },
  {
    id: "chirurgie",
    title: "Antécédents chirurgicaux",
    ar: "السوابق الجراحية",
    fields: [
      {
        key: "chir",
        label: "Chirurgies (dont pelviennes), avec l'année",
        short: "Chirurgies",
        type: "textarea",
        placeholder: "2019 : appendicectomie ; 2022 : myomectomie…",
        wide: true,
      },
    ],
  },
  {
    id: "famille",
    title: "Antécédents familiaux",
    ar: "السوابق العائلية",
    fields: [
      { key: "fam_sein_ovaire", label: "Cancer du sein ou de l'ovaire", short: "Cancer sein/ovaire", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "fam_diabete", label: "Diabète", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "fam_hta", label: "HTA, maladie cardiovasculaire", short: "HTA/cardio", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "fam_thrombose", label: "Thrombose", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "fam_genetique", label: "Maladie génétique", type: "pills", options: NON_OUI, quiet: QUIET },
      {
        key: "fam_details",
        label: "Précisions (lien de parenté, âge au diagnostic)",
        short: "Précisions",
        type: "text",
        placeholder: "mère : cancer du sein à 45 ans",
        wide: true,
      },
    ],
  },
  {
    id: "gyneco",
    title: "Histoire gynécologique",
    ar: "السوابق النسائية",
    fields: [
      { key: "g_menarche", label: "Âge de la ménarche", short: "Ménarche", type: "number", placeholder: "13" },
      { key: "g_cycle", label: "Durée du cycle (j)", short: "Cycle (j)", type: "number", placeholder: "28" },
      { key: "g_regles", label: "Durée des règles (j)", short: "Règles (j)", type: "number", placeholder: "5" },
      { key: "g_reg", label: "Régularité", type: "select", options: GYN_REG },
      { key: "g_abond", label: "Abondance", type: "select", options: GYN_ABOND },
      { key: "g_dysmen", label: "Dysménorrhée", type: "select", options: GYN_DYSMEN, quiet: QUIET },
      {
        key: "g_dysp",
        label: "Dyspareunie",
        type: "pills",
        options: [
          { value: "non", label: "Non" },
          { value: "sup", label: "Superficielle" },
          { value: "prof", label: "Profonde" },
        ],
        quiet: QUIET,
      },
      {
        key: "g_meno",
        label: "Ménopause",
        type: "pills",
        options: [
          { value: "non", label: "Non" },
          { value: "peri", label: "Péri" },
          { value: "oui", label: "Oui" },
        ],
        quiet: QUIET,
      },
      { key: "g_contra", label: "Contraception actuelle", short: "Contraception", type: "select", options: GYN_CONTRA },
      { key: "i_contra", label: "Contraceptions antérieures", type: "text" },
      { key: "g_ist", label: "Antécédent d'IST / salpingite", short: "IST", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "g_fcv", label: "Dernier frottis : date", short: "Frottis", type: "date" },
      { key: "g_fcv_res", label: "Dernier frottis : résultat", short: "Résultat frottis", type: "select", options: GYN_FCV_RES },
      { key: "g_endometriose", label: "Endométriose confirmée", short: "Endométriose", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "g_prolapsus", label: "Prolapsus génital", short: "Prolapsus", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "g_oncologie", label: "Contexte oncologique", short: "Oncologie", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "g_patho", label: "Pathologies gynécologiques connues", short: "Pathologies", type: "text", placeholder: "fibrome, kyste…", wide: true },
    ],
  },
  {
    id: "obstetrique",
    title: "Histoire obstétricale",
    ar: "السوابق التوليدية",
    fields: [
      { key: "o_gest", label: "Gestité (G)", short: "G", type: "number" },
      { key: "o_par", label: "Parité (P)", short: "P", type: "number" },
      { key: "o_abort", label: "Fausses couches / IVG (A)", short: "A", type: "number" },
      { key: "o_ncs", label: "Nombre de césariennes", short: "Césariennes", type: "number", quiet: ["0", ""] },
      { key: "o_indcs", label: "Indication de la césarienne", short: "Indication", type: "select", options: O_INDCS, quiet: QUIET },
      { key: "o_atcd_pe", label: "Pré-éclampsie", type: "pills", options: NON_OUI, quiet: QUIET },
      { key: "o_atcd_prematurite", label: "Prématurité spontanée", short: "Prématurité", type: "pills", options: NON_OUI, quiet: QUIET },
      {
        key: "o_atcd_gross",
        label: "Grossesses précédentes : détail",
        short: "Détail",
        type: "textarea",
        placeholder: "2020 : AVB 39 SA, 3200 g…",
        wide: true,
      },
      { key: "o_complic", label: "Complications obstétricales", short: "Complications", type: "textarea", wide: true },
    ],
  },
  {
    id: "immunite",
    title: "Groupe sanguin et immunités",
    ar: "الزمرة والمناعة",
    fields: [
      { key: "o_grp", label: "Groupe / Rhésus", short: "Groupe", type: "select", options: O_GRP },
      { key: "o_rubeo", label: "Rubéole", type: "select", options: O_RUBEO },
      { key: "o_toxo", label: "Toxoplasmose", type: "select", options: O_TOXO },
    ],
  },
];

export const SOCLE_KEYS: Key[] = SOCLE_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
export const SOCLE_META_KEYS = ["socleLog", "socleConfirmedAt", "socleMigrated"] as const;

// ── Reprise des anciens champs en double ────────────────────────────────────────

type Alias = { key: Key; source: string; map?: (v: string) => string };

const fromSero = (v: string) =>
  v.startsWith("Immune") ? "Immune" : v.startsWith("Non immune") ? "Non immune" : v;

/** Anciens champs qui doublonnaient un champ du socle, avec leur provenance affichée au médecin. */
export const SOCLE_ALIASES: Partial<Record<Key, Alias[]>> = {
  g_menarche: [{ key: "i_menarche", source: "anamnèse infertilité" }],
  g_cycle: [{ key: "i_cycle", source: "anamnèse infertilité" }],
  g_reg: [{ key: "i_reg", source: "anamnèse infertilité" }],
  g_dysmen: [{ key: "i_dysmen", source: "anamnèse infertilité" }],
  g_dysp: [
    { key: "i_dysp", source: "anamnèse infertilité", map: (v) => (v === "oui" ? "prof" : v) },
  ],
  g_ist: [{ key: "i_ist", source: "anamnèse infertilité" }],
  o_gest: [
    { key: "g_gest", source: "anamnèse gynécologique" },
    { key: "i_gest", source: "anamnèse infertilité" },
  ],
  o_par: [
    { key: "g_par", source: "anamnèse gynécologique" },
    { key: "i_par", source: "anamnèse infertilité" },
  ],
  o_abort: [
    { key: "g_abort", source: "anamnèse gynécologique" },
    { key: "i_abort", source: "anamnèse infertilité" },
  ],
  o_grp: [{ key: "bio_groupe", source: "examens et bilans" }],
  o_rubeo: [{ key: "bio_rubeole", source: "examens et bilans", map: fromSero }],
  o_toxo: [{ key: "bio_toxo", source: "examens et bilans", map: fromSero }],
};

const CANON_SOURCE: Partial<Record<Key, string>> = {
  o_gest: "anamnèse obstétricale",
  o_par: "anamnèse obstétricale",
  o_abort: "anamnèse obstétricale",
  o_grp: "anamnèse obstétricale",
  o_rubeo: "anamnèse obstétricale",
  o_toxo: "anamnèse obstétricale",
};

/** Comparaison tolérante : casse, espaces, « Rh », signes moins typographiques. */
export function sameClinicalValue(a: string, b: string): boolean {
  const n = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[−–]/g, "-")
      .replace(/\brh\b/g, "")
      .replace(/\s+/g, "");
  return n(a) === n(b);
}

export type SocleConflict = {
  key: Key;
  label: string;
  values: { source: string; value: string }[];
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function labelOf(key: Key): string {
  for (const s of SOCLE_SECTIONS) {
    const f = s.fields.find((x) => x.key === key);
    if (f) return f.short ?? f.label;
  }
  return key;
}

/**
 * Prépare la reprise d'un dossier antérieur au socle. Une seule source ou des sources concordantes :
 * la valeur est reprise. Des sources contradictoires : rien n'est choisi, le conflit est rendu au médecin.
 * Les anciens champs ne sont jamais modifiés.
 */
export function planSocleMigration(d: PatientSnapshot): {
  patch: Partial<PatientSnapshot>;
  conflicts: SocleConflict[];
} {
  const patch: Record<string, string> = {};
  const conflicts: SocleConflict[] = [];
  if (d.socleMigrated) return { patch, conflicts };
  for (const [canon, aliases] of Object.entries(SOCLE_ALIASES) as [Key, Alias[]][]) {
    const values: { source: string; value: string }[] = [];
    const current = str(d[canon]);
    if (current) values.push({ source: CANON_SOURCE[canon] ?? "anamnèse gynécologique", value: current });
    for (const a of aliases) {
      const raw = str(d[a.key]);
      if (raw) values.push({ source: a.source, value: a.map ? a.map(raw) : raw });
    }
    if (!values.length) continue;
    const distinct = values.filter((v, i) => values.findIndex((w) => sameClinicalValue(w.value, v.value)) === i);
    if (distinct.length > 1) conflicts.push({ key: canon, label: labelOf(canon), values: distinct });
    else if (!current) patch[canon] = values[0].value;
  }
  return { patch: patch as Partial<PatientSnapshot>, conflicts };
}

/** Valeur du socle, avec repli sur un ancien champ tant que le dossier n'a pas été repris. */
export function socleValue(d: PatientSnapshot, key: Key): string {
  const v = str(d[key]);
  if (v || d.socleMigrated) return v;
  for (const a of SOCLE_ALIASES[key] ?? []) {
    const raw = str(d[a.key]);
    if (raw) return a.map ? a.map(raw) : raw;
  }
  return "";
}

export function appendSocleLog(d: PatientSnapshot, text: string, at = new Date()): SocleLogEntry[] {
  return [{ date: at.toISOString(), text }, ...(d.socleLog ?? [])].slice(0, 200);
}

// ── Résumé lisible ──────────────────────────────────────────────────────────────

function display(f: SocleField, raw: string): string {
  if (f.options) return f.options.find((o) => o.value === raw)?.label ?? raw;
  if (f.type === "date") {
    const t = new Date(raw);
    return Number.isNaN(t.getTime()) ? raw : t.toLocaleDateString("fr-FR");
  }
  return raw;
}

/** Résumé d'une section : seules les informations utiles, sans les réponses négatives. */
export function sectionSummary(
  section: SocleSection,
  d: PatientSnapshot,
  disputed: ReadonlySet<string> = new Set(),
): string {
  const part = (f: SocleField, raw: string) =>
    disputed.has(f.key) ? `${f.short ?? f.label} : à vérifier` : summaryPart(f, raw);
  if (section.id === "obstetrique") {
    const g = socleValue(d, "o_gest");
    const p = socleValue(d, "o_par");
    const a = socleValue(d, "o_abort");
    const gpaDisputed = ["o_gest", "o_par", "o_abort"].some((k) => disputed.has(k));
    const head = gpaDisputed
      ? "G/P/A : à vérifier"
      : g || p || a
        ? `G${g || "?"}P${p || "?"}${a && a !== "0" ? ` A${a}` : ""}`
        : "";
    const rest = section.fields
      .filter((f) => !["o_gest", "o_par", "o_abort"].includes(f.key))
      .map((f) => part(f, socleValue(d, f.key)))
      .filter(Boolean);
    return [head, ...rest].filter(Boolean).join(" · ");
  }
  return section.fields
    .map((f) => part(f, socleValue(d, f.key)))
    .filter(Boolean)
    .join(" · ");
}

function summaryPart(f: SocleField, raw: string): string {
  if (!raw || f.quiet?.includes(raw)) return "";
  const v = display(f, raw);
  if (f.type === "pills" && (raw === "oui" || raw === "Oui")) return f.short ?? f.label;
  if (f.key === "nom" || f.key === "prenom") return v;
  if (f.key === "ddn") {
    const t = new Date(raw);
    const age = Number.isNaN(t.getTime())
      ? null
      : Math.floor((Date.now() - t.getTime()) / (365.25 * 24 * 3600 * 1000));
    return age != null ? `${age} ans` : v;
  }
  return `${f.short ?? f.label} : ${v}`;
}

// ── Événements ─────────────────────────────────────────────────────────────────

export type SocleEventKind =
  | "accouchement"
  | "fausse_couche"
  | "ivg"
  | "geu"
  | "chirurgie"
  | "diagnostic"
  | "traitement"
  | "allergie"
  | "menopause";

export const SOCLE_EVENTS: { kind: SocleEventKind; label: string }[] = [
  { kind: "accouchement", label: "Accouchement" },
  { kind: "fausse_couche", label: "Fausse couche" },
  { kind: "ivg", label: "IVG" },
  { kind: "geu", label: "Grossesse extra-utérine" },
  { kind: "chirurgie", label: "Chirurgie" },
  { kind: "diagnostic", label: "Nouveau diagnostic" },
  { kind: "traitement", label: "Nouveau traitement" },
  { kind: "allergie", label: "Nouvelle allergie" },
  { kind: "menopause", label: "Ménopause" },
];

export type SocleEventInput = {
  date?: string;
  /** Texte libre : intervention, diagnostic, traitement, allergie, précisions. */
  text?: string;
  terme?: string;
  voie?: "voie basse" | "césarienne";
  indication?: string;
  /** G/P/A après l'événement, proposés par `suggestGpa` et ajustables par le médecin. */
  g?: string;
  p?: string;
  a?: string;
};

const num = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

/** La grossesse en cours est déjà comptée dans la gestité quand un terme ou une DDR est saisi. */
function pregnancyCounted(d: PatientSnapshot): boolean {
  return Boolean(str(d.o_ddr) || str(d.o_terme));
}

export function suggestGpa(d: PatientSnapshot, kind: SocleEventKind): { g: string; p: string; a: string } {
  const g = num(socleValue(d, "o_gest"));
  const p = num(socleValue(d, "o_par"));
  const a = num(socleValue(d, "o_abort"));
  const newG = pregnancyCounted(d) ? Math.max(g, 1) : g + 1;
  if (kind === "accouchement") return { g: String(newG), p: String(p + 1), a: String(a) };
  if (kind === "fausse_couche" || kind === "ivg") return { g: String(newG), p: String(p), a: String(a + 1) };
  if (kind === "geu") return { g: String(newG), p: String(p), a: String(a) };
  return { g: String(g), p: String(p), a: String(a) };
}

const year = (date?: string) => (date ? date.slice(0, 4) : String(new Date().getFullYear()));
const addLine = (current: string | undefined, line: string, sep = " ; ") =>
  [str(current), line].filter(Boolean).join(sep);

/** Applique un événement au socle et renvoie le correctif à enregistrer, journal compris. */
export function applySocleEvent(
  d: PatientSnapshot,
  kind: SocleEventKind,
  input: SocleEventInput,
  at = new Date(),
): Partial<PatientSnapshot> {
  const label = SOCLE_EVENTS.find((e) => e.kind === kind)?.label ?? kind;
  const patch: Partial<PatientSnapshot> = {};
  const details = str(input.text);
  const when = input.date ? new Date(input.date).toLocaleDateString("fr-FR") : "";
  if (["accouchement", "fausse_couche", "ivg", "geu"].includes(kind)) {
    const s = suggestGpa(d, kind);
    patch.o_gest = input.g ?? s.g;
    patch.o_par = input.p ?? s.p;
    patch.o_abort = input.a ?? s.a;
    const bits = [label];
    if (kind === "accouchement") {
      if (input.terme) bits.push(`${input.terme} SA`);
      if (input.voie) bits.push(input.voie);
      if (input.voie === "césarienne") {
        patch.o_ncs = String(num(socleValue(d, "o_ncs")) + 1);
        if (input.indication) {
          patch.o_indcs = input.indication;
          bits.push(`indication : ${O_INDCS.find((o) => o.value === input.indication)?.label ?? input.indication}`);
        }
      }
    } else if (input.terme) bits.push(`${input.terme} SA`);
    if (details) bits.push(details);
    patch.o_atcd_gross = addLine(d.o_atcd_gross, `${year(input.date)} : ${bits.join(", ")}`, "\n");
  } else if (kind === "chirurgie") {
    patch.chir = addLine(d.chir, `${year(input.date)} : ${details}`, "\n");
  } else if (kind === "diagnostic") {
    patch.atcdMed = addLine(d.atcdMed, `${details}${input.date ? ` (${year(input.date)})` : ""}`);
  } else if (kind === "traitement") {
    patch.traitements = addLine(d.traitements, details);
  } else if (kind === "allergie") {
    patch.allergies = addLine(d.allergies, details);
  } else if (kind === "menopause") {
    patch.g_meno = "oui";
  }
  const summary = [label, when, details].filter(Boolean).join(", ");
  patch.socleLog = appendSocleLog(d, summary, at);
  return patch;
}

export function eventIsValid(kind: SocleEventKind, input: SocleEventInput): boolean {
  if (["chirurgie", "diagnostic", "traitement", "allergie"].includes(kind)) return Boolean(str(input.text));
  return true;
}
