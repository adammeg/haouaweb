"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HawaeMD app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--cream)] p-8">
      <h1 className="font-display text-xl font-bold text-[var(--ink)]">
        Impossible d&apos;afficher cette page
      </h1>
      <p className="max-w-md text-center text-sm text-[var(--muted)]">
        {error.message || "Erreur inattendue. Vos données locales ne sont pas modifiées."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
