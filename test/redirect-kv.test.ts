import { describe, it, expect } from "vitest";
import { redirectFromKV } from "../src/redirect/redirect-kv.js";
import { FakeKV } from "./helpers/fakes.js";

function kvWith(redirects: unknown) {
  const kv = new FakeKV();
  kv.seedJSON("redirects", redirects);
  return kv;
}

describe("redirectFromKV", () => {
  it("returns null when the KV key is missing", async () => {
    const r = new Request("https://example.com/old");
    expect(await redirectFromKV(r, { kv: new FakeKV() })).toBeNull();
  });

  it("returns null when no rule matches", async () => {
    const kv = kvWith([{ source: "/old", destination: "/new" }]);
    const r = new Request("https://example.com/other");
    expect(await redirectFromKV(r, { kv })).toBeNull();
  });

  it("redirects an exact match with the rule's status code", async () => {
    const kv = kvWith([{ source: "/old", destination: "/new", statusCode: 308 }]);
    const r = new Request("https://example.com/old");
    const res = (await redirectFromKV(r, { kv }))!;
    expect(res.status).toBe(308);
    expect(res.headers.get("Location")).toBe("https://example.com/new");
  });

  it("defaults to 301 when statusCode is omitted", async () => {
    const kv = kvWith([{ source: "/old", destination: "/new" }]);
    const r = new Request("https://example.com/old");
    const res = (await redirectFromKV(r, { kv }))!;
    expect(res.status).toBe(301);
  });

  it("expands wildcard redirects", async () => {
    const kv = kvWith([{ source: "/old-shop/*", destination: "/shop/*" }]);
    const r = new Request("https://example.com/old-shop/tees/blue");
    const res = (await redirectFromKV(r, { kv }))!;
    expect(res.headers.get("Location")).toBe("https://example.com/shop/tees/blue");
  });

  it("uses an absolute destination verbatim", async () => {
    const kv = kvWith([{ source: "/go", destination: "https://other.com/x?y=1" }]);
    const r = new Request("https://example.com/go");
    const res = (await redirectFromKV(r, { kv }))!;
    expect(res.headers.get("Location")).toBe("https://other.com/x?y=1");
  });

  it("attaches a rule's response headers", async () => {
    const kv = kvWith([
      {
        source: "/old",
        destination: "/new",
        response: { headers: { "Cache-Control": "no-store" } },
      },
    ]);
    const r = new Request("https://example.com/old");
    const res = (await redirectFromKV(r, { kv }))!;
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
