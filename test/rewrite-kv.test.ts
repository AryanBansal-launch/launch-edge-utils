import { describe, it, expect } from "vitest";
import { rewriteFromKV } from "../src/rewrite/rewrite-kv.js";
import { FakeKV } from "./helpers/fakes.js";

function kvWith(rewrites: unknown) {
  const kv = new FakeKV();
  kv.seedJSON("rewrites", rewrites);
  return kv;
}

describe("rewriteFromKV", () => {
  it("returns null when no rule matches", async () => {
    const kv = kvWith([{ source: "/home", destination: "/" }]);
    const r = new Request("https://example.com/other");
    expect(await rewriteFromKV(r, { kv })).toBeNull();
  });

  it("swaps the path while keeping the origin", async () => {
    const kv = kvWith([{ source: "/home", destination: "/" }]);
    const r = new Request("https://example.com/home");
    const out = (await rewriteFromKV(r, { kv }))!;
    expect(out.url).toBe("https://example.com/");
  });

  it("preserves the query string across the rewrite", async () => {
    const kv = kvWith([{ source: "/docs/*", destination: "/blog/*" }]);
    const r = new Request("https://example.com/docs/intro?ref=nav");
    const out = (await rewriteFromKV(r, { kv }))!;
    expect(out.url).toBe("https://example.com/blog/intro?ref=nav");
  });

  it("preserves the request method", async () => {
    const kv = kvWith([{ source: "/home", destination: "/" }]);
    const r = new Request("https://example.com/home", { method: "POST" });
    const out = (await rewriteFromKV(r, { kv }))!;
    expect(out.method).toBe("POST");
  });

  it("supports an absolute destination", async () => {
    const kv = kvWith([{ source: "/proxy", destination: "https://api.internal/v1" }]);
    const r = new Request("https://example.com/proxy");
    const out = (await rewriteFromKV(r, { kv }))!;
    expect(out.url).toBe("https://api.internal/v1");
  });
});
