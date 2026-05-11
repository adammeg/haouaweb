import type { StateStorage } from "zustand/middleware";

/** Must match persist `name` in hawae-store (used for legacy migration). */
export const HAWAE_PERSIST_NAME = "hawae-md-v1";

function doctorIdFromWindow(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__HAWAE_DOCTOR_ID__;
}

function scopedStorageKey(persistName: string): string {
  const doc = doctorIdFromWindow();
  if (!doc) return `guest:${persistName}`;
  return `hawae:doc:${doc}:${persistName}`;
}

/**
 * Isolates Zustand persist per logged-in doctor so two accounts on the same
 * browser never share patient data. Migrates legacy unscoped `hawae-md-v1` once.
 */
export function createDoctorScopedStorage(): StateStorage {
  return {
    getItem: (name) => {
      try {
        if (typeof window === "undefined") return null;
        const scoped = scopedStorageKey(name);
        const direct = window.localStorage.getItem(scoped);
        if (direct != null) return direct;

        const doc = doctorIdFromWindow();
        if (!doc) return null;

        const legacy = window.localStorage.getItem(name);
        if (legacy != null) {
          window.localStorage.setItem(scoped, legacy);
          window.localStorage.removeItem(name);
          return legacy;
        }
        return null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(scopedStorageKey(name), value);
      } catch {
        /* quota / private mode */
      }
    },
    removeItem: (name) => {
      try {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(scopedStorageKey(name));
      } catch {
        /* */
      }
    },
  };
}
