const BACKEND_URL = "https://kitsetups-backend.onrender.com";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path = [] } = await context.params;
  const target = `${BACKEND_URL}/api/${path.join("/")}${new URL(request.url).search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== "host" && key !== "content-length" && key !== "connection") {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("KitSetups backend proxy error:", error);
    return Response.json(
      {
        ok: false,
        error: "Backend service temporarily unavailable",
        code: "BACKEND_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: ALLOWED_METHODS.join(", "),
    },
  });
}
