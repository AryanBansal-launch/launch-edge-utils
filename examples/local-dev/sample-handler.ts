import { jsonResponse, passThrough } from "@aryanbansal-launch/edge-utils";

/**
 * Minimal Launch-style handler for local Miniflare testing.
 */
export default async function handler(request: Request, _context: unknown) {
  const url = new URL(request.url);

  if (url.pathname === "/api/edge-ping") {
    return jsonResponse({
      ok: true,
      source: "edge-utils-example",
      path: url.pathname,
    });
  }

  return passThrough(request);
}
