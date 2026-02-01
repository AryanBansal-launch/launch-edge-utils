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

${colors.bright}${colors.yellow}🛠️  CLI COMMANDS${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

  ${colors.cyan}npx create-launch-edge${colors.reset}
    Initialize edge functions with boilerplate code
    Creates: functions/[proxy].edge.js

  ${colors.cyan}npx launch-config${colors.reset}
    Interactive CLI to manage launch.json
    Configure: redirects, rewrites, cache priming

  ${colors.cyan}npx launch-help${colors.reset}
    Display this help guide

${colors.bright}${colors.yellow}📚 QUICK LINKS${colors.reset}
${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}

  ${colors.blue}Documentation:${colors.reset} https://github.com/AryanBansal-launch/launch-edge-utils
  ${colors.blue}NPM Package:${colors.reset}   https://www.npmjs.com/package/@aryanbansal-launch/edge-utils
  ${colors.blue}Launch Docs:${colors.reset}   https://www.contentstack.com/docs/developers/launch

${colors.dim}────────────────────────────────────────────────────────────────────${colors.reset}
`);

