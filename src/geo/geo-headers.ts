export interface GeoHeaders {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Read geo-location headers set by Launch / Cloudflare's edge.
 * Any header that wasn't set returns `null`.
 */
export function getGeoHeaders(request: Request): GeoHeaders {
  return {
    country: request.headers.get("x-country-code"),
    region: request.headers.get("x-region-code"),
    city: request.headers.get("x-city"),
    latitude: request.headers.get("x-latitude"),
    longitude: request.headers.get("x-longitude"),
  };
}
