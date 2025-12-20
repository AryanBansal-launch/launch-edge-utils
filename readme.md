# 🚀 Edge Utils

[![npm version](https://img.shields.io/npm/v/@launch/edge-utils.svg)](https://www.npmjs.com/package/@launch/edge-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform Support](https://img.shields.io/badge/Platform-Edge-blueviolet.svg)](#platform-support)

A lightweight, developer-friendly toolkit for **Edge Computing**. Speed up your development on platforms like Cloudflare Workers, Vercel Edge, and Contentstack Launch with production-ready utilities for security, authentication, and routing.

---

## ✨ Features

- 🛡️ **Security First**: Block AI crawlers and manage IP access with ease.
- 🔐 **Edge Auth**: Implement Basic Auth directly at the edge for specific hostnames.
- 📍 **Geo-Aware**: Easily extract location data from request headers.
- ⚛️ **Next.js Ready**: Built-in fixes for RSC header issues on edge proxies.
- 🔀 **Smart Routing**: Declarative redirects based on path and method.
- ⚡ **Zero Dependencies**: Lightweight and optimized for edge runtime limits.

---

## 📦 Installation

```bash
npm install @launch/edge-utils
```

---

## ⚡ Quick Start (Automatic Setup)

If you are using **Contentstack Launch**, you can automatically set up your edge function directory and boilerplate handler with a single command:

```bash
npx launch-init
```

This command will:
1. Create a `functions/` directory in your project root.
2. Generate a `[proxy].edge.js` file with a production-ready boilerplate.

---

## 🛠️ Usage Example

Transform your edge handler into a powerful middleware chain:

```typescript
import {
  jsonResponse,
  passThrough,
  redirectIfMatch,
  protectWithBasicAuth,
  ipAccessControl,
  blockAICrawlers,
  getGeoHeaders,
  handleNextJS_RSC
} from "@launch/edge-utils";

export default async function handler(request: Request) {
  // 1. ⚛️ Fix Next.js RSC issues for specific paths
  const rscResponse = await handleNextJS_RSC(request, {
    affectedPaths: ["/my-rsc-page", "/another-page"]
  });
  if (rscResponse) return rscResponse;

  // 2. 🛡️ Block AI bots immediately
  const botResponse = blockAICrawlers(request);
  if (botResponse) return botResponse;

  // 2. 🧱 IP Whitelisting
  const ipResponse = ipAccessControl(request, { allow: ["203.0.113.10"] });
  if (ipResponse) return ipResponse;

  // 3. 🔐 Domain-specific Basic Auth
  const authResponse = await protectWithBasicAuth(request, {
    hostnameIncludes: "staging.myapp.com",
    username: "admin",
    password: "securepassword123"
  });
  if (authResponse && authResponse.status === 401) return authResponse;

  // 4. 🔀 SEO-friendly Redirects
  const redirectResponse = redirectIfMatch(request, {
    path: "/legacy-url",
    to: "/modern-url",
    status: 301
  });
  if (redirectResponse) return redirectResponse;

  // 5. 📍 Geo-Location Access
  const geo = getGeoHeaders(request);
  if (geo.country === "US") {
    console.log(`User from ${geo.city}, ${geo.region}`);
  }

  // 6. 📤 Custom JSON Responses
  if (new URL(request.url).pathname === "/api/health") {
    return jsonResponse({ status: "healthy", region: geo.region });
  }

  // 7. 🚀 Pass through to origin
  return passThrough(request);
}
```

---

## 📖 API Reference

### 🛡️ Security

#### `blockAICrawlers`
Blocks common AI crawlers (GPTBot, ClaudeBot, etc.) to protect your content from scraping.
- **Parameters**: `request: Request`, `bots?: string[]` (optional list to override defaults)
- **Returns**: `Response` (403) or `null`.

#### `ipAccessControl`
Simple firewall for your edge function.
- **Options**:
  - `allow`: Array of IPs allowed to access.
  - `deny`: Array of IPs to block.
- **Returns**: `Response` (403) or `null`.

### 🔐 Authentication

#### `protectWithBasicAuth`
Prompt for credentials based on the hostname.
- **Options**:
  - `hostnameIncludes`: Match substring in hostname (e.g., ".dev").
  - `username`: Required username.
  - `password`: Required password.
  - `realm`: Optional realm name for the auth prompt.
- **Returns**: `Promise<Response>` or `null`.

### 🔀 Redirection

#### `redirectIfMatch`
Perform redirects directly at the edge to reduce latency.
- **Options**:
  - `path`: The path to match.
  - `method`: HTTP method to match (optional, defaults to any).
  - `to`: Target path or URL.
  - `status`: HTTP status code (default: 301).
- **Returns**: `Response` (Redirect) or `null`.

### 📍 Geo Location

#### `getGeoHeaders`
Extracts geo-information provided by edge platform headers.
- **Returns**: Object with `country`, `region`, `city`, `latitude`, `longitude`.

### ⚛️ Next.js

#### `handleNextJS_RSC`
Handles Next.js React Server Component (RSC) header issues on Contentstack Launch. It detects requests to "affected paths" that have the `rsc` header but lack the `_rsc` query parameter, and strips the header to prevent proxy/caching issues.
- **Options**:
  - `affectedPaths`: Array of pathnames (e.g., `['/shop', '/about']`) where this fix should apply.
- **Returns**: `Promise<Response>` (the re-fetched request without RSC header) or `null`.

---

## 🌐 Platform Support

Optimized for:
- [Contentstack Launch](https://www.contentstack.com/docs/developers/launch)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Cloudflare Workers](https://workers.cloudflare.com/)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
