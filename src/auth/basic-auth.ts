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
  
    if (!url.hostname.includes(options.hostnameIncludes)) {
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
  