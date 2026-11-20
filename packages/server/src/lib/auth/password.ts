const MIN_PASSWORD_LENGTH = 8;

export function assertValidPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertValidPassword(password);

  return Bun.password.hash(password, {
    algorithm: "argon2id",
  });
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, passwordHash);
  } catch {
    return false;
  }
}