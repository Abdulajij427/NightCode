import { google } from "@ai-sdk/google";
import { generateText } from "ai";

for (const id of ["gemini-3.5-flash-lite", "gemini-3.8-flash"]) {
    const started = Date.now();
    try {
        const result = await generateText({
            model: google(id),
            prompt: "Say hello in one sentence.",
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(60_000),
        });
        console.log(id, `${Date.now() - started}ms`, result.text);
        console.log("usage:", result.usage);
    } catch (error) {
        console.log(id, `${Date.now() - started}ms FAILED:`, error instanceof Error ? error.message : error);
    }
}