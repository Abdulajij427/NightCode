import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../../database/src";
import { Prisma } from "../../../database/generated/prisma/client";
import {
    consumeStream,
    convertToModelMessages,
    pipeUIMessageStreamToResponse,
    streamText,
    toUIMessageStream,
    validateUIMessages,
    type InferUITools,
    type LanguageModelUsage,
    type ToolSet,
    type UIMessage,
} from "ai";
import {
    getToolContracts,
    modeSchema,
    type ModeType,
    type ToolContracts,
} from "@nightcode/shared";
import { buildSystemPrompt } from "../system-prompt";
import { getAuthUser, requireAuth } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";
import { calculateCreditsForUsage } from "../lib/polar/credits";
import { ingestAiUsage } from "../lib/polar/polar";
import { isSupportedChatModel, resolveChatModel } from "../lib/models";

type ChatMessageMetadata = {
    mode?: ModeType;
    model?: string;
    durationMs?: number;
    usage?: LanguageModelUsage;
};

type NightcodeUIMessage = UIMessage<
    ChatMessageMetadata,
    never,
    InferUITools<ToolContracts & ToolSet>
>;

const submitSchema = z.object({
    id: z.string(),
    messages: z
        .array(
            z.custom<NightcodeUIMessage>((value) => {
                return (
                    value != null &&
                    typeof value === "object" &&
                    "id" in value &&
                    "parts" in value
                );
            }),
        )
        .min(1),
    mode: modeSchema,
    model: z.string().refine(isSupportedChatModel, "Unsupported model"),
});

type SubmitInput = z.infer<typeof submitSchema>;

const submitValidator = (req: Request, res: Response, next: NextFunction) => {
    const result = submitSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({ error: "Invalid request body" });
        return;
    }

    req.body = result.data;
    next();
};

function hasPendingToolCalls(message: NightcodeUIMessage) {
    return message.parts.some((part) => {
        if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
            const state = (part as { state?: string }).state;
            return state !== "output-available" && state !== "output-error";
        }
        return false;
    });
}

const router = Router();

router.post(
    "/",
    requireAuth,
    requireCreditsBalance,
    submitValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = getAuthUser(res).id;
        const { id, messages, mode, model } = req.body as SubmitInput;

        const session = await prisma.session.findUnique({
            where: { id, userId },
        });

        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const startTime = Date.now();
        const tools = getToolContracts(mode);
        const resolvedModel = resolveChatModel(model);
        const previousMessages = Array.isArray(session.messages)
            ? (session.messages as unknown as NightcodeUIMessage[])
            : [];

        const mergedMessages = [...previousMessages];

        for (const message of messages) {
            const incomingMessage = {
                ...message,
                metadata: { ...message.metadata, mode, model },
            } satisfies NightcodeUIMessage;

            const existingMessageIndex = mergedMessages.findIndex(
                (m) => m.id === incomingMessage.id,
            );

            if (existingMessageIndex === -1) {
                mergedMessages.push(incomingMessage);
            } else {
                mergedMessages[existingMessageIndex] = incomingMessage;
            }
        }

        const nextMessages = await validateUIMessages<NightcodeUIMessage>({
            messages: mergedMessages,
            tools: tools as unknown as ToolSet,
        });

        const modelMessages = await convertToModelMessages(nextMessages, {
            tools: tools as unknown as ToolSet,
        });
        let completedUsage: LanguageModelUsage | null = null;

        // Client disconnect hone par model ki request bhi cancel ho
        const abortController = new AbortController();
        res.on("close", () => {
            if (!res.writableEnded) abortController.abort();
        });

        const result = streamText({
            model: resolvedModel.model,
            system: buildSystemPrompt({ mode }),
            messages: modelMessages,
            tools: tools as unknown as ToolSet,
            providerOptions: resolvedModel.providerOptions,
            abortSignal: abortController.signal,
            onEnd(event) {
                completedUsage = event.usage;
            },
        });

        const uiStream = toUIMessageStream({
            stream: result.stream,
            originalMessages: nextMessages,
            messageMetadata({ part }) {
                if (part.type === "start") {
                    return { mode, model };
                }

                if (part.type !== "finish") return undefined;

                return {
                    mode,
                    model,
                    durationMs: Date.now() - startTime,
                    ...(completedUsage ? { usage: completedUsage } : {}),
                };
            },
            async onEnd(event) {
                if (event.isAborted) return;

                if (hasPendingToolCalls(event.responseMessage)) return;

                await prisma.session.update({
                    where: { id, userId },
                    data: {
                        messages: event.messages as unknown as Prisma.InputJsonValue,
                    },
                });

                if (!completedUsage) return;

                try {
                    const billableUsage = calculateCreditsForUsage({
                        provider: resolvedModel.provider,
                        model: resolvedModel.modelId,
                        usage: completedUsage,
                    });

                    await ingestAiUsage({
                        externalCustomerId: userId,
                        eventId: `chat-message: ${event.responseMessage.id}`,
                        credits: billableUsage.credits,
                    });
                } catch (error) {
                    console.error("Failed to ingest Polar AI usage for chat message", {
                        error,
                        sessionId: id,
                        messageId: event.responseMessage.id,
                        userId,
                    });
                }
            },
            onError(error) {
                return error instanceof Error ? error.message : String(error);
            },
        });

        try {
            await pipeUIMessageStreamToResponse({
                response: res,
                stream: uiStream,
                consumeSseStream: consumeStream,
            });
        } catch (error) {
            // Stream shuru ho chuki ho to status badal nahi sakte
            if (res.headersSent) {
                res.end();
                return;
            }
            next(error);
        }
    },
);

export default router;