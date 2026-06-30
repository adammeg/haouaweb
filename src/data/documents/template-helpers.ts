import type { DocumentRenderContext } from "@/types/documents";
import { wrapDocumentBody } from "@/lib/documents/practitioner-header";
import { formatDateFr } from "@/lib/documents/smart-fields";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function f(
  ctx: DocumentRenderContext,
  id: string,
  fallback = "…………………………………",
): string {
  const v = ctx.fields[id]?.trim();
  return v ? escapeHtml(v) : fallback;
}

export function isChecked(ctx: DocumentRenderContext, id: string): boolean {
  const v = ctx.fields[id];
  return v === "1" || v === "oui" || v === "true" || v === "on";
}

export function checkedList(
  ctx: DocumentRenderContext,
  items: { id: string; label: string }[],
): string {
  const picked = items.filter((i) => isChecked(ctx, i.id)).map((i) => i.label);
  return picked.length ? picked.join(", ") : "—";
}

export function renderCert(
  ctx: DocumentRenderContext,
  title: string,
  bodyHtml: string,
): string {
  return wrapDocumentBody(ctx, title, bodyHtml, "portrait");
}

export function crTable(sections: [string, string][]): string {
  const rows = sections
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;font-weight:600;width:28%;background:#f0fafa;border:1px solid #d4e8e8">${k}</td><td style="padding:6px 10px;border:1px solid #d4e8e8">${v}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px">${rows}</table>`;
}

export function checkboxFields(
  section: string,
  items: { id: string; label: string }[],
) {
  return items.map((i) => ({
    id: i.id,
    label: i.label,
    type: "checkbox" as const,
    section,
  }));
}

export { formatDateFr, wrapDocumentBody };
