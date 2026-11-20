import { OAuthProvider } from "../../../../database/generated/prisma/client";
import { prisma } from "../../../../database/src";
import { AuthServiceError } from "./auth.service";
import { createSecureToken, hashToken } from "./tokens";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_STATE_TTL_MS = 1000 * 60 * 10;

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function requiredEnvironmentValue(
  name: "API_URL" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET",
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Google OAuth is not configured: set ${name}.`);
  }

  return value;
}

function googleCallbackUrl(): string {
  const apiUrl = requiredEnvironmentValue("API_URL");

  try {
    return new URL("/auth/oauth/google/callback", apiUrl).toString();
  } catch {
    throw new Error("API_URL must be an absolute URL.");
  }
}

function googleConfig() {
  return {
    clientId: requiredEnvironmentValue("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnvironmentValue("GOOGLE_CLIENT_SECRET"),
    redirectUri: googleCallbackUrl(),
  };
}

async function getGoogleIdentity(code: string): Promise<{
  providerAccountId: string;
  email: string;
}> {
  const { clientId, clientSecret, redirectUri } = googleConfig();

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    throw new AuthServiceError(
      "Google sign-in could not be completed. Please try again.",
      400,
    );
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

  if (
    !userInfoResponse.ok ||
    !userInfo.sub ||
    !userInfo.email ||
    userInfo.email_verified !== true
  ) {
    throw new AuthServiceError(
      "Google did not provide a verified email address.",
      400,
    );
  }

  return {
    providerAccountId: userInfo.sub,
    email: userInfo.email.trim().toLowerCase(),
  };
}

export async function startGoogleOAuth(requestId: string): Promise<string> {
  const request = await prisma.cliAuthorizationRequest.findUnique({
    where: { id: requestId },
  });

  if (
    !request ||
    request.approvedAt ||
    request.consumedAt ||
    request.expiresAt <= new Date()
  ) {
    throw new AuthServiceError(
      "This CLI login request is invalid or has expired.",
      400,
    );
  }

  const state = createSecureToken();

  await prisma.oAuthAuthorizationState.create({
    data: {
      stateHash: hashToken(state),
      provider: OAuthProvider.GOOGLE,
      expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
      cliAuthorizationRequestId: request.id,
    },
  });

  const { clientId, redirectUri } = googleConfig();
  const authorizationUrl = new URL(GOOGLE_AUTHORIZE_URL);

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  return authorizationUrl.toString();
}

export async function completeGoogleOAuth(input: {
  state: string;
  code: string;
}): Promise<void> {
  const stateRecord = await prisma.oAuthAuthorizationState.findUnique({
    where: {
      stateHash: hashToken(input.state),
    },
  });

  if (
    !stateRecord ||
    stateRecord.provider !== OAuthProvider.GOOGLE ||
    stateRecord.usedAt ||
    stateRecord.expiresAt <= new Date()
  ) {
    throw new AuthServiceError(
      "Google sign-in request is invalid or has expired.",
      400,
    );
  }

  const identity = await getGoogleIdentity(input.code);

  await prisma.$transaction(async (tx) => {
    const usedState = await tx.oAuthAuthorizationState.updateMany({
      where: {
        id: stateRecord.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (usedState.count !== 1) {
      throw new AuthServiceError(
        "Google sign-in request has already been used.",
        400,
      );
    }

    const cliRequest = await tx.cliAuthorizationRequest.findUnique({
      where: {
        id: stateRecord.cliAuthorizationRequestId,
      },
    });

    if (
      !cliRequest ||
      cliRequest.approvedAt ||
      cliRequest.consumedAt ||
      cliRequest.expiresAt <= new Date()
    ) {
      throw new AuthServiceError(
        "This CLI login request is invalid or has expired.",
        400,
      );
    }

    const existingOAuthAccount = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: OAuthProvider.GOOGLE,
          providerAccountId: identity.providerAccountId,
        },
      },
    });

    let userId: string;

    if (existingOAuthAccount) {
      userId = existingOAuthAccount.userId;
    } else {
      const existingEmailUser = await tx.user.findUnique({
        where: {
          email: identity.email,
        },
      });

      if (existingEmailUser) {
        userId = existingEmailUser.id;

        await tx.user.update({
          where: {
            id: existingEmailUser.id,
          },
          data: {
            emailVerifiedAt: existingEmailUser.emailVerifiedAt ?? new Date(),
            oauthAccounts: {
              create: {
                provider: OAuthProvider.GOOGLE,
                providerAccountId: identity.providerAccountId,
              },
            },
          },
        });
      } else {
        const user = await tx.user.create({
          data: {
            email: identity.email,
            emailVerifiedAt: new Date(),
            oauthAccounts: {
              create: {
                provider: OAuthProvider.GOOGLE,
                providerAccountId: identity.providerAccountId,
              },
            },
          },
        });

        userId = user.id;
      }
    }

    const approvedRequest = await tx.cliAuthorizationRequest.updateMany({
      where: {
        id: cliRequest.id,
        approvedAt: null,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        userId,
        approvedAt: new Date(),
      },
    });

    if (approvedRequest.count !== 1) {
      throw new AuthServiceError(
        "This CLI login request has already been completed.",
        400,
      );
    }
  });
}