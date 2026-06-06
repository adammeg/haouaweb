/**
 * Génération PDF du Compte-Rendu Opératoire (port v50 « generateOpCR »).
 * Pattern fenêtre d'impression (window.open + print) comme obst-calendar-pdf.
 */

export type CrOpType =
  | "coelio"
  | "hystero"
  | "cesarienne"
  | "laparotomie"
  | "conisation"
  | "autre";

export const CR_OP_LABELS: Record<CrOpType, string> = {
  coelio: "Cœlioscopie",
  hystero: "Hystéroscopie opératoire",
  cesarienne: "Césarienne",
  laparotomie: "Laparotomie",
  conisation: "Conisation",
  autre: "Intervention chirurgicale",
};

export type CrOpData = {
  type: CrOpType;
  patientName: string;
  age: string;
  operateur: string;
  etablissement: string;
  date: string; // yyyy-mm-dd
  duree: string;
  indication: string;
  anesthesie: string;
  position: string;
  suites: string;
  saignement: string;
  prescriptions: string;
  commentaire: string;
  fields: Record<string, string>;
};

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nl(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

function row(label: string, value: string): string {
  if (!value) return "";
  return (
    '<div style="margin:3px 0"><span style="color:#6b7280;display:inline-block;min-width:160px">' +
    esc(label) +
    " :</span>" +
    esc(value) +
    "</div>"
  );
}

function block(text: string): string {
  if (!text) return "";
  return (
    '<div style="background:#f8fafc;border-left:3px solid #0d6e6e;padding:8px 12px;border-radius:0 6px 6px 0;margin:6px 0;font-size:12px;line-height:1.6">' +
    nl(text) +
    "</div>"
  );
}

function techSection(data: CrOpData): string {
  const f = data.fields;
  switch (data.type) {
    case "coelio":
      return (
        row("Voie d'abord", f.voie) +
        row("Pneumopéritoine", f.pression ? f.pression + " mmHg" : "") +
        row("Geste principal", f.geste) +
        block(f.detail) +
        row("Anatomopathologie", f.anapath)
      );
    case "hystero":
      return (
        row("Type", f.type) +
        row("Milieu de distension", f.milieu) +
        row("Geste", f.geste) +
        block(f.detail)
      );
    case "cesarienne":
      return (
        row("Terme", f.terme) +
        row("Indication", f.indication) +
        row("Incision", f.incision) +
        row("Présentation", f.pres) +
        row("Apgar 1'/5'", f.apgar) +
        row("Poids de naissance", f.poids ? f.poids + " g" : "") +
        block(f.detail)
      );
    case "laparotomie":
      return (
        row("Incision", f.incision) +
        row("Geste", f.geste) +
        block(f.detail) +
        row("Pertes sanguines", f.sang ? "≈ " + f.sang + " mL" : "") +
        row("Drainage", f.drain)
      );
    case "conisation":
      return (
        row("Technique", f.tech) +
        row("Hauteur du cône", f.hauteur ? f.hauteur + " mm" : "") +
        row("Indication", f.indication) +
        block(f.detail)
      );
    default:
      return row("Intitulé", f.titre) + block(f.detail);
  }
}

export function printCrOpPdf(data: CrOpData): void {
  const opDateFr = data.date
    ? new Date(data.date + "T12:00").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const label = CR_OP_LABELS[data.type];

  const sectionTitle = (t: string): string =>
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#0d6e6e;border-bottom:1px solid #b2dfdf;padding-bottom:4px;margin:16px 0 10px">' +
    esc(t) +
    "</div>";

  const presc = data.prescriptions
    ? '<div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:10px 14px;border-radius:0 8px 8px 0;font-size:12px;line-height:1.8;margin:8px 0"><strong>Prescriptions :</strong><br>' +
      nl(data.prescriptions) +
      "</div>"
    : "";
  const comm = data.commentaire
    ? '<div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 8px 8px 0;font-size:12px;line-height:1.6;margin:8px 0"><strong>Commentaires :</strong><br>' +
      nl(data.commentaire) +
      "</div>"
    : "";

  const html = [
    '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">',
    "<title>CR Opératoire — " + esc(data.patientName) + "</title>",
    "<style>body{font-family:Arial,'DM Sans',sans-serif;color:#1a1a2e;margin:0;padding:0;font-size:13px}",
    ".wrap{max-width:680px;margin:0 auto;padding:16px}",
    "@media print{.noprint{display:none}}</style></head><body><div class='wrap'>",
    '<div style="background:linear-gradient(135deg,#0d4f4f,#1a9a9a);padding:20px 24px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:flex-start">',
    "<div><div style=\"color:rgba(255,255,255,.7);font-size:11px;text-transform:uppercase;letter-spacing:.1em\">Compte-Rendu Opératoire</div>",
    '<div style="color:#fff;font-size:22px;font-weight:700;margin:4px 0">' +
      esc(label) +
      "</div>",
    '<div style="color:rgba(255,255,255,.85);font-size:12px">Le ' +
      esc(opDateFr) +
      (data.duree ? " — Durée : " + esc(data.duree) + " min" : "") +
      "</div></div>",
    '<div style="text-align:right;color:rgba(255,255,255,.9);font-size:11px">',
    '<div style="font-weight:700;font-size:13px">' +
      esc(data.operateur) +
      "</div>",
    "<div>" + esc(data.etablissement) + "</div>",
    "<div>Service Gynécologie-Obstétrique</div></div></div>",
    '<div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 24px">',
    sectionTitle("Identité de la patiente"),
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">',
    "<div><span style=\"color:#6b7280;min-width:90px;display:inline-block\">Nom :</span><strong>" +
      esc(data.patientName) +
      "</strong></div>",
    '<div><span style="color:#6b7280;min-width:90px;display:inline-block">Âge :</span>' +
      (esc(data.age) || "—") +
      "</div></div>",
    sectionTitle("Conditions opératoires"),
    row("Indication", data.indication),
    row("Anesthésie", data.anesthesie),
    row("Position", data.position),
    sectionTitle("Technique opératoire"),
    techSection(data),
    sectionTitle("Suites opératoires immédiates"),
    row("Suites", data.suites || "Simples"),
    row("Saignement post-opératoire", data.saignement || "Minime"),
    presc,
    comm,
    '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end">',
    '<div style="text-align:center;font-size:12px;color:#6b7280">',
    '<strong style="display:block;color:#0d6e6e;font-size:13px;margin-bottom:4px">' +
      esc(data.operateur) +
      "</strong>",
    "<div>Gynécologue-Obstétricien</div>",
    "<div>" + esc(data.etablissement) + "</div>",
    '<div style="width:160px;height:40px;border-bottom:1px solid #1a1a2e;margin:12px auto 4px"></div>',
    "<div>Signature &amp; Cachet</div></div></div>",
    "</div></div></body></html>",
  ].join("");

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
