"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutControl({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Compte</p>
      <p className="truncate text-xs font-medium text-white/90">{name}</p>
      <p className="truncate text-[10px] text-white/55">{email}</p>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="mt-2 text-[11px] font-semibold text-[#E8D28A] hover:underline disabled:opacity-50"
      >
        {loading ? "Déconnexion…" : "Déconnexion"}
      </button>
    </div>
  );
}
