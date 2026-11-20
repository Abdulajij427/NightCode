import { Resend } from "resend";

export type EmailConfiguration = {
    apiKey: string;
    from: string;
};

let resendClient: Resend | undefined;

function requiredEnvironmentValue(name: "RESEND_API_KEY" | "EMAIL_FROM"): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Email service is not configured: set ${name}.`);
    }

    return value;
}

export function getEmailConfiguration(): EmailConfiguration {
    return {
        apiKey: requiredEnvironmentValue("RESEND_API_KEY"),
        from: requiredEnvironmentValue("EMAIL_FROM"),
    };
}

/** Lazily creates the server-only Resend client. */
export function getResendClient(): Resend {
    if (!resendClient) {
        resendClient = new Resend(getEmailConfiguration().apiKey);
    }

    return resendClient;
}
