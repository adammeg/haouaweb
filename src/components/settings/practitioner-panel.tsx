"use client";

import { useRef, type ReactNode } from "react";
import {
  usePractitionerStore,
  practitionerDisplayName,
} from "@/stores/practitioner-store";
import type { PractitionerTitle } from "@/types/practitioner";

const TITRES: PractitionerTitle[] = ["Dr", "Pr", "Médecin Spécialiste"];

const SPECIALITES = [
  "Gynécologue-Obstétricien",
  "Médecin PMA",
  "Gynécologue",
  "Obstétricien",
];

export function PractitionerPanel() {
  const profile = usePractitionerStore((s) => s.profile);
  const patchProfile = usePractitionerStore((s) => s.patchProfile);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  function onImage(
    file: File,
    key: "logoBase64" | "signatureBase64",
  ) {
    const reader = new FileReader();
    reader.onload = () => {
      patchProfile({ [key]: String(reader.result) });
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-xs)] lg:col-span-2">
      <h2 className="font-display text-base font-bold text-[var(--ink)]">
        Profil praticien — entête documents
      </h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Ces informations pré-remplissent ordonnances, certificats, CR et lettres.
        Stockage local sécurisé par compte médecin.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Titre">
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.titre}
            onChange={(e) =>
              patchProfile({ titre: e.target.value as PractitionerTitle })
            }
          >
            {TITRES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prénom">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.prenom}
            onChange={(e) => patchProfile({ prenom: e.target.value })}
          />
        </Field>
        <Field label="Nom">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.nom}
            onChange={(e) => patchProfile({ nom: e.target.value })}
          />
        </Field>
        <Field label="Spécialité">
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.specialite}
            onChange={(e) => patchProfile({ specialite: e.target.value })}
          >
            {SPECIALITES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="N° Ordre des Médecins">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.matriculeOrdre}
            onChange={(e) => patchProfile({ matriculeOrdre: e.target.value })}
          />
        </Field>
        <Field label="Téléphone">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.telephone}
            onChange={(e) => patchProfile({ telephone: e.target.value })}
          />
        </Field>
        <Field label="Établissement / Cabinet" className="sm:col-span-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.etablissement}
            onChange={(e) => patchProfile({ etablissement: e.target.value })}
          />
        </Field>
        <Field label="Service">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.service}
            onChange={(e) => patchProfile({ service: e.target.value })}
          />
        </Field>
        <Field label="Adresse" className="lg:col-span-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.adresse}
            onChange={(e) => patchProfile({ adresse: e.target.value })}
          />
        </Field>
        <Field label="Ville">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.ville}
            onChange={(e) => patchProfile({ ville: e.target.value })}
          />
        </Field>
        <Field label="Code postal">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.codePostal}
            onChange={(e) => patchProfile({ codePostal: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.email}
            onChange={(e) => patchProfile({ email: e.target.value })}
          />
        </Field>
        <Field label="N° CNAM établissement">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={profile.cnam}
            onChange={(e) => patchProfile({ cnam: e.target.value })}
          />
        </Field>
        <Field label="Tampon (texte)" className="lg:col-span-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Dr X — Gynéco-Obst — Cachet"
            value={profile.tamponTexte}
            onChange={(e) => patchProfile({ tamponTexte: e.target.value })}
          />
        </Field>
        <Field label="Logo établissement">
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-xs font-semibold"
            onClick={() => logoRef.current?.click()}
          >
            {profile.logoBase64 ? "Changer logo" : "Uploader logo"}
          </button>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImage(f, "logoBase64");
            }}
          />
        </Field>
        <Field label="Signature (image)">
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-xs font-semibold"
            onClick={() => sigRef.current?.click()}
          >
            {profile.signatureBase64 ? "Changer signature" : "Uploader signature"}
          </button>
          <input
            ref={sigRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImage(f, "signatureBase64");
            }}
          />
        </Field>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--teal)]/30 bg-[var(--teal-pale)] p-4 text-sm">
        <strong>Aperçu entête :</strong> {practitionerDisplayName(profile)} —{" "}
        {profile.specialite}
        {profile.etablissement ? ` · ${profile.etablissement}` : ""}
        {profile.ville ? ` · ${profile.ville}` : ""}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={"block text-sm " + className}>
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
