import type {MockSession , SessionSummary , CreateSessionInput , AppType} from '../../../server/src';

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
        get: (id: string) => request<MockSession>(`/sessions/${id}`),
        create: (body: CreateSessionInput) =>
            request<MockSession>("/sessions", {
                method: "POST",
                body: JSON.stringify(body),
            }),
    },
};