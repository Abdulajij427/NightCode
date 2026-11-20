import { prisma } from "../../../../database/src";
import {
  sendEmailVerification,
  sendPasswordReset,
} from "../email/email.service";
import {
  createSecureToken,
  getEmailVerificationExpiry,
  getPasswordResetExpiry,
  hashToken,
} from "./tokens";
import { hashPassword } from "./password";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

type SignupInput = {
  email: string;
  password: string;
};

type ResetPasswordInput = {
  token: string;
  password: string;
};

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !normalized.includes("@")) {
    throw new AuthServiceError("A valid email address is required.", 400);
  }

  return normalized;
}

function getApiUrl(): string {
  const value = process.env.API_URL?.trim();

  if (!value) {
    throw new Error("Auth service is not configured: set API_URL.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("API_URL must be an absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API_URL must use HTTP or HTTPS.");
  }

  return value.replace(/\/+$/, "");
}

function verificationUrl(token: string): string {
  return `${getApiUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function passwordResetUrl(token: string): string {
  return `${getApiUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function signup(input: SignupInput) {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const token = createSecureToken();

  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: hashToken(token),
          expiresAt: getEmailVerificationExpiry(),
        },
      });

      return createdUser;
    });

    await sendEmailVerification({
      to: user.email,
      actionUrl: verificationUrl(token),
    });

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthServiceError(
        "An account with this email already exists.",
        409,
      );
    }

    throw error;
  }
}


export async function resendEmailVerification(
  emailInput: string,
): Promise<void> {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Same generic response keeps account existence private.
  if (!user || user.emailVerifiedAt) {
    return;
  }

  const token = createSecureToken();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: getEmailVerificationExpiry(),
      },
    }),
  ]);

  await sendEmailVerification({
    to: user.email,
    actionUrl: verificationUrl(token),
  });
}


export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!verificationToken || verificationToken.expiresAt <= new Date()) {
    throw new AuthServiceError(
      "This verification link is invalid or has expired.",
      400,
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationToken.userId },
    }),
  ]);
}

export async function requestPasswordReset(emailInput: string): Promise<void> {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return successfully to avoid exposing whether an email is registered.
  if (!user || !user.emailVerifiedAt) {
    return;
  }

  const token = createSecureToken();

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: getPasswordResetExpiry(),
      },
    }),
  ]);

  await sendPasswordReset({
    to: user.email,
    actionUrl: passwordResetUrl(token),
  });
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<void> {
  const token = input.token.trim();

  if (!token) {
    throw new AuthServiceError("Reset token is required.", 400);
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetToken || resetToken.expiresAt <= new Date()) {
    throw new AuthServiceError(
      "This password-reset link is invalid or has expired.",
      400,
    );
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
}