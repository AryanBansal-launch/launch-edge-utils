import {
  rewriteRequestToOrigin,
  redirectFromKV,
  rewriteFromKV,
  serveWithCache,
  primeCacheFromKV,
  jsonResponse,
  type EdgeKVNamespace,
} from "@aryanbansal-launch/edge-utils";
import handler from "./sample-handler.js";

type Env = {
  BACKEND_URL: string;
  // KV namespace bound in wrangler.toml, seeded by `npm run seed`.
  EDGE_CONFIG: EdgeKVNamespace;
};

// `caches` is a Workers/Miniflare global; declare it for local TS tooling.
declare const caches: { default: import("@aryanbansal-launch/edge-utils").EdgeCache };

// Set once per worker lifetime, so cache priming runs automatically in the
// background on the first request instead of waiting for a manual /__prime.
let primedOnce = false;

export default {
  async fetch(request: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const url = new URL(request.url);

    // Route every fetch (priming + serving) through the app handler. In local
    // dev the handler serves its own routes; unhandled paths pass through to
    // BACKEND_URL. In production this would fetch from the real origin.
    const origin = (req: Request) =>
      handler(rewriteRequestToOrigin(req, env.BACKEND_URL), {});

    // --- Admin: warm the cache from the KV priming list on demand ---
    if (url.pathname === "/__prime") {
      const primed = await primeCacheFromKV({
        kv: env.EDGE_CONFIG,
        cache: caches.default,
        keyBase: url.origin,
        fetcher: origin,
      });
      return jsonResponse({ primed });
    }

    // --- Auto-prime once, in the background, on the first served request ---
    if (!primedOnce) {
      primedOnce = true;
      ctx.waitUntil(
        primeCacheFromKV({
          kv: env.EDGE_CONFIG,
          cache: caches.default,
          keyBase: url.origin,
          fetcher: origin,
        })
      );
    }

    // --- 1. Redirects (KV-backed, exact + wildcard) ---
    const redirect = await redirectFromKV(request, { kv: env.EDGE_CONFIG });
    if (redirect) return redirect;

    // --- 2. Rewrites (KV-backed) — swap the path, keep the client URL ---
    const rewritten = await rewriteFromKV(request, { kv: env.EDGE_CONFIG });
    const effective = rewritten ?? request;

    // --- 3. Serve through the Cache API (primed entries return X-Cache: HIT) ---
    return serveWithCache(effective, {
      cache: caches.default,
      fetcher: origin,
      waitUntil: (p) => ctx.waitUntil(p),
    });
  },
};
