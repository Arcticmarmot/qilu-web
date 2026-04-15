import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.QILU_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = new URL(`${BACKEND_BASE_URL}/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
