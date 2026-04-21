export function protectWithBasicAuth(
    request: Request,
    options: {
      hostnameIncludes: string;
      username: string;
      password: string;
      realm?: string;
    }
  ): Promise<Response> | null {
    const url = new URL(request.url);
    // Match URL host, Host header, or X-Forwarded-Host (set by rewriteRequestToOrigin when
    // the browser hits localhost:8787 but the request URL is rewritten to 127.0.0.1:3000).
    const hostHeader = request.headers.get("host")?.split(":")[0] ?? "";
    const forwardedHost =
      request.headers.get("x-forwarded-host")?.split(":")[0] ?? "";
    const hostMatches =
      url.hostname.includes(options.hostnameIncludes) ||
      hostHeader.includes(options.hostnameIncludes) ||
      forwardedHost.includes(options.hostnameIncludes);
    if (!hostMatches) {
      return null;
    }
  
    const authHeader = request.headers.get("Authorization");
  
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return Promise.resolve(
        new Response("Authentication Required", {
          status: 401,
          headers: {
            "WWW-Authenticate": `Basic realm="${options.realm ?? "Protected Area"}"`,
            "Content-Type": "text/html"
          }
        })
      );
    }
  
    try {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(":");
  
      if (
        username === options.username &&
        password === options.password
      ) {
        return fetch(request);
      }
  
      return Promise.resolve(
        new Response("Unauthorized - Invalid credentials", { status: 401 })
      );
    } catch {
      return Promise.resolve(
        new Response("Unauthorized - Invalid auth format", { status: 401 })
      );
    }
  }
  