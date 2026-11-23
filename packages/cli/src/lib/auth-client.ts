import { createHash, randomBytes } from "node:crypto";
import { BASE_URL } from "./api-client";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  storeAccessToken,
} from "./auth-storage";

export type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
};

type ApiError = Error & {
  status: number;
};

type CliLoginStartResponse = {
  requestId: string;
  expiresAt: string;
  authorizationUrl: string;
};

type CliLoginStatusResponse = {
  status: "pending" | "approved";
};

type CliLoginExchangeResponse = {
  accessToken: string;
  expiresAt: string;
};

function createApiError(message: string, status: number): ApiError {
  return Object.assign(new Error(message), { status });
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw createApiError(
      body.error ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return body as T;
}

function createCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function createCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function openBrowser(url: string): void {
  const command =
    process.platform === "win32"
      ? ["cmd.exe", "/c", "start", "", url]
      : process.platform === "darwin"
        ? ["open", url]
        : ["xdg-open", url];

  Bun.spawn(command, {
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const accessToken = await getStoredAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const response = await request<{ user: AuthenticatedUser }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.user;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 401
    ) {
      await clearStoredAccessToken();
      return null;
    }

    throw error;
  }
}

export async function loginWithBrowser(): Promise<AuthenticatedUser> {
  const codeVerifier = createCodeVerifier();
  const start = await request<CliLoginStartResponse>("/auth/cli/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      codeChallenge: createCodeChallenge(codeVerifier),
    }),
  });

  openBrowser(start.authorizationUrl);

  const expiresAt = new Date(start.expiresAt).getTime();

  while (Date.now() < expiresAt) {
    await wait(1_500);

    const status = await request<CliLoginStatusResponse>(
      `/auth/cli/status/${encodeURIComponent(start.requestId)}`,
    );

    if (status.status !== "approved") {
      continue;
    }

    const session = await request<CliLoginExchangeResponse>(
      "/auth/cli/exchange",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: start.requestId,
          codeVerifier,
        }),
      },
    );

    await storeAccessToken(session.accessToken);

    const user = await getCurrentUser();

    if (!user) {
      await clearStoredAccessToken();
      throw new Error("Sign-in succeeded, but the session could not be verified.");
    }

    return user;
  }

  throw new Error("Sign-in request expired. Please try again.");
}

export async function logout(): Promise<void> {
  const accessToken = await getStoredAccessToken();

  try {
    if (accessToken) {
      await request("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } finally {
    await clearStoredAccessToken();
  }
}