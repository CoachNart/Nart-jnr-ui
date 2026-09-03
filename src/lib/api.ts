const API_PREFIX = "/api/kitsetups";

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

export function kitsetupsApi(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function kitsetupsFetch(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Accept", "application/json");

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(kitsetupsApi(path), {
        ...options,
        headers,
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!TRANSIENT_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }

      await sleep(500 * 2 ** (attempt - 1));
    } catch (error) {
      lastError = error;

      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await sleep(500 * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("KitSetups API request failed");
}
