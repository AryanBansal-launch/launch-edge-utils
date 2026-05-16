import { describe, it, expect } from "vitest";
import { redirectIfMatch } from "../src/redirect/redirect.js";

describe("redirectIfMatch", () => {
  it("returns null when path does not match", () => {
    const r = new Request("https://example.com/other");
    expect(
      redirectIfMatch(r, { path: "/old", to: "/new" })
    ).toBeNull();
  });

  it("returns null when method is required and does not match", () => {
    const r = new Request("https://example.com/old", { method: "POST" });
    expect(
      redirectIfMatch(r, { path: "/old", method: "GET", to: "/new" })
    ).toBeNull();
  });

  it("redirects relative path against the request origin", () => {
    const r = new Request("https://example.com/old");
    const res = redirectIfMatch(r, { path: "/old", to: "/new" })!;
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://example.com/new");
  });

  it("redirects to an absolute URL without mangling it", () => {
    const r = new Request("https://example.com/old");
    const res = redirectIfMatch(r, {
      path: "/old",
      to: "https://newsite.com/path?x=1",
    })!;
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://newsite.com/path?x=1");
  });

  it("honors custom status", () => {
    const r = new Request("https://example.com/old");
    const res = redirectIfMatch(r, { path: "/old", to: "/new", status: 302 })!;
    expect(res.status).toBe(302);
  });
});
