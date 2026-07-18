# 🚀 Edge Utils for Contentstack Launch

[![npm version](https://img.shields.io/npm/v/@aryanbansal-launch/edge-utils.svg)](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready toolkit for [Contentstack Launch](https://www.contentstack.com/docs/developers/launch) Edge Functions — security, auth, routing, Next.js fixes, and geo-awareness, plus a full local dev/test setup so you can try everything before you deploy.

---

## ⚡ Try it in one command

```bash
npm install @aryanbansal-launch/edge-utils
npx launch-edge-quickstart
```

That's it. This one command scaffolds an edge function, sets up a local KV store to simulate Launch's redirect/rewrite/cache-priming config, seeds it with sample data, and starts a local dev server — printing exactly what's configured and what URL to try for each feature:

```
Ready — here's what's configured

  ✔ Redirects  2 rule(s) configured
      curl -i http://localhost:8787/legacy/about  → 301 to /about
  ✔ Rewrites  2 rule(s) configured
      curl --compressed http://localhost:8787/home  → serves /, URL unchanged
  ✔ Cache priming  2 URL(s), auto-primed on startup
      curl -i http://localhost:8787/  → X-Cache: HIT once warmed
```

Run it again any time — it never overwrites files you already have (your handler, your `launch.json`), it only fills in what's missing. See [Local testing](#-local-testing) for the full picture, or jump to [Table of contents](#-table-of-contents).

---

## 📋 Table of contents

- [Try it in one command](#-try-it-in-one-command) — the fastest path
- [Features](#-features)
- [Use this in production](#-use-this-in-production) — add utilities to your real edge handler
- [Local testing](#-local-testing) — quickstart, step-by-step, and how KV/cache simulation works
- [Config-driven redirects (`launch.json`)](#-config-driven-redirects-launchjson)
- [Writing a handler](#-writing-a-handler)
- [API Reference](#-api-reference)
- [CLI Commands](#-cli-commands)
- [Platform Support](#-platform-support)

---

## ✨ Features

- 🛡️ **Security** — block AI crawlers, IP allow/deny lists, block default Launch domains
- 🔐 **Edge Auth** — Basic Auth for specific hostnames (e.g. staging)
- 📍 **Geo-Aware** — read country/region/city from Launch's geo headers
- ⚛️ **Next.js Ready** — fixes for RSC header issues on Launch proxies
- 🔀 **Routing** — code-level conditional redirects, plus config-driven redirects/rewrites via `launch.json`
- 🧪 **Full local dev setup** — run your edge function *and* simulate Launch's redirect/rewrite/cache-priming config, entirely offline (Wrangler + Miniflare, no Cloudflare account)
- ⚡ **Lean** — no runtime deps in the code you import at the edge; Wrangler is bundled so local testing needs no separate install

---

## 🎯 Use this in production

Add one or more helpers to your real Contentstack Launch edge handler.

```bash
npm install @aryanbansal-launch/edge-utils
npx create-launch-edge          # scaffolds functions/[proxy].edge.js if it doesn't exist
```

Then import what you need and wire it into your handler — each utility returns a `Response` on match (return it immediately) or `null` (fall through to the next check):

```javascript
import { blockAICrawlers, redirectIfMatch, passThrough } from "@aryanbansal-launch/edge-utils";

export default async function handler(request, context) {
  const botCheck = blockAICrawlers(request);
  if (botCheck) return botCheck;

  const redirect = redirectIfMatch(request, { path: "/old-page", to: "/new-page", status: 301 });
  if (redirect) return redirect;

  return passThrough(request);
}
```

Deploy through Contentstack Launch as usual — it runs `functions/[proxy].edge.js` at the edge before traffic reaches your app. See [Writing a handler](#-writing-a-handler) for a fuller example and the [API Reference](#-api-reference) for every utility.

---

## 🧪 Local testing

Test redirects, rewrites, cache priming, and your handler's own logic **on your machine**, without deploying. Wrangler's dev server runs on **Miniflare**, a Workers-compatible runtime — no Cloudflare account, no network calls.

### The fast way

```bash
npx launch-edge-quickstart
```

Non-interactively creates whatever's missing — `functions/[proxy].edge.js` (a self-contained demo handler, if you don't have one yet), `functions/dev-worker.edge.js` (the local KV-aware shim), `wrangler.toml`, and a sample `launch.json` — **never** overwrites an existing handler or config, seeds the local KV, prints a status report with copy-pasteable `curl` commands per feature, then starts the dev server (which auto-primes the cache once ready).

Pass through `wrangler dev` args as usual: `npx launch-edge-quickstart --port 8788`. Add `--no-prime` to skip the automatic startup cache warm-up. Edit `launch.json` and re-run the same command any time to pick up changes.

Try it:

```bash
curl -i http://localhost:8787/legacy/about        # redirect: 301 -> /about
curl -i http://localhost:8787/old-shop/tees/blue  # wildcard redirect: 301 -> /shop/tees/blue
curl    http://localhost:8787/home                # rewrite: serves /, URL unchanged
curl -i http://localhost:8787/about                # X-Cache: HIT (auto-primed on startup)
```

### If you want your own edge function's logic instead

Already have `functions/[proxy].edge.js` with your own code (auth, geo, bot-block, etc.)? Quickstart leaves it completely untouched — it only adds the KV plumbing *around* it. If you'd rather test **only your handler**, with no KV/redirect/rewrite/cache involved at all, remove the `[[kv_namespaces]]` block from `wrangler.toml` — with no KV bound, `dev-worker.edge.js` becomes a pure passthrough to your handler, no cache headers, no KV reads.

### Step-by-step (more control)

Use this instead of the one-shot command if you want to pick a specific preset via a wizard, or run scaffold/seed/serve as separate steps.

```bash
npx launch-edge-local          # interactive wizard — pick a preset (see below)
npx launch-edge-seed-local     # seed the local KV from launch.json
npx launch-edge-test-local     # start the dev server
```

`npx launch-edge-local` shows a numbered menu:

| # | Preset | Try |
|---|---|---|
| 1 | Redirect (code-level) | `/legacy-demo` → 301 |
| 2 | JSON edge route | `/api/edge-ping` |
| 3 | Basic auth | prompts for `demo`/`demo` |
| 4 | Block AI crawlers | `curl -A "GPTBot" ...` → 403 |
| 5 | Next.js RSC fix | strips RSC header on configured paths |
| 6 | **KV redirects** | `/legacy/about` → 301 (from `launch.json`) |
| 7 | **KV rewrites** | `/docs/intro` serves `/blog/intro` |
| 8 | **Cache priming** | `/__prime` warms the cache, then `/about` is `X-Cache: HIT` |

Presets 6–8 also write a sample `launch.json`. If `functions/[proxy].edge.js` already exists you're asked before it's overwritten — say no to keep your own handler; the KV logic lives in `dev-worker.edge.js` regardless.

Align `BACKEND_URL` in `wrangler.toml` with your app's dev server (default `http://127.0.0.1:3000`) if your handler passes requests through to a real backend.

### How the KV simulation works

`launch.json` — the same file you deploy — is the single source of truth for redirects, rewrites, and cache priming. Locally, it's seeded into a **Miniflare-emulated KV namespace** (`EDGE_CONFIG`) so your setup can read it exactly as Launch would in production:

- **`functions/[proxy].edge.js`** — your real handler. Deploys to Launch unchanged; never touched by the KV tooling.
- **`functions/dev-worker.edge.js`** — a **local-dev-only shim** that reads `EDGE_CONFIG`, applies redirects/rewrites/cache priming, then delegates everything else to your handler. It's feature-detected (`if (env.EDGE_CONFIG)`), so with no KV bound it's just a plain rewrite-to-origin dev worker.
- **Cache priming runs automatically** — on startup (once the dev server reports ready) and again in the background on the first request served, mirroring how Launch warms pages after a deploy. `GET /__prime` remains available to re-trigger manually.

For the full mental model (two-layer worker design, request lifecycle, KV/cache persistence, diagrams), see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

### Caveats

- **Cacheability**: the Cache API only retains responses that are cacheable per HTTP semantics — a response with no `Cache-Control` header is silently dropped, so cache priming won't show a `HIT` for it. Set `Cache-Control` on routes you want cached.
- **Fidelity**: local KV/cache is functional, not timing-accurate — it won't reproduce real KV propagation delay or edge cache tiering.
- **Persist dir**: `launch-edge-seed-local` and `launch-edge-test-local` both default to `.wrangler-local`; if you override one with `--persist-to`, override the other the same way.
- **Hostname rules** (`protectWithBasicAuth`): matching checks both the request URL host and the `Host` header, so `hostnameIncludes: "localhost"` works locally even though the rewritten request points at `127.0.0.1`.
- **Geo/IP headers**: Miniflare doesn't inject Cloudflare's `cf` metadata, so `getGeoHeaders`/`getClientIP` may return empty values locally unless you set headers yourself.

See [`examples/local-dev/`](examples/local-dev/) for a minimal runnable project with the KV simulation wired up (`npm install`, then `npm start`).

---

## ⚙️ Config-driven redirects (`launch.json`)

For static, predictable redirects/rewrites/cache priming that don't need request-time logic, skip the edge function entirely — `launch.json` at your project root is read directly by Launch.

```bash
npx launch-config
```

Interactively add redirects (one-by-one or bulk import from CSV/JSON), rewrites, and cache-priming URLs. See [`npx launch-config` bulk import formats](#npx-launch-config-bulk-import-formats) below for the file formats. Test it locally the same way as the edge function — see [Local testing](#-local-testing) above.

**Config vs. edge function** — use `launch.json` for bulk, static rules (hundreds of SEO redirects, simple path changes); use the edge function for anything that needs request data (cookies, geo, A/B tests, headers). They compose: keep static rules in `launch.json`, dynamic logic in `functions/[proxy].edge.js`.

You can also generate `launch.json` in code with `generateLaunchConfig` — see the [API Reference](#-api-reference).

---

## 🔄 Writing a handler

Edge Functions run as **middleware** before requests reach your origin: `User Request → Edge Function → Your Application`. Every utility follows the same pattern — call it, return its result if truthy, otherwise keep going:

```javascript
import {
  blockDefaultDomains,
  handleNextJS_RSC,
  blockAICrawlers,
  ipAccessControl,
  protectWithBasicAuth,
  redirectIfMatch,
  getGeoHeaders,
  jsonResponse,
  passThrough
} from "@aryanbansal-launch/edge-utils";

export default async function handler(request, context) {
  // Security
  const domainCheck = blockDefaultDomains(request);
  if (domainCheck) return domainCheck;

  const botCheck = blockAICrawlers(request);
  if (botCheck) return botCheck;

  const ipCheck = ipAccessControl(request, { allow: ["203.0.113.10", "198.51.100.5"] });
  if (ipCheck) return ipCheck;

  // Auth
  const auth = await protectWithBasicAuth(request, {
    hostnameIncludes: "staging.myapp.com",
    username: "admin",
    password: "securepass123"
  });
  if (auth && auth.status === 401) return auth;

  // Framework fixes
  const rscCheck = await handleNextJS_RSC(request, { affectedPaths: ["/shop", "/products", "/about"] });
  if (rscCheck) return rscCheck;

  // Routing
  const redirect = redirectIfMatch(request, { path: "/old-page", to: "/new-page", status: 301 });
  if (redirect) return redirect;

  // Personalization
  const geo = getGeoHeaders(request);
  if (geo.country === "US") console.log(`US visitor from ${geo.city}, ${geo.region}`);

  // Custom API endpoint
  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return jsonResponse({ status: "healthy", region: geo.region, timestamp: Date.now() });
  }

  // Default: pass to origin
  return passThrough(request);
}
```

---

## 📚 API Reference

### 🛡️ Security & Access Control

#### `blockAICrawlers(request, bots?)`
Blocks common AI/SEO crawlers by user-agent. `bots` (string[], optional) overrides the default list (`claudebot`, `gptbot`, `googlebot`, `bingbot`, `ahrefsbot`, `yandexbot`, `semrushbot`, `mj12bot`, `facebookexternalhit`, `twitterbot`, case-insensitive). Returns `403 Response` on match, `null` otherwise.
```javascript
const response = blockAICrawlers(request);           // default list
if (response) return response;

const response = blockAICrawlers(request, ["gptbot", "my-custom-bot"]);  // custom list
```

#### `blockDefaultDomains(request, options?)`
Blocks access via the default Launch domain (`*.contentstackapps.com`) so search engines only index your custom domain. `options.domainToBlock` (string, optional) overrides the default. Returns `403 Response` on match, `null` otherwise.
```javascript
const response = blockDefaultDomains(request);
if (response) return response;
```
[Learn more](https://www.contentstack.com/docs/developers/launch/blocking-default-launch-domains-from-google-search)

#### `ipAccessControl(request, { allow?, deny? })`
IP allow/deny list. `deny` takes precedence over `allow`. Returns `403 Response` if blocked, `null` if allowed.
```javascript
const response = ipAccessControl(request, { allow: ["203.0.113.0/24"], deny: ["203.0.113.50"] });
if (response) return response;
```
[Learn more](https://www.contentstack.com/docs/developers/launch/ip-based-access-control-using-edge-functions)

#### `protectWithBasicAuth(request, { hostnameIncludes, username, password, realm? })`
Basic Auth gate for a specific hostname. `hostnameIncludes` matches against the request URL hostname, the `Host` header, or `X-Forwarded-Host` (useful locally, since `rewriteRequestToOrigin` sets that header). Returns `401 Response` on failed/missing auth, `null` if `hostnameIncludes` doesn't match (chain continues).
```javascript
const auth = await protectWithBasicAuth(request, {
  hostnameIncludes: "staging.myapp.com",
  username: "admin",
  password: "securepass123"
});
if (auth && auth.status === 401) return auth;
```
Not for production-grade security — Basic Auth credentials are base64-encoded, not encrypted. [Learn more](https://www.contentstack.com/docs/developers/launch/password-protection-for-environments)

---

### 🔀 Routing & Redirects

#### `redirectIfMatch(request, { path, to, method?, status? })`
Code-level conditional redirect. Returns a redirect `Response` if `request` matches `path` (and `method`, if given), else `null`. `status` defaults to `301`.
```javascript
const redirect = redirectIfMatch(request, { path: "/old-page", to: "/new-page", status: 301 });
if (redirect) return redirect;
```
[Learn more](https://www.contentstack.com/docs/developers/launch/edge-url-redirects) · For bulk/static redirects without code, see [`launch.json`](#-config-driven-redirects-launchjson).

---

### ⚛️ Next.js

#### `handleNextJS_RSC(request, { affectedPaths })`
Fixes a class of Next.js React Server Components bugs where a cache incorrectly serves RSC JSON data instead of a full page load, by stripping the offending header on the paths you list.
```javascript
const rsc = await handleNextJS_RSC(request, { affectedPaths: ["/shop", "/products", "/about"] });
if (rsc) return rsc;
```
[Learn more](https://www.contentstack.com/docs/developers/launch/handling-nextjs-rsc-issues-on-launch)

---

### 📍 Geo-Location

#### `getGeoHeaders(request)`
Reads Launch's geo headers. Returns `{ country, region, city, latitude, longitude }` (all `string | null`).
```javascript
const geo = getGeoHeaders(request);
if (geo.country === "FR") return Response.redirect("https://fr.mysite.com", 302);
```
[Learn more](https://www.contentstack.com/docs/developers/launch/geolocation-headers-in-launch)

#### `getClientIP(request)`
Returns the client's IP address from Launch's forwarded headers.

---

### 📤 Response Utilities

#### `jsonResponse(body, init?)`
Builds a `Response` with `Content-Type: application/json`. `init` (status/headers) merges in as usual.
```javascript
return jsonResponse({ status: "ok" });
return jsonResponse({ error: "Not found" }, { status: 404 });
```

#### `passThrough(request)`
Forwards the request to the origin — equivalent to `fetch(request)`. The typical default/fallback at the end of a handler chain.

---

### ⚙️ Configuration

#### `generateLaunchConfig({ redirects?, rewrites?, cache? })`
Builds a `LaunchConfig` object in code, so you can generate `launch.json` programmatically (e.g. from CMS data) instead of using the interactive CLI.
```typescript
interface LaunchRedirect { source: string; destination: string; statusCode?: number; response?: { headers?: Record<string, string> } }
interface LaunchRewrite { source: string; destination: string }
```
```javascript
import { generateLaunchConfig } from "@aryanbansal-launch/edge-utils";
import fs from "fs";

const config = generateLaunchConfig({
  redirects: [{ source: "/old-blog/:slug", destination: "/blog/:slug", statusCode: 301 }],
  rewrites: [{ source: "/api/:path*", destination: "https://api.mybackend.com/:path*" }],
  cache: { cachePriming: { urls: ["/", "/about", "/products"] } }
});

fs.writeFileSync("launch.json", JSON.stringify(config, null, 2));
```

---

### 🗄️ KV-backed config (local simulation / Workers deployment)

These read the same redirect/rewrite/cache-priming shape as `launch.json`, but from a KV namespace — emulated locally by Miniflare (see [Local testing](#-local-testing)), or a real namespace if you deploy this pattern to Cloudflare Workers directly.

- **`redirectFromKV(request, { kv, key?, status? })`** — reads a redirect table from KV (default key `"redirects"`), returns a redirect `Response` on match (exact path or trailing `/*` wildcard), else `null`.
- **`rewriteFromKV(request, { kv, key? })`** — reads a rewrite table from KV (default key `"rewrites"`), returns a new `Request` with the path swapped (client URL unchanged) on match, else `null`.
- **`primeCache({ urls, cache, keyBase?, fetchBase?, fetcher? })`** / **`primeCacheFromKV({ kv, cache, key?, ... })`** — warms the Cache API by fetching a list of URLs (or the list stored in KV, default key `"cache:priming"`) and storing cacheable responses.
- **`serveWithCache(request, { cache, fetcher?, waitUntil? })`** — serves a GET from the Cache API when warm, else fetches and populates it; adds `X-Cache: HIT | MISS`.
- **`matchRule(pathname, rules)`** — the shared exact/wildcard matcher behind the two helpers above.
- **`loadRedirects` / `loadRewrites` / `loadCachePrimingUrls`** — lower-level readers returning parsed config from KV (empty array on missing/invalid keys).

### 🧰 Local development

- **`rewriteRequestToOrigin(request, backendOrigin)`** — builds a new `Request` pointed at `backendOrigin`, preserving path/query/body. Used internally by `functions/dev-worker.edge.js` so `passThrough` reaches your local app.

---

## 🛠️ CLI Commands

| Command | Purpose |
|---|---|
| `npx create-launch-edge` | Scaffold `functions/[proxy].edge.js` (production handler) and local-dev files. Creates only what's missing. |
| `npx launch-edge-quickstart` | **One command**: scaffold + seed + run the whole local KV/cache setup. See [Local testing](#-local-testing). |
| `npx launch-edge-local` | Interactive wizard — pick a preset (code or KV) and scaffold for it. |
| `npx launch-edge-seed-local` | Seed the local KV namespace from `launch.json`. |
| `npx launch-edge-test-local` | Start the local dev server (`wrangler dev`), with automatic cache priming. |
| `npx launch-config` | Interactive editor for `launch.json` — redirects, rewrites, cache priming, with CSV/JSON bulk import. |
| `npx launch-help` | Print a full reference of methods and CLI commands. |

All local-dev commands run from your project root and accept extra flags passed through to `wrangler dev` (e.g. `--port 8788`).

### `npx launch-config` bulk import formats

**CSV** (`redirects.csv`):
```csv
source,destination,statusCode
/old-blog/post-1,/blog/post-1,301
/products/old-sku-123,/products/new-sku-456,308
/legacy/*,/new/*,301
```

**JSON** (`redirects.json`):
```json
[
  { "source": "/old-blog/post-1", "destination": "/blog/post-1", "statusCode": 301 },
  { "source": "/products/old-sku-123", "destination": "/products/new-sku-456", "statusCode": 308 }
]
```

Ready-to-use templates: [`examples/redirects.csv`](examples/redirects.csv), [`examples/redirects.json`](examples/redirects.json).

---

## 🌐 Platform Support

Built for **[Contentstack Launch](https://www.contentstack.com/docs/developers/launch)** — assumes standard Web APIs (`Request`, `Response`, `fetch`), an edge runtime, and Launch's geo-location headers.

Not intended for Node.js servers, traditional hosting, or other edge platforms (Cloudflare Workers, Vercel Edge, etc.) — though the KV-backed helpers happen to work anywhere Workers-style KV/Cache APIs are available, since that's what powers the local simulation.

---

## 🤝 Contributing

Contributions welcome — please open an issue or pull request.

**Repository:** https://github.com/AryanBansal-launch/launch-edge-utils

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

## 🔗 Useful Links

- **[Contentstack Launch Documentation](https://www.contentstack.com/docs/developers/launch)**
- **[Edge Functions Guide](https://www.contentstack.com/docs/developers/launch/edge-functions)**
- **[NPM Package](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)**
- **[GitHub Repository](https://github.com/AryanBansal-launch/launch-edge-utils)**
- **[Architecture: Local Edge Dev Setup](ARCHITECTURE.md)** — deep dive into how local testing, KV simulation, and cache priming work internally

---

**Made with ❤️ for the Contentstack Launch community**
