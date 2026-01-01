/**
 * Blocks access to the site when accessed via default Contentstack Launch domains.
 * This is useful for ensuring users only access the site via your custom domain.
 */
export function blockDefaultDomains(
  request: Request,
  options: {
    /** Domain substring to block (e.g., 'contentstackapps.com') */
    domainToBlock?: string;
  } = {}
): Response | null {
  const domain = options.domainToBlock || 'contentstackapps.com';
  const url = new URL(request.url);

  if (url.hostname.includes(domain)) {
    return new Response('Forbidden: Access via default domain is restricted.', {
      status: 403,
      statusText: 'Forbidden'
    });
  }

  return null;
}

