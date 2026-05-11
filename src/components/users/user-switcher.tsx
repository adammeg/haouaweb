"use client";

import { useState, type ReactNode } from "react";
import { useHawaeStore } from "@/stores/hawae-store";
import { ROLE_LABELS, type UserRole } from "@/types/domain";

export function UserSwitcher({
  triggerClassName,
  avatar,
  nameLine,
}: {
  triggerClassName?: string;
  avatar: ReactNode;
  nameLine: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("resident");

  const users = useHawaeStore((s) => s.users);
  const currentUserId = useHawaeStore((s) => s.currentUserId);
  const setCurrentUser = useHawaeStore((s) => s.setCurrentUser);
  const addUser = useHawaeStore((s) => s.addUser);
  const deleteUser = useHawaeStore((s) => s.deleteUser);
  const updateUser = useHawaeStore((s) => s.updateUser);
  const markSetupDone = useHawaeStore((s) => s.markSetupDone);

  function openModal() {
    setSel(currentUserId);
    setOpen(true);
  }

  function confirm() {
    if (sel) {
      setCurrentUser(sel);
      markSetupDone();
    }
    setOpen(false);
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openModal}>
        {avatar}
        {nameLine}
        <span className="ml-auto shrink-0 text-[var(--muted)]" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-switch-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="user-switch-title"
              className="font-display text-lg font-bold text-[var(--ink)]"
            >
              Utilisateurs du cabinet
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Les dossiers sont isolés par utilisateur (même logique que le template
              HTML).
            </p>

            <ul className="mt-4 space-y-2">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setSel(u.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      sel === u.id
                        ? "border-[var(--teal)] bg-[var(--teal-pale)]"
                        : "border-[var(--border)] hover:bg-[var(--cream)]"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: u.color }}
                    >
                      {u.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--ink)]">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {ROLE_LABELS[u.role]}
                      </div>
                    </div>
                    {u.id !== "user_default" && (
                      <button
                        type="button"
                        className="shrink-0 text-red-500 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUser(u.id);
                        }}
                      >
                        Suppr.
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {showAdd ? (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--cream)] p-3">
                <input
                  className="mb-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  placeholder="Nom complet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <select
                  className="mb-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--teal)] px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      if (newName.trim()) {
                        addUser(newName.trim(), newRole);
                        setNewName("");
                        setShowAdd(false);
                      }
                    }}
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
                    onClick={() => setShowAdd(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-[var(--teal)]"
                onClick={() => setShowAdd(true)}
              >
                + Ajouter un utilisateur
              </button>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
              <button
                type="button"
                className="rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white"
                onClick={confirm}
              >
                Activer
              </button>
            </div>

            <p className="mt-3 text-[10px] text-[var(--muted)]">
              Astuce : double-clic sur un nom dans la liste pour le renommer (rapide).
            </p>
            <button
              type="button"
              className="mt-1 text-[10px] text-[var(--teal)] underline"
              onClick={() => {
                const u = users.find((x) => x.id === sel);
                if (!u) return;
                const n = window.prompt("Nouveau nom", u.name);
                if (n?.trim()) updateUser(u.id, { name: n.trim() });
              }}
            >
              Renommer la sélection
            </button>
          </div>
        </div>
      )}
    </>
  );
}
