import { getClientIP } from "../utils/ip.js";

/**
 * IP allow/deny gate.
 *
 *   - If `deny` matches the client IP → 403.
 *   - If `allow` is provided and does NOT match → 403.
 *   - Otherwise returns `null` to continue the middleware chain.
 *
 * When the client IP cannot be determined from a trusted header (see
 * `getClientIP`), the gate fails CLOSED if `allow` is set, and OPEN if only
 * `deny` is set. Failing closed on `allow` prevents a bypass via missing
 * headers; failing open on `deny` matches the "block known-bad" intent.
 *
 * Pass `trustForwardedFor: false` if your environment doesn't strip inbound
 * `X-Forwarded-For` (otherwise an attacker can spoof their source IP).
 */
export function ipAccessControl(
  request: Request,
  options: {
    allow?: string[];
    deny?: string[];
    trustForwardedFor?: boolean;
  }
): Response | null {
  const ip = getClientIP(request, {
    trustForwardedFor: options.trustForwardedFor,
  });

  if (ip && options.deny?.includes(ip)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (options.allow) {
    if (!ip || !options.allow.includes(ip)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return null;
}
