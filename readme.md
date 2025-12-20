# Edge Utils

A collection of high-performance utilities designed for Edge Computing environments (like Cloudflare Workers, Vercel Edge Functions, or Contentstack Launch). These utilities help you handle common tasks like authentication, security, redirection, and geo-location directly at the edge.

## Table of Contents

- [Installation](#installation)
- [Usage Example](#usage-example)
- [API Reference](#api-reference)
  - [Security](#security)
  - [Authentication](#authentication)
  - [Redirection](#redirection)
  - [Geo Location](#geo-location)
  - [Responses](#responses)

## Installation

Install the package via npm:

```bash
npm install @launch/edge-utils
```

## Usage Example

Here is a comprehensive example of how to use multiple utilities in a single edge handler:

```typescript
import {
  jsonResponse,
  passThrough,
  redirectIfMatch,
  protectWithBasicAuth,
  ipAccessControl,
  blockAICrawlers,
  getGeoHeaders
} from "@launch/edge-utils";

export default async function handler(request: Request) {
  // 1. Block known AI crawlers and bots
  const botResponse = blockAICrawlers(request);
  if (botResponse) return botResponse;

  // 2. IP-based access control
  const ipResponse = ipAccessControl(request, { allow: ["203.0.113.10"] });
  if (ipResponse) return ipResponse;

  // 3. Basic Authentication for specific hostnames
  const authResponse = await protectWithBasicAuth(request, {
    hostnameIncludes: "test-protected-domain.dev",
    username: "admin",
    password: "securepassword"
  });
  if (authResponse && authResponse.status === 401) return authResponse;

  // 4. Conditional Redirection
  const redirectResponse = redirectIfMatch(request, {
    path: "/old-page",
    method: "GET",
    to: "/new-page"
  });
  if (redirectResponse) return redirectResponse;

  // 5. Handle specific routes
  if (new URL(request.url).pathname === "/api/status") {
    return jsonResponse({ status: "ok", timestamp: new Date() });
  }

  // 6. Access Geo-location headers
  const geo = getGeoHeaders(request);
  console.log("Request from country:", geo.country);

  // 7. Pass through the request if no utility intercepted it
  return passThrough(request);
}
```

## API Reference

### Security

#### `blockAICrawlers(request: Request, bots?: string[]): Response | null`
Blocks common AI crawlers (like GPTBot, ClaudeBot) based on the `User-Agent` header. Returns a `403 Forbidden` response if a bot is detected, otherwise returns `null`.

#### `ipAccessControl(request: Request, options: { allow?: string[], deny?: string[] }): Response | null`
Restricts access based on the client's IP address. You can provide an `allow` list or a `deny` list.

### Authentication

#### `protectWithBasicAuth(request: Request, options: AuthOptions): Promise<Response> | null`
Implements HTTP Basic Authentication. If the hostname matches `hostnameIncludes` and credentials are missing or invalid, it returns a `401 Unauthorized` response with the appropriate headers.

### Redirection

#### `redirectIfMatch(request: Request, options: RedirectOptions): Response | null`
Redirects the request if the URL path and HTTP method match the provided options.

### Geo Location

#### `getGeoHeaders(request: Request): Record<string, string | null>`
Extracts geo-location information (country, city, region, etc.) from the request headers typically provided by edge platforms.

### Responses

#### `jsonResponse(data: any, init?: ResponseInit): Response`
A helper to return a JSON response with the correct `Content-Type` header.

#### `passThrough(request: Request): Response`
Continues the request processing by calling `fetch(request)`. Useful at the end of an edge function.
