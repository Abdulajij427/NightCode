import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const SERVICE_NAME = "nightcode-cli";
const SESSION_TOKEN_NAME = "session-token";
const FALLBACK_AUTH_FILE = join(
  process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
  "nightcode-cli",
  "auth.json",
);

async function readFallbackToken(): Promise<string | null> {
  try {
    const raw = await readFile(FALLBACK_AUTH_FILE, "utf-8");
    const parsed = JSON.parse(raw) as { token?: unknown };
    return typeof parsed.token === "string" && parsed.token.length > 0
      ? parsed.token
      : null;
  } catch {
    return null;
  }
}

async function writeFallbackToken(accessToken: string): Promise<void> {
  await mkdir(dirname(FALLBACK_AUTH_FILE), { recursive: true, mode: 0o700 });
  await writeFile(
    FALLBACK_AUTH_FILE,
    JSON.stringify({ token: accessToken }, null, 2),
    { encoding: "utf-8", mode: 0o600 },
  );
  if (process.platform !== "win32") {
    await chmod(FALLBACK_AUTH_FILE, 0o600).catch(() => {});
  }
}

async function deleteFallbackToken(): Promise<void> {
  await rm(FALLBACK_AUTH_FILE, { force: true }).catch(() => {});
}

export async function getStoredAccessToken(): Promise<string | null> {
  try {
    const secret = await Bun.secrets.get({
      service: SERVICE_NAME,
      name: SESSION_TOKEN_NAME,
    });
    if (secret) return secret;
  } catch {
    // Keychain unavailable (headless Linux, SSH, Docker)
  }

  return readFallbackToken();
}

export async function getAuth(): Promise<{ token: string } | null> {
  const token = await getStoredAccessToken();
  return token ? { token } : null;
}

export async function storeAccessToken(accessToken: string): Promise<void> {
  try {
    await Bun.secrets.set({
      service: SERVICE_NAME,
      name: SESSION_TOKEN_NAME,
      value: accessToken,
    });
    await deleteFallbackToken();
  } catch {
    await writeFallbackToken(accessToken);
  }
}

export async function clearStoredAccessToken(): Promise<void> {
  try {
    await Bun.secrets.delete({
      service: SERVICE_NAME,
      name: SESSION_TOKEN_NAME,
    });
  } catch {
    // Ignore if keychain is unavailable
  }
  await deleteFallbackToken();
}



























































// const SERVICE_NAME = "nightcode-cli";
// const SESSION_TOKEN_NAME = "session-token";

// export async function getStoredAccessToken(): Promise<string | null> {
//   return Bun.secrets.get({
//     service: SERVICE_NAME,
//     name: SESSION_TOKEN_NAME,
//   });
// }

// export async function storeAccessToken(accessToken: string): Promise<void> {
//   await Bun.secrets.set({
//     service: SERVICE_NAME,
//     name: SESSION_TOKEN_NAME,
//     value: accessToken

//   });
// }

// export async function clearStoredAccessToken(): Promise<void> {
//   await Bun.secrets.delete({
//     service: SERVICE_NAME,
//     name: SESSION_TOKEN_NAME,
//   });
// }