import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "api.mapbox.com";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // SSRF guard — only proxy Mapbox API
  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "MAPBOX_TOKEN not configured" }, { status: 500 });
  }

  parsed.searchParams.set("access_token", token);

  const upstream = await fetch(parsed.toString(), {
    headers: { "User-Agent": "BuilderMap/1.0" },
  });

  const body = await upstream.arrayBuffer();
  const headers: Record<string, string> = {
    "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
  };

  // Forward Mapbox cache headers so tiles are cached in the browser/CDN
  const cc = upstream.headers.get("cache-control");
  if (cc) headers["Cache-Control"] = cc;
  const etag = upstream.headers.get("etag");
  if (etag) headers["ETag"] = etag;

  return new NextResponse(body, { status: upstream.status, headers });
}
