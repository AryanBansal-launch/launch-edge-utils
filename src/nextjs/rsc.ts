export function handleNextJS_RSC(
  request: Request,
  options: {
    affectedPaths: string[];
  }
): Promise<Response> | null {
  const RSC_HEADER = 'rsc';
  const RSC_HEADER_VALUE = '1';
  const RSC_QUERY_PARAM = '_rsc';

  const parsedUrl = new URL(request.url);
  const route = parsedUrl.pathname;

  const rscQueryParamExists = !!parsedUrl.searchParams.get(RSC_QUERY_PARAM);
  const rscHeaderExists = request.headers.get(RSC_HEADER) === RSC_HEADER_VALUE;
  const isAffectedPath = options.affectedPaths.includes(route);

  if (isAffectedPath && !rscQueryParamExists && rscHeaderExists) {
    const modifiedRequest = new Request(request);
    modifiedRequest.headers.delete(RSC_HEADER);
    return fetch(modifiedRequest);
  }

  return null;
}

