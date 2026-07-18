import { jsonResponse, passThrough } from "@aryanbansal-launch/edge-utils";

/**
 * Minimal Launch-style handler for local Miniflare testing.
 *
 * It serves a few routes itself (with a unique per-response token) so that
 * cache HIT/MISS and rewrites are observable without a separate dev server.
 * Unhandled paths fall through to the origin via `passThrough`.
 */
export default async function handler(request: Request, _context: unknown) {
  const url = new URL(request.url);
  const token = crypto.randomUUID();

  if (url.pathname === "/api/edge-ping") {
    return jsonResponse({
      ok: true,
      source: "edge-utils-example",
      path: url.pathname,
    });
  }

  // Simple HTML routes. The token differs on every fresh render, so a cached
  // response is visibly identical while a fresh one changes.
  const html = (title: string) =>
    new Response(
      `<!doctype html><title>${title}</title><h1>${title}</h1><p>token: ${token}</p>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          // The Cache API only retains responses that are cacheable per HTTP
          // semantics — without this, `cache.put` is a silent no-op.
          "Cache-Control": "public, max-age=3600",
        },
      }
    );

  switch (url.pathname) {
    case "/":
      return html("Home");
    case "/about":
      return html("About");
    default:
      if (url.pathname.startsWith("/blog/") || url.pathname.startsWith("/shop/")) {
        return html(`Page ${url.pathname}`);
      }
  }

  return passThrough(request);
}
