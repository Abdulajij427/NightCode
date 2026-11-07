import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { findSupportedChatModel } from "../../../shared/src";
import {prisma , Role , Mode , MessageStatus} from '../../../database/src'





export const createSessionSchema = z.object({
    title: z.string(),
    cwd: z.string().optional(),
    initialMessage: z
        .object({
            role: z.enum(Role),
            content: z.string(),
            mode: z.enum(Mode),
            model: z
                .string()
                .refine((id) => !!findSupportedChatModel(id), "Unsupported model"),
        })
        .optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;



const createSessionValidator = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const result = createSessionSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    req.body = result.data;
    next();
};

const router = Router();

router.get("/", async (_req, res: Response) => {
    const sessions = await prisma.session.findMany({
        orderBy: {createdAt: "desc"},
        select: {
            id: true,
            title: true,
            createdAt: true
        }
    });
    return res.json(sessions)
    
});

router.get("/:id", async (req, res: Response) => {
    // Mock: uncomment to simulate slow session loading
    // await new Promise((r) => setTimeout(r, 5000));

    // Mock: uncomment to simulate session loading error
    // return res.status(500).json({ message: "mock error: session loading failed" });

    const { id } = req.params;
    const session = await prisma.session.findUnique({
        where: {id},
        include: {
            messages: {orderBy: {createdAt: "asc"}},
        },
    });

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    return res.json(session);
});

router.post(
    "/",
    createSessionValidator,
    async (
        req: Request<{}, CreateSessionInput>,
        res: Response,
    ) => {

        //await new Promise((r) => setTimeout(r, 5000));

        //return res.status(500).json({ message: "Mock error: session loading failed" });

        const { initialMessage, ...data } = req.body;
        
        const session = await prisma.session.create({
            data: {
                ...data,
                userId: "mock-user",
                ...(initialMessage && {
                    messages: {
                        create : {
                            ...initialMessage,
                            status: MessageStatus.COMPLETE
                        }
                    }
                })
            },
            include: {messages: true}
        });
        return res.status(201).json(session)
        
        
    },
);

export default router;