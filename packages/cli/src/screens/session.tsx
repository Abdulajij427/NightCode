import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import {useKeyboard} from '@opentui/react';
import prettyMs from "pretty-ms";

import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "../../../shared/src";
import type { SessionData } from "../../../server/src";

import { SessionShell } from "../components/session-shell";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages";
import { useChat, type Message } from "../hooks/use-chat";
import { apiClient } from "../lib/api-client";
import {MessageStatus} from '@nightcode/database/enums';
import {useKeyboardLayer} from '../providers/keyboard-layer';

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>(
        (value) => value != null && typeof value === "object" && "id" in value,
    ),
});

function mapDbMessages(dbMessages: SessionData["messages"]): Message[] {
    return dbMessages.map((message): Message => {
        if (message.role === "ERROR") {
            return {
                id: message.id,
                role: "error",
                content: message.content,
            };
        }

        if (message.role === "USER") {
            return {
                id: message.id,
                role: "user",
                content: message.content,
                mode: message.mode,
                model: message.model as SupportedChatModelId,
            };
        }

        return {
            id: message.id,
            role: "assistant",
            content: message.content,
            model: message.model as SupportedChatModelId,
            mode: message.mode,
            parts: [{ type: "text", text: message.content }],
            ...(message.duration != null
                ? { duration: prettyMs(message.duration * 1000) }
                : {}),
            interrupted: message.status === MessageStatus.INTERRUPTED,    
        };
    });
}

function ChatMessage({ msg }: { msg: Message }) {
    if (msg.role === "user") {
        return <UserMessage message={msg.content} />;
    }

    if (msg.role === "error") {
        return <ErrorMessage message={msg.content} />;
    }

    return (
        <BotMessage
            parts={msg.parts}
            model={msg.model}
            mode={msg.mode}
            duration={msg.duration}
            streaming={false}
            interrupted={msg.interrupted}
        />
    );
}

function SessionChat({ session }: { session: SessionData }) {
    const [initialMessages] = useState(() => mapDbMessages(session.messages));
    const {isTopLayer} = useKeyboardLayer();
    const { messages, streaming, submit, abort , interrupt} = useChat(
        session.id,
        initialMessages,
    );

    // Session leave karte waqt active AI response stop kar do.
    useEffect(() => {
        return () => abort();
    }, [abort]);


    //let the user cancel a reply even before the first streamed chunk arrives.
    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && streaming.status === "streaming"){
            key.preventDefault();
            interrupt();
        }
    });

    return (
        <SessionShell
            onSubmit={(text) =>
                submit({
                    userText: text,
                    mode: "BUILD",
                    model: DEFAULT_CHAT_MODEL_ID,
                })
            }
            loading={streaming.status === "streaming"}
            interruptible = {streaming.status === "streaming"}
        >
            {messages.map((message) => (
                <ChatMessage key={message.id} msg={message} />
            ))}

            {streaming.status === "streaming" &&
                streaming.parts.length > 0 && (
                    <BotMessage
                        parts={streaming.parts}
                        model={streaming.model}
                        mode={streaming.mode}
                        streaming
                    />
                )}
        </SessionShell>
    );
}

export function Session() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const prefetchedSession = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data.session : null;
    }, [location.state]);

    const [session, setSession] = useState<SessionData | null>(
        prefetchedSession,
    );

    useEffect(() => {
        if (prefetchedSession) {
            return;
        }

        let cancelled = false;

        async function fetchSession() {
            const sessionId = id;
            if (!sessionId) {
                return;
            }

            try {
                const resolvedSession = await apiClient.sessions.get(sessionId);

                if (!cancelled) {
                    setSession(resolvedSession);
                }
            } catch {
                if (!cancelled) {
                    navigate("/", { replace: true });
                }
            }
        }

        void fetchSession();

        return () => {
            cancelled = true;
        };
    }, [id, navigate, prefetchedSession]);

    if (!session) {
        return <SessionShell onSubmit={() => {}} />;
    }

    return <SessionChat key={session.id} session={session} />;
}