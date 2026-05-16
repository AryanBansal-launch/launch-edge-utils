/**
 * Redirect a request when `pathname` matches exactly (and optionally `method`).
 *
 * `to` may be either:
 *   - a relative path (e.g. `/new-url`), which preserves the current scheme/host
 *     and replaces the pathname (search/hash from the original URL are dropped)
 *   - an absolute URL (e.g. `https://newsite.com/path`), which is used as-is
 *
 * Returns a `Response.redirect(...)` on match, or `null` otherwise.
 *
 * @param options.path    exact pathname to match
 * @param options.method  optional HTTP method to require (e.g. `"GET"`)
 * @param options.to      destination path or absolute URL
 * @param options.status  redirect status code (default 301)
 */
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
    url.pathname !== options.path ||
    (options.method && request.method !== options.method)
  ) {
    return null;
  }

  const status = options.status ?? 301;
  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(options.to);
  const target = isAbsolute ? options.to : new URL(options.to, url).toString();
  return Response.redirect(target, status);
}
