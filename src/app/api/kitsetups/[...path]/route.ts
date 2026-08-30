import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KITSETUPS_BACKEND_URL ||
  "https://kitsetups-backend.onrender.com";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  /*
   * Frontend requests arrive as:
   *
   *   /api/kitsetups/api/signals
   *   /api/kitsetups/api/analysis
   *
   * The /api/kitsetups prefix belongs ONLY to the Next.js
   * frontend proxy. It must NOT be forwarded to the backend.
   *
   * Therefore:
   *
   *   /api/kitsetups/api/signals
   *        -> ${BACKEND_URL}/api/signals
   *
   *   /api/kitsetups/api/analysis
   *        -> ${BACKEND_URL}/api/analysis
   */
  const backendPath = `/${path.join("/")}`;
  const target = `${BACKEND_URL}${backendPath}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    });

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("KitSetups backend proxy error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "KitSetups backend unavailable",
        code: "BACKEND_UNAVAILABLE",
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
