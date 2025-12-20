export function passThrough(request: Request): Promise<Response> {
    return fetch(request);
  }
  