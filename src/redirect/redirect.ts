export function redirectIfMatch(
    request: Request,
    options: {
      path: string;
      method?: string;
      to: string;
      status?: number;
    }
  ): Response | null {
    const url = new URL(request.url);
  
    if (
      url.pathname === options.path &&
      (!options.method || request.method === options.method)
    ) {
      url.pathname = options.to;
      return Response.redirect(url, options.status ?? 301);
    }
  
    return null;
  }
  