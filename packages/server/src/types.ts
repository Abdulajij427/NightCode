import type { Role, Mode, MessageStatus } from "../../database/src";

export type MessageData = {
    id: string;
    role: Role;
    content: string;
    mode: Mode;
    model: string;
    parts: unknown | null;
    duration: number | null;
    status: MessageStatus;
    createdAt: string;
    sessionId: string;
};

export type SessionData = {
    id: string;
    title: string;
    cwd: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    messages: MessageData[];
};

export type SessionSummary = Pick<SessionData, "id" | "title" | "createdAt">;