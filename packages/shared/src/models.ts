export type ModelPricing = {
    inputUsdPerMillionTokens: number;
    outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "google" | "groq" | "ollama";

type SupportedChatModelDefinition = {
    id: string;
    provider: SupportedProvider;
    pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
    
    {
    id: "gemini-3.5-flash-lite",
    provider: "google",
    pricing: {
        inputUsdPerMillionTokens: 0,
        outputUsdPerMillionTokens: 0,
    },
    },

    {
        // Best cloud default: fast normal chatbot model.
        id: "gemini-3.8-flash",
        provider: "google",
        pricing: {
            inputUsdPerMillionTokens: 0,
            outputUsdPerMillionTokens: 0,
        },
    },
    {
        // Groq cloud model. Free account quota ke andar chalega.
        id: "openai/gpt-oss-20b",
        provider: "groq",
        pricing: {
            inputUsdPerMillionTokens: 0,
            outputUsdPerMillionTokens: 0,
        },
    },
    {
        // Completely local Llama model through Ollama.
        // Pehle `ollama pull llama3.2` chalana hoga.
        id: "llama3.2",
        provider: "ollama",
        pricing: {
            inputUsdPerMillionTokens: 0,
            outputUsdPerMillionTokens: 0,
        },
    },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
    return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

// Aapka CLI abhi model-picker nahi dikhata, isliye ye default model use hoga.
export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gemini-3.5-flash-lite";


