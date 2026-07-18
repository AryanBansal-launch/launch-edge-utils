# Local Edge dev with simulated KV

Runs the edge worker on **Miniflare** (via `wrangler dev`) with a **local KV
namespace** that stands in for the Launch config store. This lets you exercise
KV-backed **redirects**, **rewrites**, and **cache priming** entirely offline —
no Cloudflare account, no deployed config.

## Quick start

```bash
npm install
npm start        # seeds local KV, then starts wrangler dev
```

`npm start` = `npm run seed && npm run dev`. Run them separately if you prefer:

```bash
npm run seed     # load *.json into local KV (re-run after editing them)
npm run dev      # wrangler dev on the same persist dir
```

Both share the persist directory `.wrangler-local`, so the worker reads exactly
what the seed step wrote.

## Config files (seeded into KV)

| File | KV key | Used by |
|------|--------|---------|
| `redirects.json`     | `redirects`     | `redirectFromKV` |
| `rewrites.json`      | `rewrites`      | `rewriteFromKV` |
| `cache-priming.json` | `cache:priming` | `primeCacheFromKV` |

Edit any file, run `npm run seed` again, and the worker picks up the change.

## Try it (server prints its port, e.g. `http://localhost:8787`)

```bash
# Redirects (exact + wildcard, from KV)
curl -i http://localhost:8787/legacy/about         # 301 -> /about
curl -i http://localhost:8787/old-shop/tees/blue   # 301 -> /shop/tees/blue

# Rewrites (path swapped, client URL unchanged)
curl http://localhost:8787/docs/intro              # serves /blog/intro
curl http://localhost:8787/home                    # serves /

# Cache priming
curl http://localhost:8787/__prime                 # warm cache from KV list
curl -i http://localhost:8787/about                # X-Cache: HIT (primed)
curl -i http://localhost:8787/shop/hats            # X-Cache: MISS, then HIT
```

## Notes

- **Cacheability is enforced.** The Cache API only retains responses that are
  cacheable per HTTP semantics, so the handler sets `Cache-Control` on the
  routes it serves. A response without cache headers is a silent no-op for
  `cache.put` — same as production.
- **`BACKEND_URL`** (in `wrangler.toml`) is where unhandled paths pass through.
  The sample handler serves `/`, `/about`, `/blog/*`, `/shop/*` itself, so no
  separate dev server is needed for those; other paths require a backend on
  that origin.
- **Fidelity.** Local KV/Cache emulation is functional, not timing-accurate —
  it won't reproduce real KV propagation delay or edge cache tiering.
