export function jsonResponse(
    body: Record<string, unknown>,
    init?: ResponseInit
  ): Response {
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
      ...init
    });
  }
  