import type { Request, Response } from "express";

type SSEMessage = { data: string; event?: string; id?: string };

export function createSSEStream(_req: Request, res: Response) {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let aborted = false;
    res.on("close", () => {
        aborted = true;
    });

    return {
        get aborted() {
            return aborted;
        },
        send({ data, event, id }: SSEMessage) {
            if (aborted) return;
            if (id) res.write(`id: ${id}\n`);
            if (event) res.write(`event: ${event}\n`);
            for (const line of data.split("\n")) {
                res.write(`data: ${line}\n`);
            }
            res.write("\n");
        },
        close() {
            if (!aborted) res.end();
        },
    };
}

export type SSEStream = ReturnType<typeof createSSEStream>;