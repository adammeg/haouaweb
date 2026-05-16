import type { PatientSnapshot } from "@/types/domain";
import { collectT2FromSnapshot } from "./collect";
import { buildFetusSvgString } from "./fetus-svg";
import { svgToPngDataUri } from "./svg-to-png";
import { getT2Percentiles } from "./anomalies";
import {
  appendPdfSection,
  createHiddenPrintRoot,
  exportElementToPdf,
} from "@/lib/pdf/html2pdf-export";

const ROOT_ID = "hawae-t2-pdf-root";

const LABELS: Record<string, string> = {
  bonne: "Bonne",
  moyenne: "Moyenne",
  limitee: "Limitee",
  cepha: "Cephalique",
  siege: "Siege",
  transverse: "Transverse",
  normal: "Normal",
  oligo: "Oligoamnios",
  poly: "Hydramnios",
  praevia: "Praevia",
  visible: "Visible",
  absent: "Absent",
  intact: "Intacte",
  defect: "Defect",
  regulier: "Regulier",
  irregulier: "Irregulier",
};

function lbl(v?: string): string {
  if (!v) return "\u2014";
  return LABELS[v] ?? v;
}

function defaultConclusion(d: ReturnType<typeof collectT2FromSnapshot>): string {
  const { check } = d;
  if (check.anomalies.length) {
    return (
      "Examen morphologique a " +
      d.ag_sa +
      " objectivant : " +
      check.anomalies.join(", ") +
      ". Avis en medecine foetale recommande."
    );
  }
  if (check.warnings.length) {
    return (
      "Examen a " +
      d.ag_sa +
      " globalement rassurant. Vigilance : " +
      check.warnings.join(", ") +
      "."
    );
  }
  return (
    "Examen morphologique a " +
    d.ag_sa +
    " dans les limites de la normale. Aucune anomalie structurelle identifiee."
  );
}

