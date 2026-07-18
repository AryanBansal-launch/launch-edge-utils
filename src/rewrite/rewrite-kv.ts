import type { EdgeKVNamespace } from "../kv/types.js";
import type { LaunchRewrite } from "../launch/config.js";
import { matchRule } from "../utils/match-rule.js";

/** Default KV key under which the rewrite table is stored. */
export const DEFAULT_REWRITES_KEY = "rewrites";

/**
 * Read the rewrite table from KV. Returns `[]` if the key is missing or the
 * stored value isn't a JSON array.
 */
export async function loadRewrites(
  kv: EdgeKVNamespace,
  key: string = DEFAULT_REWRITES_KEY
): Promise<LaunchRewrite[]> {
  const data = await kv.get<LaunchRewrite[]>(key, "json");
  return Array.isArray(data) ? data : [];
}

/**
 * Look up the request's pathname against a rewrite table stored in KV. On a
 * match, return a *new* `Request` whose pathname is swapped to the
 * destination while the origin, query string and hash are preserved — the
 * client URL doesn't change, unlike a redirect. Returns `null` on no match.
 *
 * Pass the returned request to `passThrough(...)` (and, in local dev, through
 * `rewriteRequestToOrigin(...)`) to fetch the rewritten path from your origin.
 *
 * Supports exact and trailing `/*` wildcard sources (see `matchRule`). A
 * relative destination is resolved against the request origin; an absolute
 * destination URL is used as the new request target as-is.
 *
 * @param options.kv   KV namespace holding the rewrite table
 * @param options.key  KV key (default `"rewrites"`)
 */
export async function rewriteFromKV(
  request: Request,
  options: {
    kv: EdgeKVNamespace;
    key?: string;
  }
): Promise<Request | null> {
  const rules = await loadRewrites(options.kv, options.key);
  if (rules.length === 0) return null;

  const url = new URL(request.url);
  const match = matchRule(url.pathname, rules);
  if (!match) return null;

  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(match.destination);
  const target = isAbsolute
    ? new URL(match.destination)
    : new URL(match.destination, url);

  if (!isAbsolute) {
    // Preserve the caller's query/hash across the internal path swap.
    target.search = url.search;
    target.hash = url.hash;
  }

  return new Request(target.toString(), request);
}
