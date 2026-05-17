/**
 * Client HTTP typé pour HawaeMD (web + React Native / Flutter).
 *
 * Mobile : stocker `accessToken` renvoyé par POST /api/auth/login et passer
 * `getAccessToken: () => token` à createHawaeApiClient.
 */
import type { AssistRunResult } from "@/lib/assist/types";
import type { AssistProfile } from "@/lib/assist/types";
import type { IvfAnalysis, IvfPatientProfile } from "@/lib/pma/ivf-types";
import type { IvfProfile, ModulesWorkspace } from "@/types/modules";
import type {
  ConsultationEntry,
  PatientSnapshot,
  UserProfile,
} from "@/types/domain";

export type HawaeApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null | undefined;
};

export type LoginResponse = {
  ok: boolean;
  accessToken: string;
  expiresIn: number;
  doctor: { id: string; email: string; name: string };
};

export type MeResponse = {
  doctor: {
    id: string;
    email: string;
    name: string;
    clinicId: string | null;
    role: string;
  } | null;
};

export type WorkspacePayload = {
  users: UserProfile[];
  currentUserId: string | null;
  patientsByUser: Record<string, Record<string, PatientSnapshot>>;
  historyByUser: Record<string, Record<string, ConsultationEntry[]>>;
  setupDone: boolean;
  workspaceSavedAt: string | null;
};

export type IvfProfileBundle = {
  patientId: string;
  profile: IvfPatientProfile | null;
  analysis: IvfAnalysis | null;
  cycles: IvfProfile[];
  updatedAt: string | null;
  hasDossier: boolean;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(
      typeof data.error === "string" ? data.error : "request_failed",
    );
    throw err;
  }
  return data;
}

export function createHawaeApiClient(opts: HawaeApiClientOptions = {}) {
  const base = (opts.baseUrl ?? "").replace(/\/$/, "");

  function url(path: string): string {
    return base + path;
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    const token = opts.getAccessToken?.();
    if (token) headers.set("Authorization", "Bearer " + token);

    const res = await fetch(url(path), {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
    return parseJson<T>(res);
  }

  return {
    auth: {
      login: (email: string, password: string) =>
        request<LoginResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      me: () => request<MeResponse>("/api/auth/me"),
      logout: () =>
        request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    },

    workspace: {
      get: () =>
        request<
          | { empty: true }
          | { empty: false; updatedAt: string; workspace: WorkspacePayload }
        >("/api/workspace/state"),
      put: (workspace: WorkspacePayload) =>
        request<{ ok: boolean; updatedAt: string }>("/api/workspace/state", {
          method: "PUT",
          body: JSON.stringify(workspace),
        }),
    },

    modules: {
      get: () =>
        request<
          | { empty: true }
          | {
              empty: false;
              updatedAt: string;
              workspaceByUser: Record<string, ModulesWorkspace>;
            }
        >("/api/modules/state"),
      put: (workspaceByUser: Record<string, ModulesWorkspace>) =>
        request<{ ok: boolean; updatedAt: string }>("/api/modules/state", {
          method: "PUT",
          body: JSON.stringify({ workspaceByUser }),
        }),
    },

    assist: {
      run: (profile: AssistProfile) =>
        request<{ ok: boolean; result: AssistRunResult }>("/api/assist/run", {
          method: "POST",
          body: JSON.stringify({ profile }),
        }),
    },

    ivf: {
      getProfile: (patientId: string) =>
        request<IvfProfileBundle>(
          "/api/ivf/profile?patientId=" + encodeURIComponent(patientId),
        ),
      saveProfile: (patientId: string, profile: IvfPatientProfile) =>
        request<{ ok: boolean; updatedAt: string }>("/api/ivf/profile", {
          method: "PUT",
          body: JSON.stringify({ patientId, profile }),
        }),
      analyze: (patientId: string, profile: IvfPatientProfile) =>
        request<{ ok: boolean; analysis: IvfAnalysis; updatedAt: string }>(
          "/api/ivf/analyze",
          {
            method: "POST",
            body: JSON.stringify({ patientId, profile }),
          },
        ),
      selectProtocol: (patientId: string, protocolId: string) =>
        request<{ ok: boolean; analysis: IvfAnalysis; updatedAt: string }>(
          "/api/ivf/protocol",
          {
            method: "POST",
            body: JSON.stringify({ patientId, protocolId }),
          },
        ),
      reset: (patientId: string) =>
        request<{ ok: boolean }>(
          "/api/ivf/reset?patientId=" + encodeURIComponent(patientId),
          { method: "DELETE" },
        ),
      listCycles: () =>
        request<{ cycles: IvfProfile[] }>("/api/ivf/cycles"),
      saveCycle: (patientId: string, cycle: IvfProfile) =>
        request<{ ok: boolean; cycles: IvfProfile[]; updatedAt: string }>(
          "/api/ivf/cycles",
          {
            method: "POST",
            body: JSON.stringify({ patientId, cycle }),
          },
        ),
      deleteCycle: (patientId: string, cycleId: string) =>
        request<{ ok: boolean }>(
          "/api/ivf/cycles/" +
            encodeURIComponent(cycleId) +
            "?patientId=" +
            encodeURIComponent(patientId),
          { method: "DELETE" },
        ),
    },

    patients: {
      list: () =>
        request<{
          patients: Array<{
            id: string;
            displayName: string;
            specialite?: string;
            motif?: string;
            workspaceUserId: string;
          }>;
        }>("/api/patients"),
    },

    ia: {
      chat: (body: {
        question: string;
        dossierSummary?: string;
        mode?: "diagnostic" | "question";
        stream?: boolean;
      }) =>
        request<{ reply?: string }>("/api/ia", {
          method: "POST",
          body: JSON.stringify(body),
        }),
    },
  };
}

/** Instance web (cookies session). */
export const hawaeApi = createHawaeApiClient();
