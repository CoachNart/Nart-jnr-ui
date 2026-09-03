const API_BASE = "https://kitsetups-backend.onrender.com";

export function kitsetupsApi(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function kitsetupsFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(kitsetupsApi(path), {
    ...options,
    cache: "no-store",
  });
}

export async function kitsetupsAuthFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return kitsetupsFetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
