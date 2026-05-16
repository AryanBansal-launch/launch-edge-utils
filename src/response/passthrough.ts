/**
 * Forward the request to the origin (or, in local dev with
 * `rewriteRequestToOrigin`, to your dev server) and return its response.
 *
 * Equivalent to `fetch(request)`; kept as a named export so generated
 * handlers read clearly ("if no rule matched, pass through").
 */
export function passThrough(request: Request): Promise<Response> {
  return fetch(request);
}
