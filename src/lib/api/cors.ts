import { NextResponse } from "next/server";

const ALLOW_HEADERS = "Content-Type, Authorization";

export function corsHeaders(req: Request): Record<string, string> {
  const allowed = process.env.MOBILE_CORS_ORIGIN;
  if (!allowed) return {};
  const origin = req.headers.get("origin");
  if (!origin) return {};
  const list = allowed.split(",").map((s) => s.trim());
  if (allowed !== "*" && !list.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": allowed === "*" ? "*" : origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors(res: NextResponse, req: Request): NextResponse {
  const h = corsHeaders(req);
  for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
  return res;
}

export function optionsResponse(req: Request): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }), req);
}
