import express from "express";
import type { Request, Response, NextFunction } from "express";
import sessionsRouter from "./routes/sessions";

const app = express();
app.use(express.json());

app.use("/sessions", sessionsRouter);

// Error handler: saare routes ke BAAD, 4 parameters zaroori hain
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Hono ke AppType ka Express version: client ke liye types
export type { MockSession, MockMessage, SessionSummary, CreateSessionInput } from "./routes/sessions";

export type AppType = {
    "GET /sessions": { response: import("./routes/sessions").SessionSummary[] };
    "GET /sessions/:id": { response: import("./routes/sessions").MockSession };
    "POST /sessions": {
        body: import("./routes/sessions").CreateSessionInput;
        response: import("./routes/sessions").MockSession;
    };
};