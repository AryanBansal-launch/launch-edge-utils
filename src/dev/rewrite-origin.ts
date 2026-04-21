/**
 * Rewrites the request URL so its origin (and optional path prefix from `backendOrigin`)
 * points at your local app. Use with Wrangler / Miniflare so `passThrough(request)` and
 * other `fetch(request)` calls reach the dev server instead of the Worker dev port.
 *
 * When the incoming host differs from the backend host, sets `X-Forwarded-Host` to the
 * original `incoming.host` (unless already present) so helpers like `protectWithBasicAuth`
 * can still match `localhost` while the URL points at `127.0.0.1`.
 */
export function rewriteRequestToOrigin(
  request: Request,
  backendOrigin: string
): Request {
  const base = new URL(backendOrigin);
  const incoming = new URL(request.url);
  const prefix =
    base.pathname === "/" ? "" : base.pathname.replace(/\/$/, "");
  const path = `${prefix}${incoming.pathname}${incoming.search}${incoming.hash}`;
  const target = new URL(path, base.origin);

  const headers = new Headers(request.headers);
  if (incoming.hostname !== target.hostname && !headers.has("x-forwarded-host")) {
    headers.set("x-forwarded-host", incoming.host);
  }

  return new Request(target.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: request.redirect,
    ...(request.body != null ? { duplex: "half" as const } : {}),
  });
}
