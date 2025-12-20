import { getClientIP } from "../utils/ip";

export function ipAccessControl(
  request: Request,
  options: {
    allow?: string[];
    deny?: string[];
  }
): Response | null {
  const ip = getClientIP(request);
  if (!ip) return null;

  if (options.deny?.includes(ip)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (options.allow && !options.allow.includes(ip)) {
    return new Response("Forbidden", { status: 403 });
  }

  return null;
}
