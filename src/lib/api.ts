const API_PREFIX = "/api/kitsetups";

export function kitsetupsApi(path: string): string {
  return `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
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

  return fetch(kitsetupsApi(path), {
    ...options,
    headers,
    cache: "no-store",
  });
}
