/**
 * Resolves the client IP from a request.
 *
 * Order of preference (most trustworthy first):
 *   1. `CF-Connecting-IP` — set directly by Cloudflare's edge (Launch runs on Cloudflare).
 *      This header cannot be spoofed by the client; Cloudflare overwrites it on ingress.
 *   2. `True-Client-IP` — set by Cloudflare Enterprise / some CDNs.
 *   3. `X-Real-IP` — typically set by a single trusted reverse proxy.
 *   4. `X-Forwarded-For` — only used as a last resort, and only the LEFTMOST entry,
 *      which represents the originating client per RFC 7239. This header IS spoofable
 *      if your environment doesn't strip inbound XFF, so callers running outside
 *      Cloudflare/Launch should pass `trustForwardedFor: false`.
 *
 * @param request   incoming request
 * @param options.trustForwardedFor  default `true`; set to `false` to refuse XFF entirely
 * @returns the client IP, or `null` if none could be resolved from a trusted header
 */
export function getClientIP(
  request: Request,
  options: { trustForwardedFor?: boolean } = {}
): string | null {
  const { trustForwardedFor = true } = options;

  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const trueClient = request.headers.get("true-client-ip");
  if (trueClient) return trueClient.trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();

  if (trustForwardedFor) {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  return null;
}
