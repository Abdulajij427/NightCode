const SERVICE_NAME = "nightcode-cli";
const SESSION_TOKEN_NAME = "session-token";

export async function getStoredAccessToken(): Promise<string | null> {
  return Bun.secrets.get({
    service: SERVICE_NAME,
    name: SESSION_TOKEN_NAME,
  });
}

export async function storeAccessToken(accessToken: string): Promise<void> {
  await Bun.secrets.set({
    service: SERVICE_NAME,
    name: SESSION_TOKEN_NAME,
    value: accessToken

  });
}

export async function clearStoredAccessToken(): Promise<void> {
  await Bun.secrets.delete({
    service: SERVICE_NAME,
    name: SESSION_TOKEN_NAME,
  });
}