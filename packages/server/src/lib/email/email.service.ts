import { getEmailConfiguration, getResendClient } from "./resend";
import {
    createEmailVerificationTemplate,
    createPasswordResetTemplate,
    type EmailTemplate,
} from "./templates";

export type SendEmailOptions = EmailTemplate & {
    to: string;
};

export type SendEmailResult = {
    id: string;
};

export type EmailActionOptions = {
    to: string;
    actionUrl: string;
    recipientName?: string;
};

function validateRecipient(to: string): string {
    const recipient = to.trim();

    if (!recipient || !recipient.includes("@")) {
        throw new Error("A valid recipient email address is required.");
    }

    return recipient;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const to = validateRecipient(options.to);
    const { from } = getEmailConfiguration();

    try {
        const { data, error } = await getResendClient().emails.send({
            from,
            to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (!data?.id) {
            throw new Error("Email provider did not return a message ID.");
        }

        return { id: data.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email provider error.";
        throw new Error(`Unable to send email: ${message}`, { cause: error });
    }
}

export async function sendEmailVerification(
    options: EmailActionOptions,
): Promise<SendEmailResult> {
    return sendEmail({
        to: options.to,
        ...createEmailVerificationTemplate(options),
    });
}

export async function sendPasswordReset(
    options: EmailActionOptions,
): Promise<SendEmailResult> {
    return sendEmail({
        to: options.to,
        ...createPasswordResetTemplate(options),
    });
}
