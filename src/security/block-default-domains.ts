/**
 * Block requests served via Launch's default preview domain so search engines
 * and users only see your canonical hostname.
 *
 * Matches by hostname suffix (NOT substring), so `domainToBlock: "foo.com"`
 * blocks `foo.com` and `*.foo.com` but not `evil-foo.com`.
 *
 * @param options.domainToBlock  hostname or hostname suffix to block.
 *                                Defaults to `contentstackapps.com`.
 */
export function blockDefaultDomains(
  request: Request,
  options: { domainToBlock?: string } = {}
): Response | null {
  const domain = (options.domainToBlock || "contentstackapps.com").toLowerCase();
  const hostname = new URL(request.url).hostname.toLowerCase();

  const matches = hostname === domain || hostname.endsWith("." + domain);
  if (matches) {
    return new Response("Forbidden: Access via default domain is restricted.", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  return null;
}
