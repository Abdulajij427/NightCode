import type { SessionData, SessionSummary, CreateSessionInput } from "../../../server/src";
import type { Mode } from "@nightcode/database";
import type { SupportedChatModelId } from "@nightcode/shared";

const BASE_URL = "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(err.message ?? err.error ?? `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
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
        submit: (
            sessionId: string,
            body: { content: string; mode: Mode; model: SupportedChatModelId },
            signal?: AbortSignal,
        ) =>
            fetch(`${BASE_URL}/chat/${sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal,
            }),
        resume: (sessionId: string, signal?: AbortSignal) =>
            fetch(`${BASE_URL}/chat/${sessionId}/resume`, {
                method: "POST",
                signal,
            }),
    },
};