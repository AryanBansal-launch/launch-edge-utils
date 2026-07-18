import type { EdgeCache, EdgeKVNamespace } from "../kv/types.js";

/** Default KV key under which the cache-priming URL list is stored. */
export const DEFAULT_CACHE_PRIMING_KEY = "cache:priming";

type Fetcher = (request: Request) => Promise<Response>;

/**
 * Read the cache-priming URL list from KV. Accepts either a bare JSON array
 * (`["/", "/about"]`) or the Launch config shape
 * (`{ "urls": ["/", "/about"] }`). Returns `[]` when missing/invalid.
 */
export async function loadCachePrimingUrls(
  kv: EdgeKVNamespace,
  key: string = DEFAULT_CACHE_PRIMING_KEY
): Promise<string[]> {
  const data = await kv.get<unknown>(key, "json");
  if (Array.isArray(data)) return data.filter((u): u is string => typeof u === "string");
  if (data && typeof data === "object" && Array.isArray((data as any).urls)) {
    return (data as any).urls.filter((u: unknown): u is string => typeof u === "string");
  }
  return [];
}

export interface PrimeResult {
  url: string;
  status: number;
  /**
   * Whether the Cache API actually **retained** the response. This is verified
   * with a follow-up `cache.match`, not merely inferred from a 2xx status — a
   * response that isn't cacheable per HTTP semantics (e.g. `Cache-Control:
   * no-cache`, or an already-expired `max-age=0`) is silently dropped by
   * `cache.put`, and reports `cached: false` here.
   */
  cached: boolean;
  error?: string;
}

/**
 * Warm the edge cache by fetching a list of URLs and storing successful
 * (2xx) GET responses in the Cache API. Mirrors Launch cache priming, and is
 * fully observable locally with Miniflare's `caches.default`.
 *
 * Cache keys are the *public* URLs (resolved against `keyBase`), so requests
 * arriving on that origin hit the primed entries. In local dev the backend
 * usually lives on a different origin, so `fetchBase` lets priming fetch from
 * the dev server while still keying by the public URL.
 *
 * @param options.urls      paths or absolute URLs to prime
 * @param options.cache     Cache API instance (e.g. `caches.default`)
 * @param options.keyBase   origin used to resolve relative URLs into cache keys
 * @param options.fetchBase origin to fetch from (defaults to `keyBase`)
 * @param options.fetcher   fetch implementation (defaults to global `fetch`)
 */
export async function primeCache(options: {
  urls: string[];
  cache: EdgeCache;
  keyBase?: string;
  fetchBase?: string;
  fetcher?: Fetcher;
}): Promise<PrimeResult[]> {
  const fetcher = options.fetcher ?? fetch;
  const fetchBase = options.fetchBase ?? options.keyBase;

  const results: PrimeResult[] = [];
  for (const url of options.urls) {
    const keyUrl = options.keyBase ? new URL(url, options.keyBase) : new URL(url);
    const fetchUrl = fetchBase ? new URL(url, fetchBase) : keyUrl;
    try {
      const res = await fetcher(new Request(fetchUrl.toString(), { method: "GET" }));
      let cached = false;
      if (res.ok) {
        await options.cache.put(keyUrl.toString(), res.clone());
        // Confirm the Cache API kept it — `put` silently drops responses that
        // aren't cacheable per HTTP semantics, so a 2xx is not enough.
        cached = (await options.cache.match(keyUrl.toString())) != null;
      }
      results.push({ url: keyUrl.toString(), status: res.status, cached });
    } catch (err) {
      results.push({
        url: keyUrl.toString(),
        status: 0,
        cached: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/** Convenience: load the priming URL list from KV, then prime the cache. */
export async function primeCacheFromKV(options: {
  kv: EdgeKVNamespace;
  cache: EdgeCache;
  key?: string;
  keyBase?: string;
  fetchBase?: string;
  fetcher?: Fetcher;
}): Promise<PrimeResult[]> {
  const urls = await loadCachePrimingUrls(options.kv, options.key);
  return primeCache({
    urls,
    cache: options.cache,
    keyBase: options.keyBase,
    fetchBase: options.fetchBase,
    fetcher: options.fetcher,
  });
}

/**
 * Serve a GET request from the Cache API when warm, otherwise fetch it and
 * populate the cache for next time. Adds an `X-Cache: HIT | MISS` header so
 * cache behaviour (and whether priming worked) is observable.
 *
 * Non-GET requests bypass the cache entirely.
 *
 * @param options.cache     Cache API instance (e.g. `caches.default`)
 * @param options.fetcher   fetch implementation (defaults to global `fetch`)
 * @param options.waitUntil optional `ctx.waitUntil` so the cache write can
 *                          outlive the response; awaited inline if omitted
 */
export async function serveWithCache(
  request: Request,
  options: {
    cache: EdgeCache;
    fetcher?: Fetcher;
    waitUntil?: (promise: Promise<unknown>) => void;
  }
): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;

  if (request.method !== "GET") {
    return fetcher(request);
  }

  const hit = await options.cache.match(request);
  if (hit) {
    return withCacheHeader(hit, "HIT");
  }

  const res = await fetcher(request);
  if (res.ok) {
    const write = options.cache.put(request, res.clone());
    if (options.waitUntil) options.waitUntil(write);
    else await write;
  }
  return withCacheHeader(res, "MISS");
}

function withCacheHeader(res: Response, state: "HIT" | "MISS"): Response {
  const headers = new Headers(res.headers);
  headers.set("X-Cache", state);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
