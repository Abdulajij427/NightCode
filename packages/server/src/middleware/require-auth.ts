import type { NextFunction, Request, Response } from "express";
import { AuthServiceError } from "../lib/auth/auth.service";
import { getAuthenticatedUser } from "../lib/auth/cli-auth.service";

export type AuthenticatedUser = Awaited<
  ReturnType<typeof getAuthenticatedUser>
>;

function getBearerToken(req: Request): string {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new AuthServiceError("Authentication required.", 401);
  }

  return match[1];
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.locals.authUser = await getAuthenticatedUser(getBearerToken(req));
    next();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    next(error);
  }
}

export function getAuthUser(res: Response): AuthenticatedUser {
  const user = res.locals.authUser as AuthenticatedUser | undefined;

  if (!user) {
    throw new Error("Authenticated user is missing from request context.");
  }

  return user;
}