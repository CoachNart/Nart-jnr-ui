const API_PREFIX = "/api/kitsetups";

export function kitsetupsApi(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
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

  return fetch(kitsetupsApi(path), {
    ...options,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
}
