const API_PREFIX = "/api/kitsetups";
const DIRECT_BACKEND_URL =
  process.env.NEXT_PUBLIC_KITSETUPS_BACKEND_URL ||
  "https://kitsetups-backend.onrender.com";

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);
const FALLBACK_STATUSES = new Set([404, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

export function kitsetupsApi(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
}

function directBackendApi(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${DIRECT_BACKEND_URL.replace(/\/$/, "")}${normalized}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isJsonResponse(response: Response) {
  return (response.headers.get("content-type") || "")
    .toLowerCase()
    .includes("application/json");
}

async function normalizeSignalsResponse(response: Response): Promise<Response> {
  if (!isJsonResponse(response)) return response;
  if (!response.url.includes("/api/signals")) return response;

  try {
    const payload = await response.clone().json();
    const data = payload?.data;

    if (payload?.ok && data) {
      const fallback = Array.isArray(data.scanResults)
        ? data.scanResults
        : [];

      if (!Array.isArray(data.signals)) {
        const normalized = {
          ...payload,
          data: {
            ...data,
            signals: fallback,
            scanResults: Array.isArray(data.scanResults)
              ? data.scanResults
              : fallback,
          },
        };

        return new Response(JSON.stringify(normalized), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    }
  } catch {
    // Leave the original response untouched; the caller will report JSON errors.
  }

  return response;
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

  const method = (options.method || "GET").toUpperCase();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      let response = await fetch(kitsetupsApi(path), {
        ...options,
        headers,
        cache: "no-store",
        credentials: "same-origin",
      });

      // GET requests can bypass a broken Next proxy and talk directly to the
      // Render backend. This keeps market data flowing after a frontend deploy.
      if (method === "GET" && FALLBACK_STATUSES.has(response.status)) {
        try {
          response = await fetch(directBackendApi(path), {
            ...options,
            headers,
            cache: "no-store",
            credentials: "omit",
          });
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }

      if (!TRANSIENT_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return normalizeSignalsResponse(response);
      }

      await sleep(500 * 2 ** (attempt - 1));
    } catch (error) {
      lastError = error;

      if (method === "GET") {
        try {
          const fallbackResponse = await fetch(directBackendApi(path), {
            ...options,
            headers,
            cache: "no-store",
            credentials: "omit",
          });

          if (!TRANSIENT_STATUSES.has(fallbackResponse.status)) {
            return normalizeSignalsResponse(fallbackResponse);
          }
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }

      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(500 * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("KitSetups API request failed");
}
