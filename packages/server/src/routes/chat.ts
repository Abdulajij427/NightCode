import express ,{Router} from 'express';
import type {Request , Response , NextFunction} from 'express';
import { createSessionValidator } from "./sessions";
import { createSSEStream } from "../lib/sse";
import {z} from 'zod';
import {prisma} from '../../../database/src';
import { streamText as aiStreamText} from 'ai';
import {Role ,Mode , MessageStatus} from '../../../database/src';
import {type ChatStreamEvent} from '../../../shared/src';
import {isSupportedChatModel , resolveChatModel} from '../lib/models';
import type { SSEStream } from "../lib/sse";



const submitSchema = z.object({
    content: z.string(),
    mode: z.enum(Mode),
    model: z.string().refine(isSupportedChatModel , "Unsupported model"),
});



const submitValidator = (req: Request, res: Response, next: NextFunction) => {
    const result = submitSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    req.body = result.data;
    next();
};


// it is used to stop coversation  in  middle 
const activeResumeSessionIds = new Set<string>();


// strip error messages and empty assistant messsages from the conversation
function buildConversationHistory(
    messages: {role: string; content: string; status: string}[],
){
    return messages.flatMap((m) => {
        if (m.role !== "USER" && m.role !== "ASSISTANT") return [];
        if (m.role === "ASSISTANT" && m.content.length === 0) return [];

        return [
            {role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
                content: m.content
            },
        ];

    });
};


function getResumableUserMessage(
    messages: {
        role: "USER" | "ASSISTANT" | "ERROR"; 
        model: string;
        mode: Mode
    }[],
){
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "USER"){
        return null;
    }

    return lastMessage;
}


type    StreamParams = {
    sessionId: string;
    model: string;
    history: {role : "user" | "assistant"; content: string}[];
    mode: Mode;
    abortController: AbortController;
};


async function streamAIResponse(stream: SSEStream, params: StreamParams) {
    const { sessionId, model, history, mode, abortController } = params;
    const startTime = Date.now();

    const resolvedModel = resolveChatModel(model);
    let fullText = "";

    const persistInterruptedMessage = async () => {
        if (fullText.length === 0) return;

        const elapsedMs = Date.now() - startTime;

        await prisma.message.create({
            data: {
                sessionId,
                role: "ASSISTANT",
                status: MessageStatus.INTERRUPTED,
                model,
                content: fullText,
                mode,
                duration: Math.round(elapsedMs / 1000),
            },
        });
    };

    try {
        const result = aiStreamText({
            model : resolvedModel.model,
            messages: history,
            abortSignal: abortController.signal
        });

        for await (const part of result.fullStream){
            if (stream.aborted) break;

            if (part.type === "text-delta"){
                fullText += part.text;
                const event: ChatStreamEvent = {type : "text-delta" , text: part.text};
                stream.send({event: "text-delta" , data: JSON.stringify(event)})
            }

            if (part.type === "error"){
                throw part.error;
            }
        }

        if (stream.aborted || abortController.signal.aborted){
            await persistInterruptedMessage();
            return;
        }

        const elapsedMs = Date.now() - startTime;
        const assistantMessage = await prisma.message.create({
            data: {
                sessionId,
                role: "ASSISTANT",
                status: MessageStatus.COMPLETE,
                model,
                content: fullText,
                mode,
                duration: Math.round(elapsedMs / 1000),
            },
        });


        const doneEvent: ChatStreamEvent = {
            type : "done",
            messageId: assistantMessage.id,
            durationMs: elapsedMs
        };

        await stream.send({event: "done", data: JSON.stringify(doneEvent)});
    }catch(error) {
        if (abortController.signal.aborted){
            await persistInterruptedMessage();
            return;
        }


        const message = error instanceof Error ? error.message : String(error);

        await prisma.message.create({
            data: {
                sessionId,
                role: "ERROR",
                status: MessageStatus.COMPLETE,
                model,
                content: message,
                mode,
            },
        });

        const errorEvent: ChatStreamEvent = {type: "error", message};
        await stream.send({event: "error", data: JSON.stringify(errorEvent)});
    }
    // baaki logic: stream.send(...) se chunks bhejo
};






// routes
const router = Router();
type SubmitInput = z.infer<typeof submitSchema>;

router.post(
    "/:sessionId/resume",
    async (req: Request<{sessionId: string}> , res: Response) => {
        const {sessionId} = req.params;

        const session = await prisma.session.findUnique({
            where: {id: sessionId},
            include: {messages: {orderBy: {createdAt: "asc"}}},
        });

        if(!session){
            return res.status(404).json({message: "Session not found"});
        }

        const resumableMessage = getResumableUserMessage(session.messages);
        if(!resumableMessage){
                return res.status(409).json({message: "Session has no pending user message to resume"})
        }

        if(!isSupportedChatModel(resumableMessage.model)){
            return res.status(409).json({message: `Session uses unsupported model: ${resumableMessage.model}`})

        }

        const mode = z.enum(Mode).safeParse(resumableMessage.mode);
        if (!mode.success) {
            return res.status(409).json({message: `Session uses unsupported mode: ${resumableMessage.mode}`});
        }

        if(activeResumeSessionIds.has(sessionId)){
            return (
                res.status(409).json({message:"Session already has an active resume"})
            );
        }

        activeResumeSessionIds.add(sessionId);

        const history = buildConversationHistory(session.messages);
        const stream = createSSEStream(req, res);
        const abortController = new AbortController();

        // Hono ke stream.onAbort ki jagah
        res.on("close", () => {
            if (!res.writableEnded) abortController.abort();
        });

        try {
            await streamAIResponse(stream, {
                sessionId,
                model: resumableMessage.model,
                history,
                mode:resumableMessage.mode,
                abortController,
            });
        } catch (error) {
            const errorEvent: ChatStreamEvent = {
                type: "error",
                message: error instanceof Error ? error.message : String(error),
            };
            stream.send({ event: "error", data: JSON.stringify(errorEvent) });
            activeResumeSessionIds.delete(sessionId);
        } finally {
            stream.close();
            activeResumeSessionIds.delete(sessionId);
        }
    }
)

router.post(
    "/:sessionId",
    submitValidator,
    async (req: Request<{ sessionId: string }, unknown, SubmitInput>, res: Response) => {
        const { sessionId } = req.params;
        const data = req.body;

        // history ke liye sirf zaroori fields
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    select: { role: true, content: true, status: true },
                },
            },
        });

        // stream shuru hone se pehle hi 404, baad mein status badal nahi sakte
        if (!session) {
            res.status(404).json({ message: "Session not found" });
            return;
        }

        await prisma.message.create({
            data: {
                sessionId,
                role: Role.USER,
                status: MessageStatus.COMPLETE,
                model: data.model,
                content: data.content,
                mode: data.mode,
            },
        });

        const history = buildConversationHistory([
            ...session.messages,
            { role: Role.USER, content: data.content, status: MessageStatus.COMPLETE },
        ]);

        const stream = createSSEStream(req, res);
        const abortController = new AbortController();

        res.on("close", () => {
            if (!res.writableEnded) abortController.abort();
        });

        try {
            await streamAIResponse(stream, {
                sessionId,
                model: data.model,
                history,
                mode: data.mode,
                abortController,
            });
        } catch (error) {
            const errorEvent: ChatStreamEvent = {
                type: "error",
                message: error instanceof Error ? error.message : String(error),
            };
            stream.send({ event: "error", data: JSON.stringify(errorEvent) });
        } finally {
            stream.close();
        }
    },
);



export default router;