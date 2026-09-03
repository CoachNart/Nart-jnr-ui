const API_BASE = (
  process.env.NEXT_PUBLIC_KITSETUPS_API ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/+$/, "");

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
