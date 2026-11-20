import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthServiceError } from "../lib/auth/auth.service";
import {
  approveCliAuthorizationRequest,
  createCliAuthorizationRequest,
  exchangeCliAuthorizationRequest,
  getCliAuthorizationStatus,
} from "../lib/auth/cli-auth.service";

const router = Router();

const startSchema = z.object({
  codeChallenge: z.string(),
});

const approveSchema = z.object({
  requestId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

const exchangeSchema = z.object({
  requestId: z.string().min(1),
  codeVerifier: z.string().min(43),
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
  <body style="max-width:560px;margin:48px auto;padding:0 20px;font-family:Arial,sans-serif;">
    ${content}
  </body>
</html>`;
}

function authorizationUrl(requestId: string): string {
  const apiUrl = process.env.API_URL?.trim();

  if (!apiUrl) {
    throw new Error("API_URL is required.");
  }

  const url = new URL("/auth/cli/authorize", apiUrl);
  url.searchParams.set("requestId", requestId);

  return url.toString();
}

function sendJsonError(res: Response, error: unknown): Response {
  if (error instanceof AuthServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("CLI auth error:", error);
  return res.status(500).json({ error: "Unable to complete CLI authentication." });
}

function sendBrowserError(res: Response, error: unknown): void {
  if (error instanceof AuthServiceError) {
    res.status(error.statusCode).type("html").send(
      browserPage(
        "Sign-in failed",
        `<h1>Sign-in failed</h1><p>${escapeHtml(error.message)}</p>`,
      ),
    );
    return;
  }

  console.error("CLI browser auth error:", error);
  res.status(500).type("html").send(
    browserPage(
      "Something went wrong",
      "<h1>Something went wrong</h1><p>Please return to Nightcode and try again.</p>",
    ),
  );
}

router.post("/start", async (req, res) => {
  const result = startSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid CLI login request." });
  }

  try {
    const request = await createCliAuthorizationRequest(
      result.data.codeChallenge,
    );

    return res.status(201).json({
      requestId: request.requestId,
      expiresAt: request.expiresAt,
      authorizationUrl: authorizationUrl(request.requestId),
    });
  } catch (error) {
    return sendJsonError(res, error);
  }
});

router.get("/authorize", async (req, res) => {
  const requestId =
    typeof req.query.requestId === "string" ? req.query.requestId : "";

  if (!requestId) {
    return res.status(400).type("html").send(
      browserPage(
        "Invalid request",
        "<h1>Invalid request</h1><p>The CLI login request is missing.</p>",
      ),
    );
  }

  try {
        const status = await getCliAuthorizationStatus(requestId);

        if (status === "approved") {
        return res.type("html").send(
            browserPage(
            "Already approved",
            "<h1>Already approved</h1><p>Return to the Nightcode CLI to finish signing in.</p>",
            ),
        );
        }

        return res.type("html").send(`<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sign in to Nightcode</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
            background: linear-gradient(180deg, #f5f5f7 0%, #e9edf5 100%);
            color: #1d1d1f;
            }
            .card {
            width: 100%;
            max-width: 390px;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 22px;
            padding: 36px 28px 28px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.07);
            }
            .logo {
            width: 44px;
            height: 44px;
            margin: 0 auto 14px;
            border-radius: 12px;
            background: linear-gradient(135deg, #0071e3, #5e5ce6);
            color: #fff;
            display: grid;
            place-items: center;
            font-weight: 700;
            font-size: 16px;
            }
            h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
            text-align: center;
            }
            .sub {
            margin: 6px 0 24px;
            font-size: 14px;
            color: #6e6e73;
            text-align: center;
            }
            label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #424245;
            margin-bottom: 6px;
            }
            input {
            width: 100%;
            height: 44px;
            padding: 0 14px;
            margin-bottom: 16px;
            font-size: 15px;
            font-family: inherit;
            color: #1d1d1f;
            background: #fafafa;
            border: 1px solid #d2d2d7;
            border-radius: 12px;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
            }
            input:focus {
            background: #fff;
            border-color: #0071e3;
            box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.18);
            }
            .btn {
            width: 100%;
            height: 44px;
            margin-top: 4px;
            border: none;
            border-radius: 12px;
            background: #0071e3;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: background 0.15s;
            }
            .btn:hover { background: #0077ed; }
            .divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
            color: #86868b;
            font-size: 12px;
            }
            .divider::before, .divider::after {
            content: "";
            flex: 1;
            height: 1px;
            background: #e5e5ea;
            }
            .google-btn {
            width: 100%;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-radius: 12px;
            border: 1px solid #d2d2d7;
            background: #fff;
            color: #1d1d1f;
            font-size: 15px;
            font-weight: 500;
            text-decoration: none;
            transition: background 0.15s;
            }
            .google-btn:hover { background: #f5f5f7; }
        </style>
        </head>
        <body>
        <div class="card">
            <div class="logo">&lt;/&gt;</div>
            <h1>Sign in to Nightcode</h1>
            <p class="sub">Use your Nightcode account to continue</p>

            <form method="post" action="/auth/cli/authorize">
            <input type="hidden" name="requestId" value="${escapeHtml(requestId)}" />

            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="name@example.com" required />

            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Password" required />

            <button class="btn" type="submit">Sign in to Nightcode</button>
            </form>

            <div class="divider">Or</div>

            <a class="google-btn" href="/auth/oauth/google?requestId=${escapeHtml(requestId)}">
            <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.7 12.3c0-.7-.1-1.4-.2-2.1H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-9.1z"/>
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z"/>
                <path fill="#FBBC05" d="M5.3 14.2c-.2-.7-.4-1.5-.4-2.2s.2-1.5.4-2.2V6.6H1.3C.5 8.2 0 10.1 0 12s.5 3.8 1.3 5.4l4-3.2z"/>
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.2c.9-2.9 3.6-5 6.7-5z"/>
            </svg>
            Continue with Google
            </a>
        </div>
        </body>
        </html>`);
    } catch (error) {
        return sendBrowserError(res, error);
    }
});

router.post("/authorize", async (req, res) => {
  const result = approveSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).type("html").send(
      browserPage(
        "Invalid request",
        "<h1>Invalid request</h1><p>Please return to Nightcode and try again.</p>",
      ),
    );
  }

  try {
    await approveCliAuthorizationRequest(result.data);

    return res.type("html").send(
      browserPage(
        "Sign-in approved",
        "<h1>Sign-in approved</h1><p>Return to the Nightcode CLI to finish signing in.</p>",
        
      ),
    );
  } catch (error) {
    return sendBrowserError(res, error);
  }
});



router.get("/status/:requestId", async (req, res) => {
  try {
    const status = await getCliAuthorizationStatus(req.params.requestId);

    return res.json({ status });
  } catch (error) {
    return sendJsonError(res, error);
  }
});

router.post("/exchange", async (req, res) => {
  const result = exchangeSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid token exchange request." });
  }

  try {
    const session = await exchangeCliAuthorizationRequest(result.data);

    return res.json(session);
  } catch (error) {
    return sendJsonError(res, error);
  }
});

export default router;