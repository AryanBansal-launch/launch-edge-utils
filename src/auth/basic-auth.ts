/**
 * Constant-time string comparison. Returns true iff `a` and `b` are equal.
 * Compares the full length of `max(a, b)` so timing does not leak the length
 * of the shorter string.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    const x = i < aBytes.length ? aBytes[i] : 0;
    const y = i < bBytes.length ? bBytes[i] : 0;
    diff |= x ^ y;
  }
  return diff === 0;
}

/**
 * Gate a host (or subset of hosts) behind HTTP Basic Auth at the edge.
 *
 * Returns:
 *   - `Promise<Response>` with status 401 when the host matches and credentials
 *     are missing/invalid. Return this directly from your handler.
 *   - `null` when the host does not match, OR when credentials are valid.
 *     Continue your middleware chain in that case (e.g. fall through to
 *     `passThrough(request)`).
 *
 * Host matching checks `URL.hostname`, the `Host` header, and `X-Forwarded-Host`
 * (which `rewriteRequestToOrigin` sets during local Wrangler/Miniflare dev).
 */
export function protectWithBasicAuth(
  request: Request,
  options: {
    hostnameIncludes: string;
    username: string;
    password: string;
    realm?: string;
  }
): Promise<Response> | null {
  const url = new URL(request.url);
  const hostHeader = request.headers.get("host")?.split(":")[0] ?? "";
  const forwardedHost =
    request.headers.get("x-forwarded-host")?.split(":")[0] ?? "";
  const hostMatches =
    url.hostname.includes(options.hostnameIncludes) ||
    hostHeader.includes(options.hostnameIncludes) ||
    forwardedHost.includes(options.hostnameIncludes);
  if (!hostMatches) {
    return null;
  }

  const authHeader = request.headers.get("Authorization");

  const challenge = () =>
    Promise.resolve(
      new Response("Authentication Required", {
        status: 401,
        headers: {
          "WWW-Authenticate": `Basic realm="${options.realm ?? "Protected Area"}"`,
          "Content-Type": "text/plain",
        },
      })
    );

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return challenge();
  }

  let decoded: string;
  try {
    decoded = atob(authHeader.slice("Basic ".length).trim());
  } catch {
    return challenge();
  }

  // Per RFC 7617, the password may contain `:`. Split on the first colon only.
  const sep = decoded.indexOf(":");
  if (sep === -1) return challenge();
  const username = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);

  // Always run both compares so total time is independent of which one failed.
  const userOk = timingSafeEqual(username, options.username);
  const passOk = timingSafeEqual(password, options.password);
  if (userOk && passOk) {
    // Credentials valid — let the rest of the middleware chain run.
    return null;
  }

  return challenge();
}
