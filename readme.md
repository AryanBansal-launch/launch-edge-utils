import {
  jsonResponse,
  passThrough,
  redirectIfMatch,
  protectWithBasicAuth,
  ipAccessControl,
  blockAICrawlers,
  getGeoHeaders
} from "@launch/edge-utils";

export default async function handler(request: Request) {
  const bot = blockAICrawlers(request);
  if (bot) return bot;

  const ip = ipAccessControl(request, { allow: ["203.0.113.10"] });
  if (ip) return ip;

  const auth = protectWithBasicAuth(request, {
    hostnameIncludes: "test-protected-domain.devcontentstackapps.com",
    username: "admin",
    password: "admin"
  });
  if (auth) return auth;

  const redirect = redirectIfMatch(request, {
    path: "/appliances",
    method: "POST",
    to: "/appliances/new"
  });
  if (redirect) return redirect;

  if (new URL(request.url).pathname === "/appliances") {
    return jsonResponse({ time: new Date() });
  }

  const geo = getGeoHeaders(request);
  console.log(geo);

  return passThrough(request);
}
