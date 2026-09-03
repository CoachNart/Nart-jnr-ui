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

function normalizeSignal(signal: any) {
  if (!signal || typeof signal !== "object") return signal;

  const quality = signal.quality && typeof signal.quality === "object"
    ? signal.quality
    : null;

  const lifecycle = signal.lifecycle && typeof signal.lifecycle === "object"
    ? signal.lifecycle
    : null;

  return {
    ...signal,
    pair: signal.pair || signal.symbol || "UNKNOWN",
    direction: signal.direction || signal.side || null,
    grade: signal.grade || quality?.grade || null,
    score: signal.score ?? quality?.score ?? null,
    confidence:
      signal.confidence ||
      (quality?.score != null ? `${quality.score}%` : null),
    thesis:
      signal.thesis ||
      (Array.isArray(signal.reason) ? signal.reason.join(" • ") : signal.reason) ||
      "KitSetups is monitoring this market.",
    signalState:
      signal.signalState ||
      lifecycle?.status ||
      signal.status ||
      "WAIT",
  };
}

async function normalizeSignalsResponse(response: Response): Promise<Response> {
  if (!isJsonResponse(response)) return response;
  if (!response.url.includes("/api/signals")) return response;

  try {
    const payload = await response.clone().json();
    const data = payload?.data;

    if (payload?.ok && data) {
      const source = Array.isArray(data.signals)
        ? data.signals
        : Array.isArray(data.scanResults)
          ? data.scanResults
          : [];

      const signals = source.map(normalizeSignal);
      const normalized = {
        ...payload,
        data: {
          ...data,
          signals,
          scanResults: Array.isArray(data.scanResults)
            ? data.scanResults.map(normalizeSignal)
            : signals,
        },
      };

      return new Response(JSON.stringify(normalized), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  } catch {
    // Leave the original response untouched; callers handle malformed JSON.
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