export async function generateT2MorphoPdf(
  draft: PatientSnapshot,
  doctorName?: string,
  iaText?: string | null,
): Promise<void> {
  const d = collectT2FromSnapshot(draft, doctorName);
  if (iaText) d.ia_conclusion = iaText;
  const agNum = parseFloat(d.ag) || 22;
  const svgStr = buildFetusSvgString(d, d.check, agNum);
  const png = await svgToPngDataUri(svgStr);

  const root = createHiddenPrintRoot(ROOT_ID);
  const pcts = getT2Percentiles(draft);

  const header = document.createElement("header");
  header.style.cssText =
    "padding:20px 24px;background:linear-gradient(135deg,#0a5c5c,#0d7a7a);color:#fff;font-family:Arial,sans-serif";
  const h1 = document.createElement("h1");
  h1.textContent = "Compte-rendu echographie morphologique T2";
  h1.style.cssText = "margin:0;font-size:18px";
  const sub = document.createElement("p");
  sub.textContent = d.pat + " \u00b7 " + d.ag_sa + " \u00b7 " + d.date;
  sub.style.cssText = "margin:6px 0 0;font-size:12px;opacity:.85";
  header.appendChild(h1);
  header.appendChild(sub);
  const op = document.createElement("p");
  op.textContent = "Operateur : " + d.operateur + " \u00b7 " + d.machine;
  op.style.cssText = "margin:4px 0 0;font-size:11px;opacity:.75";
  header.appendChild(op);
  root.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "padding:20px 24px;font-family:Arial,sans-serif;font-size:11px";
  root.appendChild(body);

  if (png) {
    const imgWrap = document.createElement("div");
    imgWrap.style.cssText = "text-align:center;margin-bottom:16px";
    const img = document.createElement("img");
    img.src = png;
    img.alt = "Schema foetal";
    img.style.cssText =
      "max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px";
    imgWrap.appendChild(img);
    body.appendChild(imgWrap);
  }

  const statusBox = document.createElement("div");
  const hasA = d.check.anomalies.length > 0;
  const hasW = d.check.warnings.length > 0;
  statusBox.style.cssText =
    "margin:0 0 16px;padding:12px;border-radius:8px;font-size:12px;font-weight:600";
  if (hasA) {
    statusBox.style.background = "#fee2e2";
    statusBox.style.color = "#991b1b";
    statusBox.textContent = "ANOMALIE(S) : " + d.check.anomalies.join(" \u00b7 ");
  } else if (hasW) {
    statusBox.style.background = "#fef9c3";
    statusBox.style.color = "#92400e";
    statusBox.textContent = "Vigilance : " + d.check.warnings.join(" \u00b7 ");
  } else {
    statusBox.style.background = "#f0fdf4";
    statusBox.style.color = "#166534";
    statusBox.textContent = "Morphologie normale";
  }
  body.appendChild(statusBox);

  appendPdfSection(body, "Biometrie (Salomon 2011)", [
    ...pcts.map((r) => ({
      label: r.label,
      value: r.value
        ? String(r.value) + (r.ref ? " \u2014 " + r.ref.result.txt : "")
        : "\u2014",
    })),
    { label: "Col", value: d.col ? d.col + " mm" : "\u2014" },
  ]);

  appendPdfSection(body, "Morphologie SNC et visage", [
    { label: "CSP", value: lbl(d.csp) },
    { label: "Cervelet", value: lbl(d.cerv) },
    {
      label: "Citerne magna",
      value: d.cist_magna ? d.cist_magna + " mm" : "\u2014",
    },
    { label: "Atrium", value: d.atrium ? d.atrium + " mm" : "\u2014" },
    {
      label: "Profil / Levres",
      value: lbl(d.profil) + " / " + lbl(d.levres),
    },
  ]);

  appendPdfSection(body, "Coeur et thoraco-abdominal", [
    {
      label: "Situs / 4 cav / VEJ / 3VT",
      value: [d.situs, d.q4cav, d.vej, d.q3vt].map(lbl).join(" \u00b7 "),
    },
    {
      label: "FCF / Rythme",
      value: (d.fcf || "\u2014") + " bpm / " + lbl(d.rythme),
    },
    {
      label: "Poumons / Estomac",
      value: lbl(d.poumons) + " / " + lbl(d.estomac),
    },
    {
      label: "Paroi / Reins / Pyelon",
      value:
        lbl(d.paroi) + " / " + lbl(d.reins) + " / " + (d.pyelon || "\u2014"),
    },
    {
      label: "Rachis / Membres",
      value: lbl(d.rachis) + " / " + lbl(d.membres),
    },
  ]);

  appendPdfSection(body, "Placenta et Doppler", [
    {
      label: "LA / ILA",
      value: lbl(d.la) + (d.ila ? " \u00b7 ILA " + d.ila + " cm" : ""),
    },
    {
      label: "Placenta",
      value: lbl(d.placenta_loc) + " grade " + (d.placenta_grade || "\u2014"),
    },
    {
      label: "IP AO / EDF / ACM",
      value:
        (d.ip_ao || "\u2014") +
        " / " +
        lbl(d.edf) +
        " / " +
        (d.ip_acm || "\u2014"),
    },
    { label: "UtA G/D", value: d.uta_g + " / " + d.uta_d },
    {
      label: "CPR",
      value:
        d.ip_ao && d.ip_acm
          ? (parseFloat(d.ip_acm) / parseFloat(d.ip_ao)).toFixed(2)
          : "\u2014",
    },
  ]);

  const conclusion = d.ia_conclusion || defaultConclusion(d);
  const concSec = document.createElement("section");
  concSec.style.cssText = "margin-top:16px";
  const concH = document.createElement("h3");
  concH.textContent = "Conclusion";
  concH.style.cssText =
    "font-size:13px;color:#0a5c5c;border-bottom:2px solid #c9a84c;padding-bottom:4px";
  concSec.appendChild(concH);
  const concP = document.createElement("p");
  concP.textContent = conclusion;
  concP.style.cssText =
    "margin-top:8px;font-size:11px;line-height:1.6;white-space:pre-wrap";
  concSec.appendChild(concP);
  body.appendChild(concSec);

  if (d.notes) {
    appendPdfSection(body, "Observations", [{ label: "Notes", value: d.notes }]);
  }

  const footer = document.createElement("footer");
  footer.style.cssText =
    "padding:12px 24px;font-size:9px;color:#6b7280;border-top:1px solid #e5e7eb";
  footer.textContent =
    "HawaeMD - ISUOG 2022 - Salomon 2011 - " +
    new Date().toLocaleString("fr-FR");
  root.appendChild(footer);

  const safe = d.pat.replace(/[^\w\s-]/g, "").trim() || "patiente";
  await exportElementToPdf(root, { filename: "echo-T2-" + safe + ".pdf" });
  root.remove();
}
