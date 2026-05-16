/** Export PDF côté client via html2pdf.js (règle v49 : pas de template literals dans le HTML PDF). */

export type PdfExportOptions = {
  filename: string;
  margin?: number | [number, number, number, number];
  orientation?: "portrait" | "landscape";
};

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions,
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;
  const margin = options.margin ?? [10, 10, 10, 10];
  await html2pdf()
    .set({
      margin,
      filename: options.filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: options.orientation ?? "portrait",
      },
    })
    .from(element)
    .save();
}

export function createHiddenPrintRoot(id: string): HTMLDivElement {
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (el) {
    el.innerHTML = "";
    return el;
  }
  el = document.createElement("div");
  el.id = id;
  el.setAttribute("data-pdf-root", "1");
  el.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;z-index:-1";
  document.body.appendChild(el);
  return el;
}

/** Append nodes built with DOM APIs (no innerHTML from templates). */
export function appendPdfSection(
  root: HTMLElement,
  title: string,
  rows: { label: string; value: string }[],
): void {
  const section = document.createElement("section");
  section.style.cssText = "margin-bottom:16px;font-family:Arial,sans-serif";
  const h = document.createElement("h3");
  h.textContent = title;
  h.style.cssText =
    "font-size:13px;color:#0a5c5c;border-bottom:2px solid #c9a84c;padding-bottom:4px;margin:0 0 8px";
  section.appendChild(h);
  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:11px";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    const tdL = document.createElement("td");
    tdL.textContent = r.label;
    tdL.style.cssText = "padding:4px 8px;border:1px solid #e5e7eb;width:40%";
    const tdV = document.createElement("td");
    tdV.textContent = r.value || "—";
    tdV.style.cssText = "padding:4px 8px;border:1px solid #e5e7eb";
    tr.appendChild(tdL);
    tr.appendChild(tdV);
    table.appendChild(tr);
  });
  section.appendChild(table);
  root.appendChild(section);
}
