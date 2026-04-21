import { rewriteRequestToOrigin } from "@aryanbansal-launch/edge-utils";
import handler from "./sample-handler.js";

type Env = { BACKEND_URL: string };

export default {
  async fetch(request: Request, env: Env, _ctx: unknown) {
    const req = rewriteRequestToOrigin(request, env.BACKEND_URL);
    return handler(req, {});
  },
};
