import { createHash, randomBytes } from "node:crypto";

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

export function createSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getEmailVerificationExpiry(): Date {
  return new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
}