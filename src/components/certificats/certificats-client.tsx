"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import {
  certTypeLabel,
  useModulesStore,
  useModulesWorkspace,
} from "@/stores/modules-store";
import type { CertificateDraft, CertificateType } from "@/types/modules";
import {
  createHiddenPrintRoot,
  exportElementToPdf,
} from "@/lib/pdf/html2pdf-export";

const TYPES: CertificateType[] = [
  "arret_travail",
  "aptitude_sport",
  "certificat_medical",
  "accouchement_prevu",
];

export function CertificatsClient() {
  const ws = useModulesWorkspace();
  const saveCertificate = useModulesStore((s) => s.saveCertificate);
  const deleteCertificate = useModulesStore((s) => s.deleteCertificate);

  const [type, setType] = useState<CertificateType>("certificat_medical");
  const [patientName, setPatientName] = useState("");
  const [body, setBody] = useState(
    "Je soussigné(e), certifie avoir examiné la patiente susnommée…",
  );

  async function exportPdf(cert: CertificateDraft) {
    const root = createHiddenPrintRoot("hawae-cert-pdf");
    const header = document.createElement("header");
    header.style.cssText = "padding:24px;background:#0a5c5c;color:#fff";
    const h1 = document.createElement("h1");
    h1.textContent = certTypeLabel(cert.type);
    h1.style.cssText = "margin:0;font-size:18px";
    header.appendChild(h1);
    const sub = document.createElement("p");
    sub.textContent = cert.patientName;
    sub.style.cssText = "margin:8px 0 0;font-size:12px";
    header.appendChild(sub);
    root.appendChild(header);
    const main = document.createElement("div");
    main.style.cssText = "padding:24px;font-family:Georgia,serif;font-size:13px;line-height:1.6";
    const p = document.createElement("p");
    p.textContent = cert.body;
    main.appendChild(p);
    root.appendChild(main);
    await exportElementToPdf(root, {
      filename: "certificat-" + cert.patientName.replace(/\s+/g, "-") + ".pdf",
    });
    root.remove();
  }

  function save() {
    if (!patientName.trim()) return;
    const cert: CertificateDraft = {
      id: "cert_" + nanoid(8),
      type,
      patientName: patientName.trim(),
      body,
      createdAt: new Date().toISOString(),
    };
    saveCertificate(cert);
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--border)] pb-6">
        <h1 className="font-display text-2xl font-bold">Certificats médicaux</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Modèles et export PDF.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border bg-white p-6 lg:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Type</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as CertificateType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {certTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Patiente</span>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
        </label>
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block font-semibold">Texte</span>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
        >
          Enregistrer
        </button>
      </div>

      <ul className="space-y-2">
        {ws.certificates.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-sm"
          >
            <span>
              <strong>{certTypeLabel(c.type)}</strong> — {c.patientName}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--teal)] px-3 py-1 text-xs font-semibold text-white"
                onClick={() => void exportPdf(c)}
              >
                PDF
              </button>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => deleteCertificate(c.id)}
              >
                Supprimer
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
