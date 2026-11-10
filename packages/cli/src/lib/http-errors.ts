type ErrorResponse = {
    json: () => Promise<unknown>;
    status: number;
    statusText: string;
};

export async function getErrorMessage(response: ErrorResponse) {
    try {
        const data = (await response.json()) as { error?: string; message?: string };
        const text = data.error ?? data.message;
        if (typeof text === "string" && text.length > 0) {
            return text;
        }
    } catch {}

    return response.statusText || `Request failed with status ${response.status}`;
}