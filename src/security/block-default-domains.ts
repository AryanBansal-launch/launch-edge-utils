
export function blockDefaultDomains(
  request: Request,
  options: {
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

