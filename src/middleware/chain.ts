/**
 * A middleware step: returns a `Response` to short-circuit the chain, or
 * `null`/`undefined` to fall through to the next step. May be async.
 */
export type EdgeMiddleware = (
  request: Request
) => Response | null | undefined | Promise<Response | null | undefined>;

/**
 * Compose a list of middleware into a single handler. Each step runs in order;
 * the first step to return a `Response` wins and the rest are skipped.
 *
 * If every step returns null, the chain returns the result of `final`
 * (defaults to `fetch(request)` — i.e. pass-through to origin).
 *
 * @example
 *   export default async function handler(request) {
 *     return chain([
 *       (r) => blockDefaultDomains(r),
 *       (r) => blockAICrawlers(r),
 *       (r) => ipAccessControl(r, { allow: ["203.0.113.10"] }),
 *       (r) => protectWithBasicAuth(r, { hostnameIncludes: "staging.", username: "u", password: "p" }),
 *       (r) => redirectIfMatch(r, { path: "/legacy", to: "/new" }),
 *     ])(request);
 *   }
 */
export function chain(
  steps: EdgeMiddleware[],
  final: EdgeMiddleware = (r) => fetch(r)
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    for (const step of steps) {
      const result = await step(request);
      if (result) return result;
    }
    const last = await final(request);
    if (last) return last;
    // `final` returned null — fall back to origin to guarantee a Response.
    return fetch(request);
  };
}
