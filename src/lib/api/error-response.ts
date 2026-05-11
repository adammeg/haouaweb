import { NextResponse } from "next/server";

/**
 * Centralised 500 handler for API routes.
 *
 * - Logs the full error (message + stack) server-side so it is visible in
 *   the runtime logs of the host (Vercel Functions dashboard, Docker stdout,
 *   etc.).
 * - Returns a stable, opaque payload to the client. We never leak internal
 *   error messages (e.g. "MONGODB_URI is not set", DB host names, jose
 *   crypto errors) to end users.
 *
 * Usage:
 *   try { ... } catch (e) { return serverError("auth.login", e); }
 */
type ErrorOptions = {
  status?: number;
  token?: string;
};

function logServerSide(scope: string, error: unknown): void {
  const isErr = error instanceof Error;
  const message = isErr ? error.message : String(error);
  const stack = isErr ? error.stack : undefined;
  console.error(`[api:${scope}] ${message}`);
  if (stack) console.error(stack);
}

export function serverError(
  scope: string,
  error: unknown,
  opts: ErrorOptions = {},
): NextResponse {
  logServerSide(scope, error);
  return NextResponse.json(
    { error: opts.token ?? "server_error" },
    { status: opts.status ?? 500 },
  );
}

export function dbError(scope: string, error: unknown): NextResponse {
  return serverError(scope, error, { status: 503, token: "db_error" });
}

export function upstreamError(scope: string, error: unknown): NextResponse {
  return serverError(scope, error, { status: 502, token: "upstream_error" });
}
