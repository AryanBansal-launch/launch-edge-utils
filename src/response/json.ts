/**
 * Build a JSON `Response` with `Content-Type: application/json`.
 *
 * Any `headers` / `status` you pass via `init` are merged with the JSON
 * content type (passing your own `Content-Type` overrides it).
 */
export function jsonResponse(
  body: Record<string, unknown> | unknown[],
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}
