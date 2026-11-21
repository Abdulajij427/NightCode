import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import {Mode } from "@nightcode/database/enums";
import { useNavigate, useLocation } from 'react-router';
import { UserMessage } from '../components/messages/';
import { SessionShell } from '../components/session-shell';
import { useToast } from '../providers/toast';
import { apiClient } from '../lib/api-client';

const newSessionStateSchema = z.object({
    message: z.string(),
    mode: z.enum(Mode),
    model: z.enum([
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'openai/gpt-oss-20b',
        'llama3.2',
    ]),
});

export function NewSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const hasStartedRef = useRef(false);

    const state = useMemo(() => {
        const parsed = newSessionStateSchema.safeParse(location.state);
        return parsed.success ? parsed.data : null;
    }, [location.state]);

    // Guard: state ke bina direct aaye to home bhejo
    useEffect(() => {
        if (!state?.message) {
            navigate("/", { replace: true });
        }
    }, [state, navigate]);

    // Mount pe session create karo
    useEffect(() => {
        if (!state || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const createSession = async () => {
            try {
                const session = await apiClient.sessions.create({
                    title: state.message.slice(0, 100),
                    cwd: process.cwd(),
                    initialMessage: {
                        role: "USER",
                        content: state.message,
                        mode: state.mode,
                        model:state.model,
                    },
                });

                navigate(`/sessions/${session.id}`, {
                    replace: true,
                    state: { session },
                });
            } catch (error) {
                toast.show({
                    variant: "error",
                    message: error instanceof Error ? error.message : "Failed to create session",
                });
                navigate("/", { replace: true });
            }
        };

        createSession();
    }, [state, navigate, toast]);

    if (!state?.message) return null;

    return (
        <SessionShell onSubmit={() => {}} >
            <UserMessage message={state.message} mode={state.mode} />
        </SessionShell>
    );
}