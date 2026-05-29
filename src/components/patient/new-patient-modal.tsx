"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHawaeStore } from "@/stores/hawae-store";
import { NEW_PATIENT_MOTIFS, specialtyFromMotif } from "@/lib/waiting-room/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewPatientModal({ open, onClose }: Props) {
  const router = useRouter();
  const createPatientFromForm = useHawaeStore((s) => s.createPatientFromForm);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [ddn, setDdn] = useState("");
  const [tel, setTel] = useState("");
  const [motif, setMotif] = useState<string>(NEW_PATIENT_MOTIFS[0]);

  useEffect(() => {
    if (!open) return;
    setNom("");
    setPrenom("");
    setDdn("");
    setTel("");
    setMotif(NEW_PATIENT_MOTIFS[0]);
  }, [open]);

  if (!open) return null;

  function submit() {
    const n = nom.trim();
    const pr = prenom.trim();
    if (!n || !pr) return;
    const spec = specialtyFromMotif(motif);
    createPatientFromForm({
      nom: n,
      prenom: pr,
      ddn: ddn || undefined,
      tel: tel.trim() || undefined,
      motif,
      specialite: spec,
    });
    onClose();
    router.push("/dossier");
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-patient-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--ink)]"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
        <h2
          id="new-patient-title"
          className="font-display text-lg font-bold text-[var(--ink)]"
        >
          Nouvelle patiente
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Créer un nouveau dossier — إنشاء ملف جديد
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Nom <span className="text-red-600">*</span>
            <input
              className="hawae-input mt-1 w-full"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de famille"
              autoFocus
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Prénom <span className="text-red-600">*</span>
            <input
              className="hawae-input mt-1 w-full"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Date de naissance
            <input
              type="date"
              className="hawae-input mt-1 w-full"
              value={ddn}
              onChange={(e) => setDdn(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            Téléphone
            <input
              type="tel"
              className="hawae-input mt-1 w-full"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              placeholder="+216…"
            />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)] sm:col-span-2">
            Motif de consultation
            <select
              className="hawae-input mt-1 w-full"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            >
              {NEW_PATIENT_MOTIFS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-[var(--teal)] py-3 text-sm font-semibold text-white"
          onClick={submit}
        >
          Créer le dossier →
        </button>
      </div>
    </div>
  );
}
