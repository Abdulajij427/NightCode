import express from "express";
import authRouter from "./routes/auth";
import cliAuthRouter from "./routes/cli-auth";
import type { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/bun";
import sessionsRouter from "./routes/sessions";
import chatRouter from "./routes/chat"
import oauthRouter from "./routes/oauth";
import billingRouter from './routes/billing';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/sessions", sessionsRouter);
app.use("/chat" , chatRouter);
app.use("/auth", authRouter);
app.use("/auth/cli", cliAuthRouter);
app.use("/auth/oauth", oauthRouter);
app.use("/billing", billingRouter);
app.use("/billing" , billingRouter);


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
    "POST /billing/checkout": { response: { url: string } };
    "POST /billing/portal": { response: { url: string } };
};