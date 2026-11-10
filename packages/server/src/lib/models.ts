import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { findSupportedChatModel } from "../../../shared/src";
import type {
    SupportedChatModel,
    SupportedChatModelId,
    SupportedProvider,
} from "../../../shared/src";
import type { LanguageModel } from "ai";

type GoogleModelId = Extract<
    SupportedChatModel,
    { provider: "google" }
>["id"];

type GroqModelId = Extract<
    SupportedChatModel,
    { provider: "groq" }
>["id"];

type OllamaModelId = Extract<
    SupportedChatModel,
    { provider: "ollama" }
>["id"];

// Groq OpenAI-compatible API use karta hai.
const groq = createOpenAI({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
});

// Ollama apke laptop par default port 11434 pe chalta hai.
const ollama = createOpenAI({
    name: "ollama",
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
    apiKey: "ollama",
});

export type ResolvedModel = {
    model: LanguageModel;
    provider: SupportedProvider;
    modelId: SupportedChatModelId;
};

function assertUnsupportedProvider(provider: never): never {
    throw new Error(`Unsupported provider: ${provider}`);
}

function resolveGoogleModel(modelId: GoogleModelId): ResolvedModel {
    return {
        model: google(modelId),
        provider: "google",
        modelId,
    };
}

function resolveGroqModel(modelId: GroqModelId): ResolvedModel {
    return {
        model: groq.chat(modelId),
        provider: "groq",
        modelId,
    };
}

function resolveOllamaModel(modelId: OllamaModelId): ResolvedModel {
    return {
        model: ollama.chat(modelId),
        provider: "ollama",
        modelId,
    };
}

function resolveSupportedChatModel(
    model: SupportedChatModel,
): ResolvedModel {
    switch (model.provider) {
        case "google":
            return resolveGoogleModel(model.id);
        case "groq":
            return resolveGroqModel(model.id);
        case "ollama":
            return resolveOllamaModel(model.id);
        default:
            return assertUnsupportedProvider(model as never);
    }
}

export function isSupportedChatModel(
    modelId: string,
): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId);

    if (!model) {
        throw new Error(`Unsupported model: ${modelId}`);
    }

    return resolveSupportedChatModel(model);
}