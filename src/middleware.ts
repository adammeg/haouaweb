import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function middleware(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const u = new URL("/login", request.url);
    u.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(u);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const u = new URL("/login", request.url);
    u.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(u);
  }
}

export const config = {
  matcher: [
    "/dossier/:path*",
    "/dashboard/:path*",
    "/salle-attente/:path*",
    "/agenda/:path*",
    "/rappels/:path*",
    "/settings/:path*",
    "/assist/:path*",
    "/scores/:path*",
    "/partogramme/:path*",
    "/certificats/:path*",
    "/pma/:path*",
    "/courbes/:path*",
    "/protocoles/:path*",
    "/documents/:path*",
    "/bridge/:path*",
  ],
};
