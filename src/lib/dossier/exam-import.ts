import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { BIO_PANELS, ECHO_PANELS, MEASURES, panelById } from "@/lib/dossier/examens";

/**
 * Import d'un compte rendu (PDF ou photo) : le texte est lu sur le poste, l'identité de la patiente
 * est masquée avant tout envoi, puis les valeurs sont classées dans le bon examen. Le résultat est
 * toujours présenté au médecin pour vérification : rien n'est enregistré automatiquement.
 */

export type Extraction = {
  kind: ExamEntry["kind"];
  panel: string;
  date: string | null;
  values: Record<string, string>;
  notes: string[];
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Masque nom, prénom, CIN, téléphone et date de naissance de la patiente dans le texte. */
export function redactIdentity(text: string, d: PatientSnapshot): string {
  let out = text;
  const replace = (value: string | undefined, label: string, minLength = 3) => {
    const v = (value ?? "").trim();
    if (v.length < minLength) return;
    // Recherche insensible à la casse et aux accents, sur le texte d'origine.
    const folded = fold(out);
    const needle = fold(v);
    let idx = folded.indexOf(needle);
    while (idx >= 0) {
      out = out.slice(0, idx) + label + out.slice(idx + v.length);
      const again = fold(out);
      idx = again.indexOf(needle, idx + label.length);
    }
  };
  for (const part of `${d.nom ?? ""} ${d.prenom ?? ""}`.split(/\s+/)) replace(part, "[PATIENTE]");
  replace(d.cin, "[CIN]", 5);
  const tel = (d.tel ?? "").replace(/\D/g, "");
  if (tel.length >= 6) {
    const pattern = tel.slice(-8).split("").join("[\\s.-]?");
    out = out.replace(new RegExp(pattern, "g"), "[TEL]");
  }
  const ddn = (d.ddn ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ddn) {
    const [, y, m, j] = ddn;
    for (const f of [`${j}/${m}/${y}`, `${j}-${m}-${y}`, `${j}.${m}.${y}`, `${y}-${m}-${j}`]) {
      out = out.replace(new RegExp(escape(f), "g"), "[DATE DE NAISSANCE]");
    }
  }
  return out;
}

// ── Lecture locale (sans IA) ───────────────────────────────────────────────────

type Rule = { id: string; re: RegExp };

/** Ordre important : les libellés les plus spécifiques d'abord (HbA1c avant hémoglobine, CA 125 avant CA). */
const RULES: Rule[] = [
  { id: "hba1c", re: /hba1c|hemoglobine glyquee/ },
  { id: "hgpo2", re: /hgpo.*(t\s*120|2\s*h)|(t\s*120|2\s*h(eures?)?).*glyc/ },
  { id: "hgpo1", re: /hgpo.*(t\s*60|1\s*h)|(t\s*60|1\s*h(eure)?).*glyc/ },
  { id: "hgpo0", re: /hgpo.*(t\s*0\b|a jeun)/ },
  { id: "hb", re: /hemoglobine|\bhb\b|\bhgb\b/ },
  { id: "plq", re: /plaquettes|\bplt\b/ },
  { id: "gb", re: /leucocytes|globules blancs|\bgb\b/ },
  { id: "vgm", re: /\bvgm\b|\bmcv\b/ },
  { id: "ferritine", re: /ferritine/ },
  { id: "crp", re: /\bcrp\b|proteine c reactive/ },
  { id: "gly", re: /glycemie|glucose a jeun/ },
  { id: "t4l", re: /t4 ?l(ibre)?\b|\bft4\b/ },
  { id: "tsh", re: /\btsh\b/ },
  { id: "fsh", re: /\bfsh\b/ },
  { id: "lh", re: /\blh\b/ },
  { id: "e2", re: /estradiol|oestradiol|\be2\b/ },
  { id: "amh", re: /\bamh\b|antimulleri/ },
  { id: "prl", re: /prolactine/ },
  { id: "prog", re: /progesterone/ },
  { id: "testo", re: /testosterone/ },
  { id: "dheas", re: /dhea-?s|sulfate de dhea/ },
  { id: "bhcg", re: /hcg/ },
  { id: "ca125", re: /\bca ?-?125\b/ },
  { id: "he4", re: /\bhe ?4\b/ },
  { id: "asat", re: /\basat\b|\btgo\b|\bsgot\b/ },
  { id: "alat", re: /\balat\b|\btgp\b|\bsgpt\b/ },
  { id: "creat", re: /creatinin/ },
  { id: "urique", re: /acide urique|uricemie/ },
  { id: "proteinurie", re: /proteinurie/ },
  { id: "tp", re: /taux de prothrombine|\btp\b/ },
  { id: "tca", re: /\btca\b|\btck\b/ },
  { id: "fibri", re: /fibrinogene/ },
  { id: "ddimeres", re: /d-? ?dimeres?/ },
  { id: "lcc", re: /\blcc\b|\bcrl\b|longueur cranio/ },
  { id: "bip", re: /\bbip\b|\bbpd\b/ },
  { id: "pc", re: /\bpc\b|\bhc\b|perimetre cephalique/ },
  { id: "ca", re: /\bca\b(?! ?-?125)|\bac\b|perimetre abdominal/ },
  { id: "lf", re: /\blf\b|\bfl\b|longueur femorale|femur/ },
  { id: "pfe", re: /\bpfe\b|\befw\b|poids f(oe|œ|e)tal/ },
  { id: "col", re: /longueur du col|cervicometrie|\bcl\b/ },
  { id: "ip_ao", re: /arteres? ombilicale|\bua[- ]?pi\b/ },
  { id: "ip_acm", re: /cerebrale moyenne|\bacm\b|\bmca[- ]?pi\b/ },
  { id: "cfa", re: /\bcfa\b|follicules antraux/ },
  { id: "endometre", re: /endometre/ },
];

const QUAL: Rule[] = [
  { id: "groupe", re: /groupe sanguin|groupe abo|\bgroupe\b/ },
  { id: "rai", re: /\brai\b|agglutinines irregulieres/ },
  { id: "toxo", re: /toxoplasm/ },
  { id: "rubeole", re: /rubeole/ },
  { id: "hbs", re: /ag ?hbs/ },
  { id: "vih", re: /\bvih\b|\bhiv\b/ },
  { id: "syphilis", re: /syphilis|tpha|vdrl/ },
  { id: "ecbu", re: /\becbu\b|uroculture/ },
];

// Espace des milliers accepté (« 1 650 g », « 245 000 /mm3 »), sinon nombre simple.
const NUMBER = /(-?\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?)/;
const BIO_IDS: Record<string, true> = Object.fromEntries(BIO_PANELS.flatMap((p) => p.analytes).map((id) => [id, true]));

function numberAfter(line: string, from: number): string | null {
  const m = line.slice(from).match(NUMBER);
  return m ? m[1].replace(/[   ]/g, "").replace(",", ".") : null;
}

/** Conversions d'unités courantes, signalées au médecin. */
function convert(id: string, value: string, line: string, notes: string[]): string {
  const v = parseFloat(value);
  if (!Number.isFinite(v)) return value;
  if ((id === "gly" || id.startsWith("hgpo")) && /mmol/.test(line)) {
    notes.push(`${MEASURES[id].label} convertie de ${value} mmol/L en g/L.`);
    return (v * 0.18).toFixed(2);
  }
  if (id === "hb" && v > 30) {
    notes.push(`Hémoglobine convertie de ${value} g/L en g/dL.`);
    return (v / 10).toFixed(1);
  }
  if (id === "plq" && v > 2000) {
    notes.push(`Plaquettes converties de ${value}/mm³ en G/L.`);
    return String(Math.round(v / 1000));
  }
  return value;
}

const POS = /positi|presence|present|immun|reacti/;
const NEG = /negati|absence|absent|non immun|non reacti|sterile/;

function qualitative(id: string, line: string): string | null {
  if (id === "groupe") {
    const m = line.match(/\b(ab|a|b|o)\s*(rh(esus)?|rhd)?\s*(\+|-|positif|negatif)/);
    if (!m) return null;
    const sign = m[4] === "+" || m[4] === "positif" ? "+" : "-";
    return `${m[1].toUpperCase()}${sign}`;
  }
  if (id === "toxo" || id === "rubeole") {
    if (/igm/.test(line) && /igm[^a-z]{0,25}(positi|presence)/.test(line)) return "Infection active (IgM+)";
    if (/non immun|igg[^a-z]{0,25}negati/.test(line)) return "Non immune";
    if (/immun|igg[^a-z]{0,25}positi/.test(line)) return "Immune";
    return null;
  }
  if (id === "ecbu") {
    if (/sterile|absence de germe|< ?10/.test(line)) return "norm";
    if (/10 ?\^? ?5|10\*5|positi|infection/.test(line)) return "pos";
    return null;
  }
  if (NEG.test(line)) return "neg";
  if (POS.test(line)) return "pos";
  return null;
}

function toIso(d: string, m: string, y: string): string | null {
  const year = y.length === 2 ? `20${y}` : y;
  const iso = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) || t.getTime() > Date.now() + 86400000 ? null : iso;
}

