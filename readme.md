# 🚀 Edge Utils for Contentstack Launch

[![npm version](https://img.shields.io/npm/v/@aryanbansal-launch/edge-utils.svg)](https://www.npmjs.com/package/@aryanbansal-launch/edge-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, high-performance toolkit specifically designed for **Contentstack Launch Edge Functions**. Speed up your development with production-ready utilities for security, authentication, routing, and Next.js compatibility—all optimized to run at the edge.

---

## ✨ Features

- 🛡️ **Security First**: Block AI crawlers and manage IP access with ease.
- 🔐 **Edge Auth**: Implement Basic Auth directly at the edge for specific hostnames.
- 📍 **Geo-Aware**: Easily extract location data from request headers.
- ⚛️ **Next.js Ready**: Built-in fixes for RSC header issues on Launch proxies.
- 🚀 **Cache Priming**: Easily manage cache warming URLs via CLI.
- 🔀 **Smart Routing**: Declarative redirects based on path and method.
- ⚡ **Zero Dependencies**: Lightweight and optimized for edge runtime limits.

---

## ⚡ Quick Start (Recommended)

Set up your entire edge environment in seconds with our automated CLI tool.

### 1. Install
```bash
npm install @aryanbansal-launch/edge-utils
```

### 2. Initialize
Run this command from your **project root**:
```bash
npx launch-init
```
This will automatically create the `functions/` directory and a boilerplate `[proxy].edge.js` handler for you.

### 3. Configure (Optional)
Manage your `launch.json` ([Redirects](https://www.contentstack.com/docs/developers/launch/edge-url-redirects), [Rewrites](https://www.contentstack.com/docs/developers/launch/edge-url-rewrites), and [Cache Priming](https://www.contentstack.com/docs/developers/launch/cache-priming)) interactively:
```bash
npx launch-config
```

---

## 🛠️ Usage Example

Once initialized, your `functions/[proxy].edge.js` will look like a powerful middleware chain:

```javascript
import {
  jsonResponse,
  passThrough,
  redirectIfMatch,
  protectWithBasicAuth,
  ipAccessControl,
  blockAICrawlers,
  blockDefaultDomains,
  getGeoHeaders,
  handleNextJS_RSC
} from "@aryanbansal-launch/edge-utils";

export default async function handler(request, context) {
  // 1. 🛡️ Block access via default Launch domains
  const defaultDomainResponse = blockDefaultDomains(request);
  if (defaultDomainResponse) return defaultDomainResponse;

  // 2. ⚛️ Fix Next.js RSC issues for specific paths
  const rscResponse = await handleNextJS_RSC(request, {
    affectedPaths: ["/shop", "/about"]
  });
  if (rscResponse) return rscResponse;

  // 3. 🤖 Block AI bots immediately
  const botResponse = blockAICrawlers(request);
  if (botResponse) return botResponse;

  // 4. 🧱 IP Whitelisting
  const ipResponse = ipAccessControl(request, { allow: ["203.0.113.10"] });
  if (ipResponse) return ipResponse;

  // 5. 🔐 Domain-specific Basic Auth (e.g., for staging)
  const authResponse = await protectWithBasicAuth(request, {
    hostnameIncludes: "staging.myapp.com",
    username: "admin",
    password: "securepassword123"
  });
  if (authResponse && authResponse.status === 401) return authResponse;

  // 6. 🔀 SEO-friendly Redirects
  const redirectResponse = redirectIfMatch(request, {
    path: "/legacy-url",
    to: "/modern-url",
    status: 301
  });
  if (redirectResponse) return redirectResponse;

  // 7. 📍 Geo-Location Access
  const geo = getGeoHeaders(request);
  console.log(`Request from ${geo.city}, ${geo.country}`);

  // 8. 🚀 Pass through to origin
  return passThrough(request);
}
```

---

## 📖 API Reference

### 🛡️ Security
- **`blockAICrawlers(request, bots?)`**: Detects and blocks known AI crawlers (GPTBot, ClaudeBot, etc.) based on the User-Agent.
- **`blockDefaultDomains(request, { domainToBlock? })`**: Prevents users from accessing your site via the default `*.contentstackapps.com` domains, forcing them to use your custom domain.
- **`ipAccessControl(request, { allow?, deny? })`**: A simple firewall to whitelist or blacklist specific IP addresses at the edge.

### 🔐 Authentication
- **`protectWithBasicAuth(request, options)`**: Prompt for credentials based on hostname.

### 🔀 Redirection
- **`redirectIfMatch(request, options)`**: Perform SEO-friendly redirects at the edge.

### 📍 Geo Location
- **`getGeoHeaders(request)`**: Returns an object with `country`, `region`, `city`, `latitude`, `longitude`.

### ⚛️ Next.js
- **`handleNextJS_RSC(request, { affectedPaths })`**: Resolves RSC header issues on Contentstack Launch.

---

## 🌐 Platform Support

This library is exclusively optimized for **[Contentstack Launch](https://www.contentstack.com/docs/developers/launch)**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
