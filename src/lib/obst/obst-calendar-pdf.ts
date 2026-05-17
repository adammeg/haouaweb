import type { CalTimelineEvent, ObstCalendarSummary } from "@/lib/obst/obst-calendar-config";
import {
  CAL_TYPE_LABELS,
  formatCalDate,
  trimSeparatorLabel,
} from "@/lib/obst/obst-calendar-config";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function printObstCalendarPdf(
  patientName: string,
  summary: ObstCalendarSummary,
  events: CalTimelineEvent[],
): void {
  const fmt = formatCalDate;
  const daysLabel =
    summary.daysUntilDpa > 0
      ? "dans " + summary.daysUntilDpa + " j"
      : summary.daysUntilDpa === 0
        ? "Aujourd'hui"
        : "Dépassée de " + Math.abs(summary.daysUntilDpa) + " j";

  let lastTrim = 0;
  const parts: string[] = [];

  for (const item of events) {
    if (item.trim !== lastTrim) {
      lastTrim = item.trim;
      parts.push(
        '<div class="trim">' + esc(trimSeparatorLabel(item.trim)) + "</div>",
      );
    }
    const cls =
      item.status === "current"
        ? "item current"
        : item.status === "past"
          ? "item past"
          : "item";
    const saRange =
      item.sa[0] === item.sa[1]
        ? item.sa[0] + " SA"
        : item.sa[0] + "–" + item.sa[1] + " SA";

    let inner = "";
    for (const e of item.examens) {
      inner += '<div class="exam">• ' + esc(e) + "</div>";
    }
    for (const v of item.vaccins) {
      inner +=
        '<div style="background:#fef3c7;padding:4px 8px;border-radius:4px;margin:4px 0">' +
        esc(v) +
        "</div>";
    }
    if (item.note) {
      inner += '<div class="note">ℹ️ ' + esc(item.note) + "</div>";
    }

    parts.push(
      '<div class="' +
        cls +
        '"><strong>' +
        esc(item.icon + " " + item.titre) +
        '</strong><br><span class="tag">' +
        esc(CAL_TYPE_LABELS[item.type]) +
        "</span> " +
        esc(saRange) +
        " · " +
        esc(fmt(item.dateEvt)) +
        (item.sa[0] !== item.sa[1]
          ? " → au plus tard " + esc(fmt(item.dateLimite))
          : "") +
        inner +
        "</div>",
    );
  }

  let body = parts.join("");
  body = body.replace(/<div /g, "<div ").replace(/<\/div>/g, "</div>");

  const resume =
    '<div class="resume">' +
    '<div><div style="font-size:11px;opacity:.8">DDR</div><div style="font-weight:700">' +
    esc(fmt(summary.ddr)) +
    "</div></div>" +
    '<div><div style="font-size:11px;opacity:.8">Terme actuel</div><div style="font-size:20px;font-weight:900">' +
    summary.saCurrent +
    ' SA</div><div style="font-size:11px;opacity:.8">' +
    esc(summary.trimLabel) +
    "</div></div>" +
    '<div><div style="font-size:11px;opacity:.8">DPA estimée</div><div style="font-weight:700">' +
    esc(fmt(summary.dpa)) +
    '</div><div style="font-size:11px;opacity:.8">' +
    esc(daysLabel) +
    "</div></div></div>";

  const resumeClean = resume
    .replace(/<div /g, "<div ")
    .replace(/<\/div>/g, "</div>");

  const html = [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Calendrier grossesse</title>",
    "<style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}",
    "h1{color:#0a5a5a;font-size:16px}",
    ".resume{background:#0a5a5a;color:#fff;padding:12px;border-radius:8px;margin-bottom:16px;display:flex;gap:20px;flex-wrap:wrap}",
    ".resume>div{text-align:center;flex:1;min-width:100px}",
    ".item{border:1px solid #ddd;border-radius:8px;padding:10px;margin-bottom:8px}",
    ".item.current{border-color:#0a5a5a;background:#f0fafa}",
    ".item.past{opacity:.65}",
    ".tag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:10px;font-weight:bold;color:#fff;background:#0a5a5a}",
    ".trim{font-weight:800;color:#0a5a5a;border-bottom:2px solid #0a5a5a;padding:10px 0 4px;margin:12px 0 8px}",
    "</style></head><body>",
    "<h1>Calendrier de suivi de grossesse</h1>",
    "<p>Patiente : " + esc(patientName) + " · HawaeMD</p>",
    resumeClean,
    body,
    "</body></html>",
  ].join("");

  const fixed = html
    .split("<div ")
    .join("<div ")
    .split("</div>")
    .join("</div>");

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(fixed);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
