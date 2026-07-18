/**
 * Minimal structural types for the pieces of the Cloudflare Workers runtime
 * we rely on, so this library doesn't need `@cloudflare/workers-types` as a
 * dependency. They're intentionally a subset of the real interfaces — just
 * enough for the redirect/rewrite/cache-priming helpers.
 *
 * At runtime these are satisfied by:
 *   - a KV binding declared in `wrangler.toml` (`[[kv_namespaces]]`), and
 *   - `caches.default` (the Cache API), both emulated locally by Miniflare.
 */

/** Subset of Cloudflare's `KVNamespace` used to read/write JSON config. */
export interface EdgeKVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: "text"): Promise<string | null>;
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

/** Subset of the Cache API (`caches.default`) used for cache priming. */
export interface EdgeCache {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
  delete(request: Request | string): Promise<boolean>;
}
