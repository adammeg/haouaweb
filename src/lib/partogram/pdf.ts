import type { PartogramSession } from "@/types/modules";
import { analyzePartogram } from "./analysis";
import {
  appendPdfSection,
  createHiddenPrintRoot,
  exportElementToPdf,
} from "@/lib/pdf/html2pdf-export";

const ROOT_ID = "hawae-parto-pdf";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export async function exportPartogramPdf(
  session: PartogramSession,
  canvasPng?: string | null,
): Promise<void> {
  const a = analyzePartogram(session);
  const root = createHiddenPrintRoot(ROOT_ID);

  const header = document.createElement("header");
  header.style.cssText =
    "padding:20px 24px;background:#0a5c5c;color:#fff;font-family:Arial,sans-serif";
  const h1 = document.createElement("h1");
  h1.textContent = "PARTOGRAMME OMS";
  h1.style.cssText = "margin:0;font-size:18px";
  const sub = document.createElement("p");
  sub.textContent =
    session.patientName +
    " — Admission " +
    new Date(session.admissionAt).toLocaleString("fr-FR");
  sub.style.cssText = "margin:8px 0 0;font-size:12px";
  header.appendChild(h1);
  header.appendChild(sub);
  root.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "padding:20px 24px;font-family:Arial,sans-serif;font-size:11px";
  root.appendChild(body);

  appendPdfSection(body, "Resume", [
    { label: "Duree travail", value: a.durationStr },
    { label: "Phase", value: a.phase },
    { label: "Anomalies", value: String(a.anomalies.length) },
    { label: "Decision", value: a.decision },
  ]);

  if (canvasPng) {
    const img = document.createElement("img");
    img.src = canvasPng;
    img.style.cssText = "width:100%;max-width:700px;margin:12px 0";
    body.appendChild(img);
  }

  const rows = session.points.map((e) => ({
    label: formatTime(e.recordedAt),
    value: [
      e.dilatationCm != null ? "Dil " + e.dilatationCm + " cm" : "",
      e.fcf ? "FCF " + e.fcf : "",
      e.taSys ? "TA " + e.taSys + "/" + (e.taDia ?? "") : "",
      e.oxytocine != null ? "Oxy " + e.oxytocine : "",
    ]
      .filter(Boolean)
      .join(" · "),
  }));
  appendPdfSection(body, "Releves horaires", rows);

  if (a.anomalies.length) {
    appendPdfSection(
      body,
      "Anomalies",
      a.anomalies.map((x, i) => ({ label: String(i + 1), value: x })),
    );
  }

  const safe = session.patientName.replace(/[^\w\s-]/g, "").trim() || "patiente";
  await exportElementToPdf(root, {
    filename: "partogramme-" + safe + ".pdf",
    orientation: "landscape",
  });
  root.remove();
}
