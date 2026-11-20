import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  AuthServiceError,
  resendEmailVerification,
  requestPasswordReset,
  resetPassword,
  signup,
  verifyEmail,
} from "../lib/auth/auth.service";

import {
  getAuthenticatedUser,
  revokeAuthenticatedSession,
} from "../lib/auth/cli-auth.service";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string(),
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function browserPage(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="max-width: 560px; margin: 48px auto; padding: 0 20px; font-family: Arial, sans-serif;">
    ${content}
  </body>
</html>`;
}

function sendBrowserError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  if (error instanceof AuthServiceError) {
    res.status(error.statusCode).type("html").send(
      browserPage(
        "Request failed",
        `<h1>Request failed</h1><p>${escapeHtml(error.message)}</p>`,
      ),
    );
    return;
  }

  console.error("Auth route error:", error);
  res.status(500).type("html").send(
    browserPage(
      "Something went wrong",
      `<h1>Something went wrong</h1><p>${escapeHtml(fallbackMessage)}</p>`,
    ),
  );
}



function getBearerToken(req: Request): string {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new AuthServiceError("Authentication required.", 401);
  }

  return match[1];
}

router.get("/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(getBearerToken(req));

    return res.json({ user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Current user lookup error:", error);
    return res.status(500).json({ error: "Unable to load current user." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    await revokeAuthenticatedSession(getBearerToken(req));

    return res.status(204).send();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Logout error:", error);
    return res.status(500).json({ error: "Unable to sign out." });
  }
});



router.post("/signup", async (req, res) => {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  try {
    const user = await signup(result.data);

    return res.status(201).json({
      user,
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Signup error:", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
});



router.post("/resend-verification", async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  try {
    await resendEmailVerification(result.data.email);

    return res.json({
      message:
        "If an unverified account exists for this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      error: "Unable to resend verification email.",
    });
  }
});


router.get("/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    return res.status(400).type("html").send(
      browserPage(
        "Invalid verification link",
        "<h1>Invalid verification link</h1><p>The verification token is missing.</p>",
      ),
    );
  }

  try {
    await verifyEmail(token);

    return res.type("html").send(
      browserPage(
        "Email verified",
        "<h1>Email verified</h1><p>Your account is verified. You can return to Nightcode and sign in.</p>",
      ),
    );
  } catch (error) {
    return sendBrowserError(
      res,
      error,
      "Your verification link could not be used.",
    );
  }
});

router.post("/forgot-password", async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  try {
    await requestPasswordReset(result.data.email);

    return res.json({
      message:
        "If an account exists for this email, a password-reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ error: "Unable to process request." });
  }
});

router.get("/reset-password", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    return res.status(400).type("html").send(
      browserPage(
        "Invalid reset link",
        "<h1>Invalid reset link</h1><p>The password-reset token is missing.</p>",
      ),
    );
  }

  return res.type("html").send(
    browserPage(
      "Reset password",
      `<h1>Reset your password</h1>
<form method="post" action="/auth/reset-password">
  <input type="hidden" name="token" value="${escapeHtml(token)}" />
  <label for="password">New password</label><br />
  <input id="password" name="password" type="password" minlength="8" required style="margin:8px 0 16px; padding:8px; width:100%;" />
  <br />
  <button type="submit">Save new password</button>
</form>`,
    ),
  );
});

router.post("/reset-password", async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).type("html").send(
      browserPage(
        "Invalid request",
        "<h1>Invalid request</h1><p>Please open the password-reset link from your email again.</p>",
      ),
    );
  }

  try {
    await resetPassword(result.data);

    return res.type("html").send(
      browserPage(
        "Password updated",
        "<h1>Password updated</h1><p>Your password has been changed. You can return to Nightcode and sign in.</p>",
      ),
    );
  } catch (error) {
    return sendBrowserError(
      res,
      error,
      "Your password could not be updated.",
    );
  }
});

export default router;