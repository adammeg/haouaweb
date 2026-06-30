/**
 * En-tête praticien + patient pour rendu document A4.
 */

import type { DocumentRenderContext } from "@/types/documents";

const TEAL = "#0a5c5c";

export function buildDocumentHeaderHtml(ctx: DocumentRenderContext): string {
  const dr = ctx.practitioner;
  const logo = dr.logoBase64
    ? `<img src="${dr.logoBase64}" alt="" style="max-height:52px;max-width:120px;object-fit:contain" />`
    : "";

  return `
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${TEAL};padding-bottom:12px;margin-bottom:20px;font-family:Inter,system-ui,sans-serif;font-size:11px;color:#1a2e2e">
  <div style="display:flex;gap:12px;align-items:center">
    ${logo}
    <div>
      <div style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:${TEAL}">${escapeHtml(dr.displayName)}</div>
      <div style="color:#3d5c5c;margin-top:2px">${escapeHtml(dr.specialite)}</div>
      ${dr.matriculeOrdre ? `<div style="font-size:10px;color:#6b7280">N° Ordre : ${escapeHtml(dr.matriculeOrdre)}</div>` : ""}
    </div>
  </div>
  <div style="text-align:right;font-size:10px;color:#3d5c5c;line-height:1.5">
    <div style="font-weight:600">${escapeHtml(dr.etablissement)}</div>
    <div>${escapeHtml(dr.adresse)}</div>
    <div>${escapeHtml(dr.codePostal)} ${escapeHtml(dr.ville)}</div>
    ${dr.telephone ? `<div>Tél. ${escapeHtml(dr.telephone)}</div>` : ""}
    ${dr.email ? `<div>${escapeHtml(dr.email)}</div>` : ""}
  </div>
</div>`;
}

export function buildPatientBlockHtml(ctx: DocumentRenderContext): string {
  const p = ctx.patient;
  if (!p.fullName.trim()) return "";
  return `
<div style="background:#f0fafa;border:1px solid #b8e0e0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;font-family:Inter,system-ui,sans-serif">
  <strong>Patiente :</strong> ${escapeHtml(p.fullName)}
  ${p.ddn ? ` · Née le ${escapeHtml(formatDateFr(p.ddn))}` : ""}
  ${p.age ? ` · ${escapeHtml(p.age)}` : ""}
  ${p.dossierId ? ` · Dossier ${escapeHtml(p.dossierId)}` : ""}
  ${p.terme ? ` · ${escapeHtml(p.terme)}` : ""}
  ${p.parite ? ` · ${escapeHtml(p.parite)}` : ""}
</div>`;
}

export function buildDocumentFooterHtml(ctx: DocumentRenderContext): string {
  const dr = ctx.practitioner;
  const sig = dr.signatureBase64
    ? `<img src="${dr.signatureBase64}" alt="" style="max-height:48px;max-width:140px" />`
    : dr.tamponTexte
      ? `<div style="font-style:italic;color:#6b7280;font-size:10px">${escapeHtml(dr.tamponTexte)}</div>`
      : "";

  return `
<div style="margin-top:32px;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#3d5c5c">
  <div>N° document : <strong>${escapeHtml(ctx.docNumber)}</strong></div>
  <div style="text-align:right">
    <div>Fait à ${escapeHtml(dr.ville)}, le ${formatDateFr(new Date().toISOString().slice(0, 10))}</div>
    <div style="margin-top:24px;min-width:180px;border-top:1px solid #9ca3af;padding-top:6px">
      ${sig}
      <div style="margin-top:4px;font-weight:600">${escapeHtml(dr.displayName)}</div>
    </div>
  </div>
</div>`;
}

export function wrapDocumentBody(
  ctx: DocumentRenderContext,
  title: string,
  bodyHtml: string,
  orientation: "portrait" | "landscape" = "portrait",
): string {
  return `
<div class="hawae-doc-page" data-orientation="${orientation}" style="font-family:Georgia,serif;font-size:12pt;line-height:1.65;color:#1a2e2e;max-width:${orientation === "landscape" ? "297mm" : "210mm"};margin:0 auto;padding:16mm 14mm">
  ${buildDocumentHeaderHtml(ctx)}
  ${buildPatientBlockHtml(ctx)}
  <h1 style="font-family:Georgia,serif;font-size:14pt;font-weight:700;text-align:center;text-decoration:underline;margin:0 0 20px;color:${TEAL}">${escapeHtml(title)}</h1>
  <div class="hawae-doc-body">${bodyHtml}</div>
  ${buildDocumentFooterHtml(ctx)}
</div>`;
}

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
