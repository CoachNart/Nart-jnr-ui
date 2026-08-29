const API_BASE =
  process.env.NEXT_PUBLIC_KITSETUPS_API?.replace(/\/+$/, "");

if (!API_BASE) {
  throw new Error(
    "NEXT_PUBLIC_KITSETUPS_API is not configured"
  );
}

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
    credentials: "include",
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
