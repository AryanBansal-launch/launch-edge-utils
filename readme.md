# 🚀 Edge Utils for Contentstack Launch

[![npm version](https://img.shields.io/npm/v/@aryanbansal-launch/edge-utils.svg)](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive toolkit for [Contentstack Launch](https://www.contentstack.com/docs/developers/launch) (the high-performance frontend hosting service by [Contentstack](https://www.contentstack.com/)). This library provides production-ready utilities to simplify [Edge Functions](https://www.contentstack.com/docs/developers/launch/edge-functions) development, security, and performance optimization.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Usage Flow](#-usage-flow)
- [Complete API Reference](#-complete-api-reference)
- [Real-World Examples](#-real-world-examples)
- [CLI Commands](#-cli-commands)
- [Platform Support](#-platform-support)

---

## ⚡ Quick Start

### Step 1: Install the Package

```bash
npm install @aryanbansal-launch/edge-utils
```

### Step 2: Initialize Edge Functions

Run this command from your **project root** (where `package.json` is located):

```bash
npx create-launch-edge
```

This automatically creates:
- `functions/` directory
- `functions/[proxy].edge.js` with production-ready boilerplate

### Step 3: Customize & Deploy

1. Open `functions/[proxy].edge.js`
2. Customize the utilities based on your needs
3. Deploy to Contentstack Launch

**Need help?** Run:
```bash
npx launch-help
```

---

## 🔄 Usage Flow

### Understanding Edge Functions

Edge Functions in Contentstack Launch act as **middleware** that runs before requests reach your origin server. Think of them as a chain of checks and transformations:

```
User Request → Edge Function → Your Application
```

### Basic Pattern

Every utility follows this pattern:

```javascript
const result = utilityFunction(request, options);
if (result) return result;  // Early return if condition met
// Continue to next check...
```

### Complete Handler Example

Here's how utilities work together in `functions/[proxy].edge.js`:

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
  // 1️⃣ SECURITY LAYER
  // Block default domains (SEO best practice)
  const domainCheck = blockDefaultDomains(request);
  if (domainCheck) return domainCheck;

  // Block AI bots and crawlers
  const botCheck = blockAICrawlers(request);
  if (botCheck) return botCheck;

  // IP-based access control
  const ipCheck = ipAccessControl(request, {
    allow: ["203.0.113.10", "198.51.100.5"]
  });
  if (ipCheck) return ipCheck;

  // 2️⃣ AUTHENTICATION LAYER
  // Protect staging environments
  const auth = await protectWithBasicAuth(request, {
    hostnameIncludes: "staging.myapp.com",
    username: "admin",
    password: "securepass123"
  });
  if (auth && auth.status === 401) return auth;

  // 3️⃣ FRAMEWORK FIXES
  // Fix Next.js RSC header issues
  const rscCheck = await handleNextJS_RSC(request, {
    affectedPaths: ["/shop", "/products", "/about"]
  });
  if (rscCheck) return rscCheck;

  // 4️⃣ ROUTING LAYER
  // Handle redirects
  const redirect = redirectIfMatch(request, {
    path: "/old-page",
    to: "/new-page",
    status: 301
  });
  if (redirect) return redirect;

  // 5️⃣ PERSONALIZATION
  // Get user's location
  const geo = getGeoHeaders(request);
  if (geo.country === "US") {
    console.log(`US visitor from ${geo.city}, ${geo.region}`);
  }

  // 6️⃣ CUSTOM API ENDPOINTS
  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return jsonResponse({
      status: "healthy",
      region: geo.region,
      timestamp: Date.now()
    });
  }

  // 7️⃣ DEFAULT: Pass to origin
  return passThrough(request);
}
```

---

## 📚 Complete API Reference

### 🛡️ Security & Access Control

#### `blockAICrawlers(request, bots?)`

Block AI crawlers and bots from accessing your site.

**Parameters:**
- `request` (Request) - The incoming request object
- `bots` (string[], optional) - Custom list of bot user-agents to block

**Returns:** `Response | null`
- Returns `403 Forbidden` if bot detected
- Returns `null` if no bot detected (continue processing)

**Default Blocked Bots:**
The following bots are blocked by default (case-insensitive):
- `claudebot` - Anthropic's Claude AI crawler
- `gptbot` - OpenAI's GPT crawler
- `googlebot` - Google's web crawler
- `bingbot` - Microsoft Bing's crawler
- `ahrefsbot` - Ahrefs SEO crawler
- `yandexbot` - Yandex search engine crawler
- `semrushbot` - SEMrush SEO tool crawler
- `mj12bot` - Majestic SEO crawler
- `facebookexternalhit` - Facebook's link preview crawler
- `twitterbot` - Twitter's link preview crawler

**Example:**
```javascript
// Use default bot list
const response = blockAICrawlers(request);
if (response) return response;

// Custom bot list
const response = blockAICrawlers(request, [
  "gptbot",
  "claudebot",
  "my-custom-bot"
]);
if (response) return response;
```

**Use Cases:**
- Protect content from AI scraping
- Reduce server load from aggressive crawlers
- Comply with content usage policies

---

#### `blockDefaultDomains(request, options?)`

Block access via default Launch domains (`*.contentstackapps.com`).

**Parameters:**
- `request` (Request) - The incoming request object
- `options` (object, optional)
  - `domainToBlock` (string) - Custom domain to block (default: "contentstackapps.com")

**Returns:** `Response | null`
- Returns `403 Forbidden` if default domain detected
- Returns `null` if custom domain used

**Example:**
```javascript
// Block default Launch domain
const response = blockDefaultDomains(request);
if (response) return response;

// Block custom domain
const response = blockDefaultDomains(request, {
  domainToBlock: "myolddomain.com"
});
if (response) return response;
```

**Use Cases:**
- Force users to custom domain for SEO
- Prevent duplicate content indexing
- Professional branding

**Learn More:** [Blocking Default Launch Domains](https://www.contentstack.com/docs/developers/launch/blocking-default-launch-domains-from-google-search)

---

#### `ipAccessControl(request, options)`

Whitelist or blacklist IPs at the edge.

**Parameters:**
- `request` (Request) - The incoming request object
- `options` (object)
  - `allow` (string[], optional) - Whitelist of allowed IPs
  - `deny` (string[], optional) - Blacklist of denied IPs

**Returns:** `Response | null`
- Returns `403 Forbidden` if IP blocked
- Returns `null` if IP allowed

**Example:**
```javascript
// Whitelist specific IPs (only these can access)
const response = ipAccessControl(request, {
  allow: ["203.0.113.10", "198.51.100.5"]
});
if (response) return response;

// Blacklist specific IPs
const response = ipAccessControl(request, {
  deny: ["192.0.2.100", "192.0.2.101"]
});
if (response) return response;

// Combine both (deny takes precedence)
const response = ipAccessControl(request, {
  allow: ["203.0.113.0/24"],  // Allow subnet
  deny: ["203.0.113.50"]       // Except this one
});
if (response) return response;
```

**Use Cases:**
- Restrict admin panels to office IPs
- Block malicious IPs
- Create staging environment access control

**Learn More:** [IP-Based Access Control](https://www.contentstack.com/docs/developers/launch/ip-based-access-control-using-edge-functions)

---

#### `protectWithBasicAuth(request, options)`

Add Basic Authentication to protect environments.

**Parameters:**
- `request` (Request) - The incoming request object
- `options` (object)
  - `hostnameIncludes` (string) - Protect URLs containing this hostname
  - `username` (string) - Username for authentication
  - `password` (string) - Password for authentication
  - `realm` (string, optional) - Auth realm name (default: "Protected Area")

**Returns:** `Promise<Response> | null`
- Returns `401 Unauthorized` if auth fails
- Returns authenticated response if credentials valid
- Returns `null` if hostname doesn't match

**Example:**
```javascript
// Protect staging environment
const auth = await protectWithBasicAuth(request, {
  hostnameIncludes: "staging.myapp.com",
  username: "admin",
  password: "securepass123",
  realm: "Staging Environment"
});
if (auth && auth.status === 401) return auth;

// Protect specific path pattern
const url = new URL(request.url);
if (url.pathname.startsWith("/admin")) {
  const auth = await protectWithBasicAuth(request, {
    hostnameIncludes: url.hostname,
    username: "admin",
    password: "adminpass"
  });
  if (auth && auth.status === 401) return auth;
}
```

**Use Cases:**
- Protect staging/dev environments
- Quick password protection for demos
- Restrict access to admin areas

**Security Note:** For production, use proper authentication systems. Basic Auth credentials are base64-encoded, not encrypted.

**Learn More:** [Password Protection for Environments](https://www.contentstack.com/docs/developers/launch/password-protection-for-environments)

---

### 🔀 Routing & Redirects

#### `redirectIfMatch(request, options)`

Conditional redirects based on path and method.

**Parameters:**
- `request` (Request) - The incoming request object
- `options` (object)
  - `path` (string) - Path to match
  - `to` (string) - Destination path
  - `method` (string, optional) - HTTP method to match (e.g., "GET", "POST")
  - `status` (number, optional) - HTTP status code (default: 301)

**Returns:** `Response | null`
- Returns redirect response if path matches
- Returns `null` if no match

**Example:**
```javascript
// Simple redirect
const redirect = redirectIfMatch(request, {
  path: "/old-page",
  to: "/new-page",
  status: 301  // Permanent redirect
});
if (redirect) return redirect;

// Temporary redirect
const redirect = redirectIfMatch(request, {
  path: "/maintenance",
  to: "/coming-soon",
  status: 302  // Temporary redirect
});
if (redirect) return redirect;

// Method-specific redirect
const redirect = redirectIfMatch(request, {
  path: "/api/old-endpoint",
  method: "POST",
  to: "/api/v2/endpoint",
  status: 308  // Permanent redirect (preserves method)
});
if (redirect) return redirect;
```

**Use Cases:**
- SEO-friendly URL changes
- Migrate old URLs to new structure
- A/B testing redirects
- Maintenance mode redirects

**When to Use:**
- **Edge Functions (this utility)**: Dynamic redirects requiring logic (cookies, headers, geo)
- **launch.json**: Static path-to-path redirects (better performance)

**Learn More:** [Edge URL Redirects](https://www.contentstack.com/docs/developers/launch/edge-url-redirects)

---

### ⚛️ Next.js Optimization

#### `handleNextJS_RSC(request, options)`

Fix Next.js React Server Components header issues.

**Parameters:**
- `request` (Request) - The incoming request object
- `options` (object)
  - `affectedPaths` (string[]) - Array of paths with RSC issues

**Returns:** `Promise<Response> | null`
- Returns modified response if RSC issue detected
- Returns `null` if no issue

**Example:**
```javascript
// Fix specific pages
const rsc = await handleNextJS_RSC(request, {
  affectedPaths: ["/shop", "/products", "/about"]
});
if (rsc) return rsc;

// Fix all dynamic routes
const rsc = await handleNextJS_RSC(request, {
  affectedPaths: ["/blog", "/products", "/categories"]
});
if (rsc) return rsc;
```

**What It Does:**
Next.js RSC uses a special `rsc: 1` header. Sometimes, caches incorrectly serve RSC data (JSON) when a full page load is expected. This utility detects these cases and strips the header to ensure correct response type.

**Use Cases:**
- Fix "JSON showing instead of page" issues
- Resolve RSC caching problems
- Ensure proper page hydration

**Learn More:** [Handling Next.js RSC Issues](https://www.contentstack.com/docs/developers/launch/handling-nextjs-rsc-issues-on-launch)

---

### 📍 Geo-Location

#### `getGeoHeaders(request)`

Extract geo-location data from Launch headers.

**Parameters:**
- `request` (Request) - The incoming request object

**Returns:** Object with geo data
```typescript
{
  country: string | null,    // ISO country code (e.g., "US")
  region: string | null,     // Region/state code (e.g., "CA")
  city: string | null,       // City name (e.g., "San Francisco")
  latitude: string | null,   // Latitude coordinate
  longitude: string | null   // Longitude coordinate
}
```

**Example:**
```javascript
// Get user location
const geo = getGeoHeaders(request);

// Country-based logic
if (geo.country === "US") {
  console.log(`US visitor from ${geo.city}, ${geo.region}`);
}

// Region-specific content
if (geo.country === "US" && geo.region === "CA") {
  // Show California-specific content
}

// Distance-based logic
if (geo.latitude && geo.longitude) {
  const userLat = parseFloat(geo.latitude);
  const userLon = parseFloat(geo.longitude);
  // Calculate distance to store, etc.
}

// Redirect based on location
const geo = getGeoHeaders(request);
if (geo.country === "FR") {
  return Response.redirect("https://fr.mysite.com", 302);
}
```

**Use Cases:**
- Personalize content by location
- Show region-specific pricing
- Redirect to country-specific sites
- Display nearest store locations
- Comply with regional regulations

**Learn More:** [Geolocation Headers in Launch](https://www.contentstack.com/docs/developers/launch/geolocation-headers-in-launch)

---

### 📤 Response Utilities

#### `jsonResponse(body, init?)`

Create JSON responses easily.

**Parameters:**
- `body` (object) - JSON-serializable object
- `init` (ResponseInit, optional) - Additional response options (status, headers, etc.)

**Returns:** `Response` with `Content-Type: application/json`

**Example:**
```javascript
// Simple JSON response
return jsonResponse({ status: "ok", message: "Success" });

// With custom status
return jsonResponse(
  { error: "Not found" },
  { status: 404 }
);

// With custom headers
return jsonResponse(
  { data: [...] },
  {
    status: 200,
    headers: {
      "Cache-Control": "max-age=3600",
      "X-Custom-Header": "value"
    }
  }
);

// API endpoint example
const url = new URL(request.url);
if (url.pathname === "/api/user") {
  const geo = getGeoHeaders(request);
  return jsonResponse({
    user: "john_doe",
    location: {
      country: geo.country,
      city: geo.city
    },
    timestamp: Date.now()
  });
}
```

**Use Cases:**
- Create API endpoints at the edge
- Return structured error messages
- Build serverless functions

---

#### `passThrough(request)`

Forward request to origin server.

**Parameters:**
- `request` (Request) - The incoming request object

**Returns:** `Promise<Response>` from origin

**Example:**
```javascript
// Default: pass everything through
return passThrough(request);

// After all checks
export default async function handler(request, context) {
  // ... all your checks ...
  
  // If nothing matched, pass to origin
  return passThrough(request);
}
```

**Use Cases:**
- Default fallback after edge logic
- Forward requests that don't need edge processing

---

### ⚙️ Configuration

#### `generateLaunchConfig(options)`

Generate `launch.json` configuration programmatically.

**Parameters:**
- `options` (object)
  - `redirects` (LaunchRedirect[], optional)
  - `rewrites` (LaunchRewrite[], optional)
  - `cache` (object, optional)
    - `cachePriming` (object)
      - `urls` (string[])

**Returns:** `LaunchConfig` object

**Types:**
```typescript
interface LaunchRedirect {
  source: string;
  destination: string;
  statusCode?: number;
  response?: {
    headers?: Record<string, string>;
  };
}

interface LaunchRewrite {
  source: string;
  destination: string;
}
```

**Example:**
```javascript
import { generateLaunchConfig } from "@aryanbansal-launch/edge-utils";
import fs from "fs";

const config = generateLaunchConfig({
  redirects: [
    {
      source: "/old-blog/:slug",
      destination: "/blog/:slug",
      statusCode: 301
    },
    {
      source: "/products",
      destination: "/shop",
      statusCode: 308
    }
  ],
  rewrites: [
    {
      source: "/api/:path*",
      destination: "https://api.mybackend.com/:path*"
    }
  ],
  cache: {
    cachePriming: {
      urls: ["/", "/about", "/products", "/contact"]
    }
  }
});

// Write to launch.json
fs.writeFileSync("launch.json", JSON.stringify(config, null, 2));
```

**Use Cases:**
- Generate config from CMS data
- Automate bulk redirects
- Dynamic configuration management

---

## 🎯 Real-World Examples

### Example 1: E-Commerce Site

```javascript
export default async function handler(request, context) {
  const url = new URL(request.url);
  const geo = getGeoHeaders(request);

  // 1. Block bots to reduce costs
  const botCheck = blockAICrawlers(request);
  if (botCheck) return botCheck;

  // 2. Geo-based redirects
  if (geo.country === "UK" && !url.hostname.includes("uk.")) {
    return Response.redirect(`https://uk.myshop.com${url.pathname}`, 302);
  }

  // 3. Maintenance mode for specific regions
  if (geo.country === "US" && url.pathname.startsWith("/checkout")) {
    return jsonResponse(
      { error: "Checkout temporarily unavailable in your region" },
      { status: 503 }
    );
  }

  // 4. Product redirects
  const redirect = redirectIfMatch(request, {
    path: "/products/old-sku-123",
    to: "/products/new-sku-456",
    status: 301
  });
  if (redirect) return redirect;

  return passThrough(request);
}
```

### Example 2: Multi-Environment Setup

```javascript
export default async function handler(request, context) {
  const url = new URL(request.url);

  // 1. Protect staging with Basic Auth
  if (url.hostname.includes("staging")) {
    const auth = await protectWithBasicAuth(request, {
      hostnameIncludes: "staging",
      username: "team",
      password: process.env.STAGING_PASSWORD || "defaultpass"
    });
    if (auth && auth.status === 401) return auth;
  }

  // 2. Restrict dev environment to office IPs
  if (url.hostname.includes("dev")) {
    const ipCheck = ipAccessControl(request, {
      allow: ["203.0.113.0/24"]  // Office IP range
    });
    if (ipCheck) return ipCheck;
  }

  // 3. Block default domain on production
  if (url.hostname.includes("myapp.com")) {
    const domainCheck = blockDefaultDomains(request);
    if (domainCheck) return domainCheck;
  }

  return passThrough(request);
}
```

### Example 3: Next.js App with API Routes

```javascript
export default async function handler(request, context) {
  const url = new URL(request.url);
  const geo = getGeoHeaders(request);

  // 1. Fix RSC issues on dynamic pages
  const rscCheck = await handleNextJS_RSC(request, {
    affectedPaths: ["/blog", "/products", "/categories"]
  });
  if (rscCheck) return rscCheck;

  // 2. Edge API endpoints
  if (url.pathname === "/api/geo") {
    return jsonResponse({
      country: geo.country,
      region: geo.region,
      city: geo.city
    });
  }

  if (url.pathname === "/api/health") {
    return jsonResponse({
      status: "healthy",
      timestamp: Date.now(),
      region: geo.region
    });
  }

  // 3. Block bots from expensive pages
  if (url.pathname.startsWith("/search")) {
    const botCheck = blockAICrawlers(request);
    if (botCheck) return botCheck;
  }

  return passThrough(request);
}
```

---

## 🛠️ CLI Commands

### `npx create-launch-edge`

Initialize edge functions with production-ready boilerplate.

**What it does:**
1. Checks you're in project root (where `package.json` exists)
2. Creates `functions/` directory if needed
3. Generates `functions/[proxy].edge.js` with example code

**Usage:**
```bash
cd /path/to/your/project
npx create-launch-edge
```

**Output:**
```
🚀 create-launch-edge: Contentstack Launch Initializer

✨ New: Created /functions directory
✨ New: Created /functions/[proxy].edge.js

🎉 Setup Complete!

Next Steps:
1. Open functions/[proxy].edge.js
2. Customize your redirects, auth, and RSC paths
3. Deploy your project to Contentstack Launch
```

---

### `npx launch-config`

Interactive CLI to manage `launch.json` configuration.

**What it does:**
- Add/manage redirects
- Configure rewrites
- Set up cache priming URLs
- Preserves existing configuration

**Usage:**
```bash
npx launch-config
```

**Interactive Prompts:**
```
🚀 Launch Configuration Generator

Do you want to add a Redirect? (y/n): y
   Source path (e.g., /source): /old-page
   Destination path (e.g., /destination): /new-page
   Status code (default 308): 301
   ✔ Redirect added.

Do you want to add a Redirect? another? (y/n): n

Do you want to add a Rewrite? (y/n): y
   Source path (e.g., /api/*): /api/*
   Destination URL: https://backend.myapp.com/api/*
   ✔ Rewrite added.

Do you want to add Cache Priming URLs? (y/n): y
Note: Only relative paths are supported. No Regex/Wildcards.
Enter URLs separated by commas (e.g., /home,/about,/shop): /,/about,/products

✅ Successfully updated launch.json!
```

**Learn More:**
- [Static Redirects](https://www.contentstack.com/docs/developers/launch/edge-url-redirects)
- [Cache Priming](https://www.contentstack.com/docs/developers/launch/cache-priming)

---

### `npx launch-help`

Display complete reference guide with all methods and examples.

**Usage:**
```bash
npx launch-help
```

**Shows:**
- All available methods with parameters
- Return types and examples
- CLI commands
- Quick links to documentation

---

## 🌐 Platform Support

This library is exclusively optimized for **[Contentstack Launch](https://www.contentstack.com/docs/developers/launch)**. It assumes an environment where:
- Standard Web APIs (`Request`, `Response`, `fetch`) are available
- Edge runtime environment
- Contentstack Launch geo-location headers

**Not compatible with:**
- Node.js servers
- Traditional hosting platforms
- Other edge platforms (Cloudflare Workers, Vercel Edge, etc.)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

**Repository:** https://github.com/AryanBansal-launch/launch-edge-utils

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🔗 Useful Links

- **[Contentstack Launch Documentation](https://www.contentstack.com/docs/developers/launch)**
- **[Edge Functions Guide](https://www.contentstack.com/docs/developers/launch/edge-functions)**
- **[NPM Package](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)**
- **[GitHub Repository](https://github.com/AryanBansal-launch/launch-edge-utils)**

---

**Made with ❤️ for the Contentstack Launch community**
