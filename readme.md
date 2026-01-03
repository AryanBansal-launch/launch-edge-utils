# 🚀 Edge Utils for Contentstack Launch

[![npm version](https://img.shields.io/npm/v/@aryanbansal-launch/edge-utils.svg)](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive toolkit for [Contentstack Launch](https://www.contentstack.com/docs/developers/launch) (the high-performance frontend hosting service by [Contentstack](https://www.contentstack.com/)). This library provides production-ready utilities to simplify [Edge Functions](https://www.contentstack.com/docs/developers/launch/edge-functions) development, security, and performance optimization.

---

## ⚡ Quick Start (Recommended)

Bootstrap your edge environment in seconds using our automated initializer. Run this command from your **project root**:

```bash
# Install the package
npm install @aryanbansal-launch/edge-utils

# Initialize Edge Functions
npx create-launch-edge
```

This command will automatically create the `functions/` directory and a production-ready `[proxy].edge.js` boilerplate handler.

---

## ✨ Features & Deep Dive

### 🛡️ Security & Access Control
- **[Block AI Crawlers](https://www.contentstack.com/docs/developers/launch/blocking-ai-crawlers)**: Automatically detects and rejects requests from known scrapers (GPTBot, ClaudeBot, etc.) to protect your content and server resources.
- **[Restricted Default Domains](https://www.contentstack.com/docs/developers/launch/blocking-default-launch-domains-from-google-search)**: By default, Launch provides a `*.contentstackapps.com` domain. This utility forces visitors to your custom domain, which is essential for SEO (preventing duplicate content) and professional branding.
- **[IP Access Control](https://www.contentstack.com/docs/developers/launch/ip-based-access-control-using-edge-functions)**: Create a lightweight firewall at the edge to whitelist internal teams or block malicious IPs before they hit your application logic.
- **[Edge Auth](https://www.contentstack.com/docs/developers/launch/password-protection-for-environments)**: Implement [Basic Authentication](https://www.contentstack.com/docs/developers/launch/password-protection-for-environments) directly at the edge to protect staging environments or specific paths. (Note: Hashing is recommended for production environments).

### ⚛️ Next.js Optimization
- **[RSC Header Fix](https://www.contentstack.com/docs/developers/launch/handling-nextjs-rsc-issues-on-launch)**: Next.js React Server Components (RSC) use a special `rsc` header. Sometimes, proxies or caches can incorrectly serve RSC data when a full page load is expected. This utility detects these edge cases and strips the header to ensure the correct response type is served.

### 📍 Performance & Geo-Awareness
- **[Geo-Location Access](https://www.contentstack.com/docs/developers/launch/geolocation-headers-in-launch)**: Contentstack Launch injects geography data into request headers. This utility parses those headers into a clean object (`country`, `city`, `region`, etc.), enabling you to personalize content or restrict features based on user location.
- **[Cache Priming](https://www.contentstack.com/docs/developers/launch/cache-priming)**: Use the `launch-config` CLI to pre-load critical URLs into the edge cache, eliminating "cold start" latency for your first visitors after a deployment.

### 🔀 Smart Routing
- **Declarative Redirects**: Handle complex, logic-based redirects at runtime.
- **Runtime vs Config**: 
    - Use **`launch.json`** ([Static Redirects](https://www.contentstack.com/docs/developers/launch/edge-url-redirects)) for high-performance, simple path-to-path mapping.
    - Use **`redirectIfMatch`** (this library) for dynamic redirects that require logic, such as checking cookies, headers, or geo-location before redirecting.

---

## 🛠️ Detailed Usage Example

Your `functions/[proxy].edge.js` acts as a **middleware chain**. You can layer these utilities to create complex edge logic:

```javascript
import {
  blockDefaultDomains,
  handleNextJS_RSC,
  blockAICrawlers,
  ipAccessControl,
  protectWithBasicAuth,
  redirectIfMatch,
  getGeoHeaders,
  passThrough
} from "@aryanbansal-launch/edge-utils";

export default async function handler(request, context) {
  // 1. 🛡️ Force Custom Domain (SEO Best Practice)
  // Blocks access via *.contentstackapps.com
  const domainCheck = blockDefaultDomains(request);
  if (domainCheck) return domainCheck;

  // 2. ⚛️ Fix Next.js RSC Header issues 
  // Prevents "JSON-only" responses on page refreshes
  const rscCheck = await handleNextJS_RSC(request, {
    affectedPaths: ["/shop", "/about"]
  });
  if (rscCheck) return rscCheck;

  // 3. 🤖 Block Aggressive Bots
  const botCheck = blockAICrawlers(request);
  if (botCheck) return botCheck;

  // 4. 🧱 Firewall
  const ipCheck = ipAccessControl(request, { allow: ["203.0.113.10"] });
  if (ipCheck) return ipCheck;

  // 5. 🔐 Password Protection
  const auth = await protectWithBasicAuth(request, {
    hostnameIncludes: "staging.myapp.com",
    username: "admin",
    password: "securepassword123"
  });
  if (auth && auth.status === 401) return auth;

  // 6. 🔀 Logic-Based Redirects
  const redirect = redirectIfMatch(request, {
    path: "/legacy-page",
    to: "/new-page",
    status: 301
  });
  if (redirect) return redirect;

  // 7. 📍 Personalization
  const geo = getGeoHeaders(request);
  if (geo.country === "UK") {
    // Custom logic for UK visitors...
  }

  // 8. 🚀 Pass through to Origin
  return passThrough(request);
}
```

---

## ⚙️ Configuration CLI

Manage your `launch.json` file interactively to handle bulk settings:

```bash
npx launch-config
```

### Supported Settings:
- **Bulk Redirects**: Add multiple sources and destinations easily.
- **Rewrites**: Map internal paths to external APIs or micro-services.
- **Cache Priming**: Add a comma-separated list of URLs to warm up the CDN.

---

## 🌐 Platform Support

This library is exclusively optimized for **[Contentstack Launch](https://www.contentstack.com/docs/developers/launch)**. It assumes an environment where `Request`, `Response`, and standard Edge Global APIs are available.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