/** Date de prélèvement ou d'examen : la date annoncée comme telle, sinon la plus récente du document. */
export function findExamDate(text: string): string | null {
  const t = fold(text);
  const labelled = t.match(
    /(?:preleve(?:ment)?|date (?:du |d')?(?:prelevement|examen|echographie)|realise|edite)[^0-9]{0,30}(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/,
  );
  if (labelled) {
    const iso = toIso(labelled[1], labelled[2], labelled[3]);
    if (iso) return iso;
  }
  const all = [...t.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g)]
    .map((m) => toIso(m[1], m[2], m[3]))
    .filter((x): x is string => Boolean(x))
    .sort();
  return all.length ? all[all.length - 1] : null;
}

/** Choisit le bilan ou le type d'écho qui couvre le mieux les valeurs trouvées. */
export function guessPanel(values: Record<string, string>): { kind: ExamEntry["kind"]; panel: string } {
  const ids = Object.keys(values);
  let best = { panel: BIO_PANELS[0], score: -1 };
  for (const p of [...BIO_PANELS, ...ECHO_PANELS]) {
    const hit = ids.filter((id) => p.analytes.includes(id)).length;
    // Couvrir le plus de valeurs, puis préférer le bilan le plus précis.
    const score = hit * 100 - (p.analytes.length - hit);
    if (score > best.score) best = { panel: p, score };
  }
  return { kind: best.panel.kind ?? "bio", panel: best.panel.id };
}

export function parseLocally(text: string): Extraction {
  const values: Record<string, string> = {};
  const notes: string[] = [];
  const hgpo = /hgpo|hyperglycemie provoquee|75 ?g/.test(fold(text));
  // Les sigles d'écho (CA, PC, LF…) ne sont lus que dans un compte rendu d'échographie (CA = calcium sinon).
  const echo = /echograph|biometrie|doppler|\bsa\b|amenorrhee|endometre|follicul/.test(fold(text));
  for (const raw of text.split(/\r?\n/)) {
    const line = fold(raw);
    if (!line.trim()) continue;
    for (const r of QUAL) {
      if (values[r.id] || !r.re.test(line)) continue;
      const v = qualitative(r.id, line);
      if (v) values[r.id] = v;
    }
    for (const r of RULES) {
      if (r.id.startsWith("hgpo") && !hgpo) continue;
      if (MEASURES[r.id] && !(r.id in BIO_IDS) && !echo) continue;
      const m = r.re.exec(line);
      if (!m) continue;
      if (!values[r.id]) {
        const n = numberAfter(line, m.index + m[0].length);
        if (n) values[r.id] = convert(r.id, n, line, notes);
      }
      break; // une ligne = une analyse
    }
  }
  if (hgpo && values.gly && !values.hgpo0) {
    values.hgpo0 = values.gly;
    delete values.gly;
  }
  const { kind, panel } = guessPanel(values);
  return { kind, panel, date: findExamDate(text), values, notes };
}

// ── Validation d'un résultat (IA ou local) ─────────────────────────────────────

/**
 * Ne garde que des identifiants connus et des valeurs plausibles pour leur type ; tout le reste est
 * renvoyé en note. Utilisé côté serveur sur la réponse de l'IA et côté client avant affichage.
 */
export function validateExtraction(raw: unknown, fallbackKind: ExamEntry["kind"] = "bio"): Extraction {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const notes = Array.isArray(o.notes) ? o.notes.filter((n): n is string => typeof n === "string").slice(0, 20) : [];
  const values: Record<string, string> = {};
  const rawValues = (o.values && typeof o.values === "object" ? o.values : {}) as Record<string, unknown>;
  for (const [id, v] of Object.entries(rawValues)) {
    const m = MEASURES[id];
    const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
    if (!m || !s) continue;
    if (m.options) {
      const opt = m.options.find((x) => fold(x.value) === fold(s) || fold(x.label) === fold(s));
      if (opt) values[id] = opt.value;
      else notes.push(`${m.label} : « ${s} » non reconnu.`);
    } else if (m.text) {
      values[id] = s.slice(0, 200);
    } else {
      const n = s.replace(",", ".").match(/^-?\d+(\.\d+)?$/);
      if (n) values[id] = n[0];
      else notes.push(`${m.label} : « ${s} » n'est pas un nombre.`);
    }
  }
  const date = typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : null;
  const requested = typeof o.panel === "string" ? panelById(o.panel) : undefined;
  const guessed = guessPanel(values);
  const panel = requested ?? panelById(guessed.panel)!;
  const kind = panel.kind ?? (o.kind === "echo" ? "echo" : fallbackKind);
  return { kind, panel: panel.id, date, values, notes };
}

/** Catalogue envoyé à l'IA : identifiants, libellés, unités et valeurs permises. */
export function catalogForPrompt(): string {
  const panels = [...BIO_PANELS, ...ECHO_PANELS]
    .map((p) => `${p.id} (${p.kind ?? "bio"}) : ${p.label} → ${p.analytes.join(", ")}`)
    .join("\n");
  const measures = Object.values(MEASURES)
    .map((m) => {
      const kind = m.options ? `valeurs : ${m.options.map((x) => x.value).join(" | ")}` : m.text ? "texte" : "nombre";
      return `${m.id} : ${m.label}${m.unit ? ` [${m.unit}]` : ""} (${kind})`;
    })
    .join("\n");
  return `BILANS ET ÉCHOGRAPHIES\n${panels}\n\nMESURES\n${measures}`;
}
