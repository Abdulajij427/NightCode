export type EmailTemplate = {
    subject: string;
    html: string;
    text: string;
};

type ActionEmailTemplateOptions = {
    actionUrl: string;
    recipientName?: string;
};

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function validatedActionUrl(actionUrl: string): string {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(actionUrl);
    } catch {
        throw new Error("Email action URL must be an absolute URL.");
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        throw new Error("Email action URL must use HTTP or HTTPS.");
    }

    return parsedUrl.toString();
}

function greeting(recipientName?: string): { html: string; text: string } {
    if (!recipientName?.trim()) {
        return { html: "Hello,", text: "Hello," };
    }

    const name = recipientName.trim();
    return {
        html: `Hello ${escapeHtml(name)},`,
        text: `Hello ${name},`,
    };
}

function actionEmailTemplate(
    options: ActionEmailTemplateOptions,
    content: {
        subject: string;
        heading: string;
        message: string;
        buttonLabel: string;
        fallback: string;
    },
): EmailTemplate {
    const actionUrl = validatedActionUrl(options.actionUrl);
    const safeUrl = escapeHtml(actionUrl);
    const hello = greeting(options.recipientName);

    return {
        subject: content.subject,
        html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f7fb;color:#1f2937;font-family:Arial,sans-serif;">
    <main style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;">
      <h1 style="margin:0 0 24px;font-size:24px;">${content.heading}</h1>
      <p>${hello.html}</p>
      <p>${content.message}</p>
      <p style="margin:28px 0;"><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">${content.buttonLabel}</a></p>
      <p>${content.fallback}</p>
      <p style="word-break:break-all;"><a href="${safeUrl}">${safeUrl}</a></p>
    </main>
  </body>
</html>`,
        text: `${hello.text}\n\n${content.message}\n\n${content.buttonLabel}: ${actionUrl}\n\n${content.fallback}`,
    };
}

export function createEmailVerificationTemplate(
    options: ActionEmailTemplateOptions,
): EmailTemplate {
    return actionEmailTemplate(options, {
        subject: "Verify your email address",
        heading: "Verify your email address",
        message: "Please confirm your email address to finish setting up your account.",
        buttonLabel: "Verify email",
        fallback: "If you did not create this account, you can safely ignore this email.",
    });
}

export function createPasswordResetTemplate(
    options: ActionEmailTemplateOptions,
): EmailTemplate {
    return actionEmailTemplate(options, {
        subject: "Reset your password",
        heading: "Reset your password",
        message: "We received a request to reset your password. Use the link below to choose a new one.",
        buttonLabel: "Reset password",
        fallback: "If you did not request a password reset, you can safely ignore this email.",
    });
}
