/**
 * Workaround for Next.js React Server Component requests when proxied through
 * Launch. On affected paths, if the upstream sent the RSC header but no `_rsc`
 * query param, Next will attempt to render an RSC payload instead of an HTML
 * document — which breaks navigation through the proxy. Stripping the `RSC`
 * request header on these paths forces Next to return HTML.
 *
 * Returns `Promise<Response>` (the upstream fetch) when the workaround fires,
 * or `null` so callers can continue their middleware chain.
 */
export function handleNextJS_RSC(
  request: Request,
  options: { affectedPaths: string[] }
): Promise<Response> | null {
  const RSC_HEADER = "rsc";
  const RSC_HEADER_VALUE = "1";
  const RSC_QUERY_PARAM = "_rsc";

  const parsedUrl = new URL(request.url);
  const route = parsedUrl.pathname;

  const rscQueryParamExists = parsedUrl.searchParams.has(RSC_QUERY_PARAM);
  const rscHeaderExists = request.headers.get(RSC_HEADER) === RSC_HEADER_VALUE;
  const isAffectedPath = options.affectedPaths.includes(route);

  if (!isAffectedPath || rscQueryParamExists || !rscHeaderExists) {
    return null;
  }

  const headers = new Headers(request.headers);
  headers.delete(RSC_HEADER);
  const modifiedRequest = new Request(request, { headers });
  return fetch(modifiedRequest);
}
