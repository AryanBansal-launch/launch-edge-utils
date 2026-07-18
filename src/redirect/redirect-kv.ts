import type { EdgeKVNamespace } from "../kv/types.js";
import type { LaunchRedirect } from "../launch/config.js";
import { matchRule } from "../utils/match-rule.js";

/** Default KV key under which the redirect table is stored. */
export const DEFAULT_REDIRECTS_KEY = "redirects";

/**
 * Read the redirect table from KV. Returns `[]` if the key is missing or the
 * stored value isn't a JSON array (so a mis-seeded namespace fails open rather
 * than throwing at request time).
 */
export async function loadRedirects(
  kv: EdgeKVNamespace,
  key: string = DEFAULT_REDIRECTS_KEY
): Promise<LaunchRedirect[]> {
  const data = await kv.get<LaunchRedirect[]>(key, "json");
  return Array.isArray(data) ? data : [];
}

/**
 * Look up the request's pathname against a redirect table stored in KV and,
 * on a match, return a `Response.redirect(...)`. Returns `null` otherwise.
 *
 * Mirrors how Launch applies its bulk redirect config at the edge, but sourced
 * from a KV namespace so it can be simulated locally with Miniflare/Wrangler.
 *
 * Supports exact and trailing `/*` wildcard sources (see `matchRule`). A
 * matched rule's `response.headers` are attached to the redirect response.
 *
 * @param options.kv      KV namespace holding the redirect table
 * @param options.key     KV key (default `"redirects"`)
 * @param options.status  fallback status when a rule omits `statusCode` (default 301)
 */
export async function redirectFromKV(
  request: Request,
  options: {
    kv: EdgeKVNamespace;
    key?: string;
    status?: number;
  }
): Promise<Response | null> {
  const rules = await loadRedirects(options.kv, options.key);
  if (rules.length === 0) return null;

  const url = new URL(request.url);
  const match = matchRule(url.pathname, rules);
  if (!match) return null;

  const status = match.rule.statusCode ?? options.status ?? 301;
  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(match.destination);
  const target = isAbsolute
    ? match.destination
    : new URL(match.destination, url).toString();

  const headers = new Headers(match.rule.response?.headers);
  headers.set("Location", target);
  return new Response(null, { status, headers });
}
