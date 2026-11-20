import { Router } from "express";
import { AuthServiceError } from "../lib/auth/auth.service";
import {
  completeGoogleOAuth,
  startGoogleOAuth,
} from "../lib/auth/google-oauth.service";

const router = Router();

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
  <body style="max-width:560px;margin:48px auto;padding:0 20px;font-family:Arial,sans-serif;">
    ${content}
  </body>
</html>`;
}

function errorPage(message: string): string {
  return browserPage(
    "Google sign-in failed",
    `<h1>Google sign-in failed</h1><p>${escapeHtml(message)}</p>`,
  );
}

router.get("/google", async (req, res) => {
  const requestId =
    typeof req.query.requestId === "string" ? req.query.requestId : "";

  if (!requestId) {
    return res.status(400).type("html").send(
      errorPage("The CLI login request is missing."),
    );
  }

  try {
    return res.redirect(await startGoogleOAuth(requestId));
  } catch (error) {
    const message =
      error instanceof AuthServiceError
        ? error.message
        : "Unable to start Google sign-in.";

    console.error("Google OAuth start error:", error);
    return res.status(400).type("html").send(errorPage(message));
  }
});

router.get("/google/callback", async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const googleError =
    typeof req.query.error === "string" ? req.query.error : "";

  if (googleError) {
    return res.status(400).type("html").send(
      errorPage("Google sign-in was cancelled or denied."),
    );
  }

  if (!state || !code) {
    return res.status(400).type("html").send(
      errorPage("Google did not return a valid authorization response."),
    );
  }

  try {
    await completeGoogleOAuth({ state, code });

    return res.type("html").send(
      browserPage(
        "Sign-in approved",
        "<h1>Sign-in approved</h1><p>Return to the Nightcode CLI to finish signing in.</p>",
      ),
    );
  } catch (error) {
    const message =
      error instanceof AuthServiceError
        ? error.message
        : "Unable to complete Google sign-in.";

    console.error("Google OAuth callback error:", error);
    return res.status(400).type("html").send(errorPage(message));
  }
});

export default router;