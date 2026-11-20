import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "../../../../database/src";
import { AuthServiceError } from "./auth.service";
import { verifyPassword } from "./password";
import { createSecureToken, hashToken } from "./tokens";

const CLI_LOGIN_TTL_MS = 1000 * 60 * 10;
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertCodeChallenge(codeChallenge: string): void {
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    throw new AuthServiceError("Invalid CLI login request.", 400);
  }
}

function codeChallengeFor(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function challengeMatches(
  codeVerifier: string,
  storedChallenge: string,
): boolean {
  const expectedChallenge = codeChallengeFor(codeVerifier);

  if (expectedChallenge.length !== storedChallenge.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedChallenge),
    Buffer.from(storedChallenge),
  );
}

async function authenticateVerifiedUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthServiceError("Invalid email or password.", 401);
  }

  if (!user.emailVerifiedAt) {
    throw new AuthServiceError(
      "Verify your email address before signing in.",
      403,
    );
  }

  return user;
}

export async function createCliAuthorizationRequest(
  codeChallenge: string,
): Promise<{ requestId: string; expiresAt: Date }> {
  assertCodeChallenge(codeChallenge);

  const request = await prisma.cliAuthorizationRequest.create({
    data: {
      codeChallenge,
      expiresAt: new Date(Date.now() + CLI_LOGIN_TTL_MS),
    },
  });

  return {
    requestId: request.id,
    expiresAt: request.expiresAt,
  };
}

export async function approveCliAuthorizationRequest(input: {
  requestId: string;
  email: string;
  password: string;
}): Promise<void> {
  const user = await authenticateVerifiedUser(input.email, input.password);
  const approvedAt = new Date();

  const result = await prisma.cliAuthorizationRequest.updateMany({
    where: {
      id: input.requestId,
      approvedAt: null,
      consumedAt: null,
      expiresAt: { gt: approvedAt },
    },
    data: {
      userId: user.id,
      approvedAt,
    },
  });

  if (result.count !== 1) {
    throw new AuthServiceError(
      "This CLI login request is invalid or has expired.",
      400,
    );
  }
}

export async function getCliAuthorizationStatus(
  requestId: string,
): Promise<"pending" | "approved"> {
  const request = await prisma.cliAuthorizationRequest.findUnique({
    where: { id: requestId },
    select: {
      approvedAt: true,
      consumedAt: true,
      expiresAt: true,
    },
  });

  if (
    !request ||
    request.consumedAt ||
    request.expiresAt <= new Date()
  ) {
    throw new AuthServiceError(
      "This CLI login request is invalid or has expired.",
      400,
    );
  }

  return request.approvedAt ? "approved" : "pending";
}

export async function exchangeCliAuthorizationRequest(input: {
  requestId: string;
  codeVerifier: string;
}): Promise<{ accessToken: string; expiresAt: Date }> {
  const request = await prisma.cliAuthorizationRequest.findUnique({
    where: { id: input.requestId },
  });

  if (
    !request ||
    !request.userId ||
    !request.approvedAt ||
    request.consumedAt ||
    request.expiresAt <= new Date() ||
    !challengeMatches(input.codeVerifier, request.codeChallenge)
  ) {
    throw new AuthServiceError(
      "This CLI login request is invalid, expired, or not approved.",
      400,
    );
  }

  const accessToken = createSecureToken();
  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_MS);

  await prisma.$transaction(async (tx) => {
    const consumedRequest = await tx.cliAuthorizationRequest.updateMany({
      where: {
        id: request.id,
        userId: request.userId,
        approvedAt: { not: null },
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        consumedAt: new Date(),
      },
    });

    if (consumedRequest.count !== 1) {
      throw new AuthServiceError(
        "This CLI login request has already been used.",
        400,
      );
    }

    await tx.authSession.create({
      data: {
        userId: request.userId!,
        tokenHash: hashToken(accessToken),
        expiresAt,
      },
    });
  });

  return { accessToken, expiresAt };
}



export async function getAuthenticatedUser(accessToken: string) {
  if (!accessToken) {
    throw new AuthServiceError("Authentication required.", 401);
  }

  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash: hashToken(accessToken),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.authSession.delete({
        where: { id: session.id },
      });
    }

    throw new AuthServiceError("Session is invalid or expired.", 401);
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}

export async function revokeAuthenticatedSession(
  accessToken: string,
): Promise<void> {
  if (!accessToken) {
    throw new AuthServiceError("Authentication required.", 401);
  }

  await prisma.authSession.deleteMany({
    where: {
      tokenHash: hashToken(accessToken),
    },
  });
}