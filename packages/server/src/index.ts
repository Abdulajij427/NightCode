import express from "express";
import type { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/bun";
import sessionsRouter from "./routes/sessions";
import chatRouter from "./routes/chat"

const app = express();
app.use(express.json());

app.use("/sessions", sessionsRouter);
app.use("/chat" , chatRouter)


app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});






// Hono ke AppType ka Express version: client ke liye types
export type { CreateSessionInput } from "./routes/sessions";
export type { SessionData, MessageData, SessionSummary } from "./types";

import type { CreateSessionInput } from "./routes/sessions";
import type { SessionData, SessionSummary } from "./types";

export type AppType = {
    "GET /sessions": { response: SessionSummary[] };
    "GET /sessions/:id": { response: SessionData };
    "POST /sessions": {
        body: CreateSessionInput;
        response: SessionData;
    };
};