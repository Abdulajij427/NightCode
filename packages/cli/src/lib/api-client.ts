import type {
  SessionData,
  SessionSummary,
  CreateSessionInput,
} from "../../../server/src";
import type { Mode } from "@nightcode/database";
import type { SupportedChatModelId } from "@nightcode/shared";
import { getStoredAccessToken } from "./auth-storage";

export const BASE_URL = "http://localhost:3000";

async function createHeaders(
  headers?: RequestInit["headers"],
): Promise<Headers> {
  const result = new Headers(headers);

  result.set("Content-Type", "application/json");

  const accessToken = await getStoredAccessToken();

  if (accessToken) {
    result.set("Authorization", `Bearer ${accessToken}`);
  }

  return result;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: await createHeaders(init?.headers),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };

    throw new Error(
      error.message ?? error.error ?? `Request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  sessions: {
    list: () => request<SessionSummary[]>("/sessions"),
    get: (id: string) => request<SessionData>(`/sessions/${id}`),
    create: (body: CreateSessionInput) =>
      request<SessionData>("/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  chat: {
        submit: async (
        sessionId: string,
        body: {
            content: string;
            mode: Mode;
            model: SupportedChatModelId;
        },
        signal?: AbortSignal,
        ) =>
        fetch(`${BASE_URL}/chat/${sessionId}`, {
            method: "POST",
            headers: await createHeaders(),
            body: JSON.stringify(body),
            signal,
        }),

        resume: async (sessionId: string, signal?: AbortSignal) =>
        fetch(`${BASE_URL}/chat/${sessionId}/resume`, {
            method: "POST",
            headers: await createHeaders(),
            signal,
        }),
    },

    billing : {
        checkout: () =>
        request<{ url: string }>("/billing/checkout", { method: "POST" }),
        portal: () =>
        request<{ url: string }>("/billing/portal", { method: "POST" }),
  
    },
};


































// import type { SessionData, SessionSummary, CreateSessionInput } from "../../../server/src";
// import type { Mode } from "@nightcode/database";
// import type { SupportedChatModelId } from "@nightcode/shared";

// export const BASE_URL = "http://localhost:3000";

// async function request<T>(path: string, init?: RequestInit): Promise<T> {
//     const res = await fetch(`${BASE_URL}${path}`, {
//         headers: { "Content-Type": "application/json" },
//         ...init,
//     });

//     if (!res.ok) {
//         const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
//         throw new Error(err.message ?? err.error ?? `Request failed: ${res.status}`);
//     }

//     return res.json() as Promise<T>;
// }

// export const apiClient = {
//     sessions: {
//         list: () => request<SessionSummary[]>("/sessions"),
//         get: (id: string) => request<SessionData>(`/sessions/${id}`),
//         create: (body: CreateSessionInput) =>
//             request<SessionData>("/sessions", {
//                 method: "POST",
//                 body: JSON.stringify(body),
//             }),
//     },
//     chat: {
//         submit: (
//             sessionId: string,
//             body: { content: string; mode: Mode; model: SupportedChatModelId },
//             signal?: AbortSignal,
//         ) =>
//             fetch(`${BASE_URL}/chat/${sessionId}`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(body),
//                 signal,
//             }),
//         resume: (sessionId: string, signal?: AbortSignal) =>
//             fetch(`${BASE_URL}/chat/${sessionId}/resume`, {
//                 method: "POST",
//                 signal,
//             }),
//     },
// };