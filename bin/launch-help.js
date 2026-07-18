#!/usr/bin/env node

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m'
};

console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗
║     🚀 Launch Edge Utils - Complete Reference Guide              ║
╚════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}${colors.yellow}📦 AVAILABLE METHODS${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

${colors.bright}${colors.green}1. Security & Access Control${colors.reset}

  ${colors.cyan}blockAICrawlers(request, bots?)${colors.reset}
    Block AI crawlers and bots from accessing your site
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - bots: string[] (optional) - Custom bot list
    ${colors.dim}Default Blocked Bots:${colors.reset}
      claudebot, gptbot, googlebot, bingbot, ahrefsbot,
      yandexbot, semrushbot, mj12bot, facebookexternalhit, twitterbot
    ${colors.dim}Returns:${colors.reset} Response | null
    ${colors.dim}Example:${colors.reset}
      const response = blockAICrawlers(request);
      if (response) return response;

  ${colors.cyan}blockDefaultDomains(request, options?)${colors.reset}
    Block access via default Launch domains (*.contentstackapps.com)
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - options: { domainToBlock?: string }
    ${colors.dim}Returns:${colors.reset} Response | null
    ${colors.dim}Example:${colors.reset}
      const response = blockDefaultDomains(request);
      if (response) return response;

  ${colors.cyan}ipAccessControl(request, options)${colors.reset}
    Whitelist or blacklist IPs at the edge
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - options: { allow?: string[], deny?: string[] }
    ${colors.dim}Returns:${colors.reset} Response | null
    ${colors.dim}Example:${colors.reset}
      const response = ipAccessControl(request, {
        allow: ["203.0.113.10", "198.51.100.5"]
      });
      if (response) return response;

  ${colors.cyan}protectWithBasicAuth(request, options)${colors.reset}
    Add Basic Authentication to protect staging/dev environments
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - options: {
          hostnameIncludes: string,
          username: string,
          password: string,
          realm?: string
        }
    ${colors.dim}Hostname match:${colors.reset} URL host, Host header, or X-Forwarded-Host
      (use with local Wrangler + rewriteRequestToOrigin)
    ${colors.dim}Returns:${colors.reset} Promise<Response> | null
    ${colors.dim}Example:${colors.reset}
      const auth = await protectWithBasicAuth(request, {
        hostnameIncludes: "staging.myapp.com",
        username: "admin",
        password: "securepass123"
      });
      if (auth && auth.status === 401) return auth;

${colors.bright}${colors.green}2. Routing & Redirects${colors.reset}

  ${colors.cyan}redirectIfMatch(request, options)${colors.reset}
    Conditional redirects based on path and method
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - options: {
          path: string,
          method?: string,
          to: string,
          status?: number
        }
    ${colors.dim}Returns:${colors.reset} Response | null
    ${colors.dim}Example:${colors.reset}
      const redirect = redirectIfMatch(request, {
        path: "/old-page",
        to: "/new-page",
        status: 301
      });
      if (redirect) return redirect;

${colors.bright}${colors.green}3. Next.js Optimization${colors.reset}

  ${colors.cyan}handleNextJS_RSC(request, options)${colors.reset}
    Fix Next.js React Server Components header issues
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - options: { affectedPaths: string[] }
    ${colors.dim}Returns:${colors.reset} Promise<Response> | null
    ${colors.dim}Example:${colors.reset}
      const rsc = await handleNextJS_RSC(request, {
        affectedPaths: ["/shop", "/about", "/products"]
      });
      if (rsc) return rsc;

${colors.bright}${colors.green}4. Geo-Location${colors.reset}

  ${colors.cyan}getGeoHeaders(request)${colors.reset}
    Extract geo-location data from Launch headers
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
    ${colors.dim}Returns:${colors.reset} {
      country: string | null,
      region: string | null,
      city: string | null,
      latitude: string | null,
      longitude: string | null
    }
    ${colors.dim}Example:${colors.reset}
      const geo = getGeoHeaders(request);
      if (geo.country === "US") {
        // Custom logic for US visitors
      }

  ${colors.cyan}getClientIP(request)${colors.reset}
    Get the client's IP address from Launch's forwarded headers
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
    ${colors.dim}Returns:${colors.reset} string | null

${colors.bright}${colors.green}5. Response Utilities${colors.reset}

  ${colors.cyan}jsonResponse(body, init?)${colors.reset}
    Create JSON responses easily
    ${colors.dim}Parameters:${colors.reset}
      - body: Record<string, unknown>
      - init: ResponseInit (optional)
    ${colors.dim}Returns:${colors.reset} Response
    ${colors.dim}Example:${colors.reset}
      return jsonResponse({ status: "ok", data: [...] });

  ${colors.cyan}passThrough(request)${colors.reset}
    Forward request to origin server
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
    ${colors.dim}Returns:${colors.reset} Promise<Response>
    ${colors.dim}Example:${colors.reset}
      return passThrough(request);

  ${colors.cyan}rewriteRequestToOrigin(request, backendOrigin)${colors.reset}
    Rewrite request URL to your local app (used by functions/dev-worker.edge.js)
    ${colors.dim}Parameters:${colors.reset}
      - request: Request object
      - backendOrigin: string (e.g. http://127.0.0.1:3000 from BACKEND_URL)
    ${colors.dim}Returns:${colors.reset} Request
    ${colors.dim}Note:${colors.reset} Sets X-Forwarded-Host when host changes (Basic Auth + localhost)

${colors.bright}${colors.green}6. Configuration${colors.reset}

  ${colors.cyan}generateLaunchConfig(options)${colors.reset}
    Generate launch.json configuration programmatically
    ${colors.dim}Parameters:${colors.reset}
      - options: {
          redirects?: LaunchRedirect[],
          rewrites?: LaunchRewrite[],
          cache?: { cachePriming?: { urls: string[] } }
        }
    ${colors.dim}Returns:${colors.reset} LaunchConfig
    ${colors.dim}Example:${colors.reset}
      const config = generateLaunchConfig({
        redirects: [{ source: "/old", destination: "/new", statusCode: 301 }],
        cache: { cachePriming: { urls: ["/", "/about"] } }
      });

${colors.bright}${colors.green}7. KV-backed config (local simulation / Workers deployment)${colors.reset}
  ${colors.dim}Same shape as launch.json, read from a KV namespace instead — emulated locally${colors.reset}
  ${colors.dim}by Miniflare (see LOCAL TESTING below), or a real namespace on Workers.${colors.reset}

  ${colors.cyan}redirectFromKV(request, { kv, key?, status? })${colors.reset}
    Read a redirect table from KV (default key "redirects"); returns a redirect
    Response on match (exact path or trailing /* wildcard), else null

  ${colors.cyan}rewriteFromKV(request, { kv, key? })${colors.reset}
    Read a rewrite table from KV (default key "rewrites"); returns a new Request
    with the path swapped (client URL unchanged) on match, else null

  ${colors.cyan}primeCache({ urls, cache, keyBase?, fetchBase?, fetcher? })${colors.reset}
  ${colors.cyan}primeCacheFromKV({ kv, cache, key?, ... })${colors.reset}
    Warm the Cache API by fetching a list of URLs (or the list stored in KV,
    default key "cache:priming") and storing cacheable responses

  ${colors.cyan}serveWithCache(request, { cache, fetcher?, waitUntil? })${colors.reset}
    Serve a GET from the Cache API when warm, else fetch and populate it;
    adds ${colors.dim}X-Cache: HIT | MISS${colors.reset}

  ${colors.cyan}matchRule(pathname, rules)${colors.reset}
    The shared exact/wildcard matcher behind redirectFromKV and rewriteFromKV

  ${colors.cyan}loadRedirects / loadRewrites / loadCachePrimingUrls${colors.reset}
    Lower-level readers returning parsed config from KV (empty on missing keys)

${colors.bright}${colors.yellow}🛠️  CLI COMMANDS${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

  ${colors.cyan}npx create-launch-edge${colors.reset}
    Initialize edge functions with boilerplate code
    Creates: functions/[proxy].edge.js (only if missing)

  ${colors.bright}${colors.magenta}npx launch-edge-quickstart${colors.reset}  ${colors.dim}← fastest way to try everything${colors.reset}
    One command: scaffold + seed local KV + run, with a status report
    Creates whatever's missing (handler, dev-worker, wrangler.toml, sample
    launch.json) — ${colors.bright}never${colors.reset} overwrites files you already have — seeds the
    local KV from launch.json, then starts the dev server (auto-primes cache)
    ${colors.dim}Extra args pass through:${colors.reset} --port 8788, --no-prime

  ${colors.cyan}npx launch-edge-local${colors.reset}
    Interactive wizard — pick a preset (see LOCAL TESTING below)
    ${colors.dim}Alias:${colors.reset} ${colors.cyan}npx create-launch-edge local${colors.reset}

  ${colors.cyan}npx launch-edge-seed-local${colors.reset}
    Seed the local (Miniflare) KV namespace from launch.json
    Writes keys: redirects, rewrites, cache:priming — re-run after editing launch.json

  ${colors.cyan}npx launch-edge-test-local${colors.reset}
    Starts ${colors.dim}wrangler dev${colors.reset} using the Wrangler bundled with this package
    Run from ${colors.bright}project root${colors.reset} (directory that contains wrangler.toml)
    Auto-primes the cache once ready (${colors.dim}GET /__prime${colors.reset}); pass --no-prime to skip
    ${colors.dim}Extra args pass through:${colors.reset} --port 8788, --var BACKEND_URL=http://127.0.0.1:5173

  ${colors.cyan}npx launch-config${colors.reset}
    Interactive CLI to manage launch.json
    Configure: redirects, rewrites, cache priming
    Supports bulk import from CSV/JSON files

  ${colors.cyan}npx launch-help${colors.reset}
    Display this help guide

${colors.bright}${colors.yellow}🧪 LOCAL TESTING (Wrangler / Miniflare)${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

  ${colors.bright}Fastest path${colors.reset}
    ${colors.cyan}npx launch-edge-quickstart${colors.reset}
    Scaffolds, seeds, and runs everything in one shot — see CLI COMMANDS above.

  ${colors.bright}Step-by-step (pick a specific preset)${colors.reset}
    1. ${colors.cyan}npx launch-edge-local${colors.reset}  → choose a preset 1–8, confirm overwrite if asked

       1) Redirect (code)     2) JSON route        3) Basic auth
       4) Block AI crawlers   5) Next.js RSC fix
       6) ${colors.magenta}KV redirects${colors.reset}         7) ${colors.magenta}KV rewrites${colors.reset}        8) ${colors.magenta}Cache priming${colors.reset}

       Presets 6–8 also write a sample launch.json and simulate it via a local
       KV namespace (functions/dev-worker.edge.js) — see KV-backed config above.

    2. For presets 1–5: start your app on the port in ${colors.dim}BACKEND_URL${colors.reset} (wrangler.toml; default 3000)
       For presets 6–8: ${colors.cyan}npx launch-edge-seed-local${colors.reset} (seed the local KV from launch.json)
    3. ${colors.cyan}npx launch-edge-test-local${colors.reset}
    4. Open the URL Wrangler prints (often ${colors.dim}http://localhost:8787${colors.reset}) + path from the wizard

  ${colors.bright}Quick checks${colors.reset}
    ${colors.dim}•${colors.reset} JSON preset: open /api/edge-ping
    ${colors.dim}•${colors.reset} Redirect preset: open the legacy path; expect 301
    ${colors.dim}•${colors.reset} Basic auth preset: browser prompt (e.g. demo / demo); use hostnameIncludes localhost
    ${colors.dim}•${colors.reset} Bots: ${colors.dim}curl -A "GPTBot" http://localhost:8787/${colors.reset} → 403
    ${colors.dim}•${colors.reset} KV redirects: /legacy/about → 301 to /about (wildcards: /old-shop/x → /shop/x)
    ${colors.dim}•${colors.reset} KV rewrites: /docs/intro serves /blog/intro, URL unchanged
    ${colors.dim}•${colors.reset} Cache priming: /about returns ${colors.dim}X-Cache: HIT${colors.reset} once warmed (needs Cache-Control on the response)

  ${colors.bright}Before publishing${colors.reset}  ${colors.dim}npm run build${colors.reset} in this package so dist/ matches src/

${colors.bright}${colors.yellow}📚 QUICK LINKS${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

  ${colors.blue}Documentation:${colors.reset} https://github.com/AryanBansal-launch/launch-edge-utils
  ${colors.blue}NPM Package:${colors.reset}   https://www.npmjs.com/package/@aryanbansal-launch/edge-utils
  ${colors.blue}Launch Docs:${colors.reset}   https://www.contentstack.com/docs/developers/launch

${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}
`);

