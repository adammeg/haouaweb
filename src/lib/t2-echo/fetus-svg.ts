import type { T2Collected } from "./collect";
import type { T2AnomalyCheck } from "./anomalies";
import {
  interpSalomon,
  SALOMON_TABLES,
  getPercentile,
  type SalomonKey,
} from "./salomon";

function num(v: string): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function colorV(val: string, k: SalomonKey, agNum: number): string {
  if (!val) return "#9ca3af";
  const ref = interpSalomon(SALOMON_TABLES[k], agNum);
  const res = ref ? getPercentile(parseFloat(val), ref) : null;
  return res ? res.col : "#16a34a";
}

function badgeT(val: string, k: SalomonKey, agNum: number, u: string): string {
  if (!val) return "ND";
  const ref = interpSalomon(SALOMON_TABLES[k], agNum);
  const res = ref ? getPercentile(parseFloat(val), ref) : null;
  return val + u + (res ? " (" + res.txt + "e)" : "");
}

export function buildFetusSvgString(
  d: T2Collected,
  check: T2AnomalyCheck,
  agNum: number,
): string {
  const cBIP = colorV(d.bip, "bip", agNum);
  const cPC = colorV(d.pc, "pc", agNum);
  const cCA = colorV(d.ca, "ca", agNum);
  const cLF = colorV(d.lf, "lf", agNum);
  const cPFE = colorV(d.pfe, "pfe", agNum);
  const sCol = check.anomalies.length
    ? "#dc2626"
    : check.warnings.length
      ? "#d97706"
      : "#16a34a";
  const sBg = check.anomalies.length
    ? "#fff5f5"
    : check.warnings.length
      ? "#fffbeb"
      : "#f0fdf4";

  let S =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 420" width="520" height="420">';
  S += '<rect width="520" height="420" fill="white"/>';
  S +=
    '<ellipse cx="260" cy="218" rx="195" ry="180" fill="' +
    sBg +
    '" stroke="' +
    sCol +
    '" stroke-width="2" stroke-dasharray="6,3"/>';
  S +=
    '<ellipse cx="385" cy="92" rx="56" ry="31" fill="#f4d6da" stroke="#c9a84c" stroke-width="1.5"/>';
  S +=
    '<text x="385" y="89" text-anchor="middle" font-size="11" font-family="Arial" fill="#0a5c5c" font-weight="bold">PLACENTA</text>';
  S +=
    '<text x="385" y="103" text-anchor="middle" font-size="9" font-family="Arial" fill="#6b7280">' +
    d.placenta_loc +
    "</text>";
  S +=
    '<path d="M 268 252 Q 312 205 368 122" fill="none" stroke="#4ab5b5" stroke-width="2" stroke-dasharray="4,3" opacity=".7"/>';
  S +=
    '<ellipse cx="242" cy="251" rx="53" ry="70" fill="#fef3f2" stroke="#e8b4b8" stroke-width="2"/>';
  S +=
    '<path d="M 241 184 Q 228 214 228 252 Q 229 283 235 308" fill="none" stroke="#0a5c5c" stroke-width="2.5" stroke-linecap="round"/>';
  for (let i = 0; i < 5; i++) {
    const ry = 208 + i * 14;
    S +=
      '<path d="M 229 ' +
      ry +
      " Q 248 " +
      (ry - 7) +
      " 267 " +
      ry +
      '" fill="none" stroke="#c9a84c" stroke-width="1" opacity=".4"/>';
  }
  S +=
    '<ellipse cx="254" cy="224" rx="12" ry="11" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>';
  S +=
    '<text x="254" y="229" text-anchor="middle" font-size="12" font-family="Arial" fill="#dc2626">&#9829;</text>';
  S +=
    '<text x="350" y="192" font-size="9" font-family="Arial" fill="#dc2626" font-weight="bold">FCF:' +
    (d.fcf || "—") +
    "bpm</text>";
  S +=
    '<ellipse cx="244" cy="176" rx="47" ry="41" fill="none" stroke="' +
    cBIP +
    '" stroke-width="1.5" stroke-dasharray="4,3" opacity=".6"/>';
  S +=
    '<ellipse cx="244" cy="176" rx="43" ry="38" fill="#fef9f5" stroke="#e8b4b8" stroke-width="2"/>';
  S +=
    '<ellipse cx="242" cy="259" rx="60" ry="46" fill="none" stroke="' +
    cCA +
    '" stroke-width="1.5" stroke-dasharray="5,4" opacity=".65"/>';
  S +=
    '<text x="260" y="17" text-anchor="middle" font-size="11" font-family="Arial" font-weight="bold" fill="#0a5c5c">Morphologie T2 — ' +
    d.ag_sa +
    "</text>";

  function callout(
    lx: number,
    ly: number,
    bx: number,
    by: number,
    bw: number,
    col: string,
    title: string,
    badge: string,
  ) {
    S +=
      '<line x1="' +
      lx +
      '" y1="' +
      ly +
      '" x2="' +
      (bx + bw / 2) +
      '" y2="' +
      (by + 17) +
      '" stroke="' +
      col +
      '" stroke-width="1.2" stroke-dasharray="3,2"/>';
    S += '<circle cx="' + lx + '" cy="' + ly + '" r="3.5" fill="' + col + '"/>';
    S +=
      '<rect x="' +
      bx +
      '" y="' +
      by +
      '" width="' +
      bw +
      '" height="36" rx="7" fill="white" stroke="' +
      col +
      '" stroke-width="1.8"/>';
    S +=
      '<text x="' +
      (bx + bw / 2) +
      '" y="' +
      (by + 14) +
      '" text-anchor="middle" font-size="10" font-family="Arial" font-weight="bold" fill="' +
      col +
      '">' +
      title +
      "</text>";
    S +=
      '<text x="' +
      (bx + bw / 2) +
      '" y="' +
      (by + 27) +
      '" text-anchor="middle" font-size="8.5" font-family="Arial" fill="#374151">' +
      badge +
      "</text>";
  }

  callout(200, 176, 2, 140, 128, cBIP, "BIP", badgeT(d.bip, "bip", agNum, "mm"));
  callout(244, 138, 178, 40, 130, cPC, "PC / HC", badgeT(d.pc, "pc", agNum, "mm"));
  callout(302, 259, 382, 238, 134, cCA, "CA / AC", badgeT(d.ca, "ca", agNum, "mm"));
  callout(271, 330, 382, 315, 134, cLF, "LF / FL", badgeT(d.lf, "lf", agNum, "mm"));
  callout(190, 280, 2, 298, 128, cPFE, "PFE / EFW", badgeT(d.pfe, "pfe", agNum, "g"));

  const colN = num(d.col);
  if (colN != null) {
    S +=
      '<rect x="178" y="383" width="164" height="30" rx="6" fill="white" stroke="#9ca3af" stroke-width="1"/>';
    S +=
      '<text x="260" y="395" text-anchor="middle" font-size="9" font-family="Arial" fill="#6b7280" font-weight="bold">Col : ' +
      d.col +
      " mm</text>";
    S +=
      '<text x="260" y="408" text-anchor="middle" font-size="8" font-family="Arial" fill="' +
      (colN < 25 ? "#dc2626" : "#16a34a") +
      '">' +
      (colN < 25 ? "Col court (< 25 mm)" : "Cervicométrie normale") +
      "</text>";
  }

  S += "</svg>";
  return S;
}
