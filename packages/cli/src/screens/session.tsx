import { useEffect, useMemo, useState , useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import {useKeyboard} from '@opentui/react';

import {type ModeType ,type SupportedChatModelId } from "../../../shared/src";
import type { SessionData } from "../../../server/src";

import { SessionShell } from "../components/session-shell";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages";
import { useChat, type Message  } from "../hooks/use-chat";
import {usePromptConfig} from '../providers/prompt-config';
import { apiClient } from "../lib/api-client";

import {useKeyboardLayer} from '../providers/keyboard-layer';

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>(
        (value) => value != null && typeof value === "object" && "id" in value
    ),
    initialPrompt:z
    .object({
        message: z.string(),
        mode: z.custom<ModeType>(),
        model: z.custom<SupportedChatModelId>(),
    })
    .optional(),
});



function ChatMessage({ msg }: { msg: Message }) {
    if (msg.role === "user") {

        const text = msg.parts
            .filter((p) => p.type === "text")
            .map((p)=> p.text)
            .join("");

        return <UserMessage message={text} mode={msg.metadata?.mode ?? "BUILD"}/>;
    }

    

    return (
        <BotMessage
            parts={msg.parts}
            model={msg.metadata?.model ?? "unknown"}
            mode={msg.metadata?.mode ?? "BUILD"}
            durationMs={msg.metadata?.durationMs}
            streaming={false}
            
        />
    );
}

function SessionChat({ 
    session ,
    initialPrompt,
}: { 
    session: SessionData ,
    initialPrompt?: {message: string; mode: ModeType; model: SupportedChatModelId};
}) {
    const [initialMessages] = useState(() => session.messages as unknown as Message[]);
    const {mode , model} = usePromptConfig();
    const {isTopLayer} = useKeyboardLayer();
    const { messages,status, submit, abort , interrupt , error} = useChat(
        session.id,
        initialMessages,
    );
    const hasSubmittedInitialPromptRef = useRef(false);

    // Session leave karte waqt active AI response stop kar do.
    useEffect(() => {
        return () => {
            void abort();
        };
    }, [abort]);


    //let the user cancel a reply even before the first streamed chunk arrives.
    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && status === "streaming"){
            key.preventDefault();
            interrupt();
        }
    });

    useEffect(() => {
        if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
        hasSubmittedInitialPromptRef.current = true;
        void submit({
            userText: initialPrompt.message,
            mode: initialPrompt.mode,
            model: initialPrompt.model,
        });
    },[initialPrompt , submit]);

    return (
        <SessionShell
            onSubmit={(text) =>
                submit({
                    userText: text,
                    mode,
                    model,
                })
            }
            loading={status === "submitted" || status === "streaming"}
            interruptible = {status === "submitted" || status === "streaming"}
        >
            {messages.map((message) => (
                <ChatMessage key={message.id} msg={message} />
            ))}

            {error && <ErrorMessage message={error.message}/>}
        </SessionShell>
    );
}

export function Session() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const prefetchedSession = useMemo(() => {
        const parsed = sessionLocationSchema.safeParse(location.state);
        return parsed.success ? parsed.data : null;
    }, [location.state]);

    const [session, setSession] = useState<SessionData | null>(
        prefetchedSession?.session ?? null
    );

    useEffect(() => {
        if (prefetchedSession?.session) {
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

    return (
        <SessionChat 
            key={session.id} 
            session={session} 
            initialPrompt={prefetchedSession?.initialPrompt} 
        />
    )
}


