export function getGeoHeaders(request: Request) {
    return {
      country: request.headers.get("x-country-code"),
      region: request.headers.get("x-region-code"),
      city: request.headers.get("x-city"),
      latitude: request.headers.get("x-latitude"),
      longitude: request.headers.get("x-longitude")
    };
  }
  