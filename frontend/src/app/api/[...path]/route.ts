import { NextRequest, NextResponse } from "next/server";

// Opt out of caching — this is a live API proxy
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "https://api-atmosphereteens.my.id";

// Headers that should NOT be forwarded (hop-by-hop or Vercel-internal)
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
]);

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = `${BACKEND_URL}/api/${path.join("/")}`;

  // Forward the request body for non-GET / non-HEAD methods
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  // Build forwarded headers — critically this includes the Cookie header
  // so the backend can read the authToken cookie set during login.
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (lk !== "host" && !HOP_BY_HOP.has(lk)) {
      forwardHeaders[key] = value;
    }
  });

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body ?? undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (err) {
    console.error("[proxy] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 502 },
    );
  }

  // Forward ALL response headers from Cloud Run back to the browser.
  // Set-Cookie is explicitly forwarded so the browser stores the authToken
  // cookie for atmosphereteens.my.id (same-origin). Safari iOS accepts this
  // without any ITP restrictions — this is what fixes the login loop.
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (!HOP_BY_HOP.has(lk)) {
      resHeaders.append(key, value);
    }
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
