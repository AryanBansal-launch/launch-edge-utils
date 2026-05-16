import { describe, it, expect } from "vitest";
import { rewriteRequestToOrigin } from "../src/dev/rewrite-origin.js";

describe("rewriteRequestToOrigin", () => {
  it("rewrites scheme/host/port to the backend origin, preserving path", () => {
    const r = new Request("http://localhost:8787/some/path?x=1");
    const out = rewriteRequestToOrigin(r, "http://127.0.0.1:3000");
    expect(out.url).toBe("http://127.0.0.1:3000/some/path?x=1");
  });

  it("prepends the backend origin's path prefix", () => {
    const r = new Request("http://localhost:8787/about");
    const out = rewriteRequestToOrigin(r, "http://127.0.0.1:3000/app");
    expect(out.url).toBe("http://127.0.0.1:3000/app/about");
  });

  it("sets x-forwarded-host to the original host when hosts differ", () => {
    const r = new Request("http://staging.example.com:8787/");
    const out = rewriteRequestToOrigin(r, "http://127.0.0.1:3000");
    expect(out.headers.get("x-forwarded-host")).toBe(
      "staging.example.com:8787"
    );
  });

  it("doesn't overwrite an existing x-forwarded-host", () => {
    const r = new Request("http://staging.example.com:8787/", {
      headers: { "x-forwarded-host": "original.example.com" },
    });
    const out = rewriteRequestToOrigin(r, "http://127.0.0.1:3000");
    expect(out.headers.get("x-forwarded-host")).toBe("original.example.com");
  });

  it("preserves the request method", () => {
    const r = new Request("http://localhost:8787/api", { method: "POST" });
    const out = rewriteRequestToOrigin(r, "http://127.0.0.1:3000");
    expect(out.method).toBe("POST");
  });
});
