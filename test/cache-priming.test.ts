import { describe, it, expect } from "vitest";
import {
  primeCache,
  primeCacheFromKV,
  loadCachePrimingUrls,
  serveWithCache,
} from "../src/cache/priming.js";
import { FakeKV, FakeCache } from "./helpers/fakes.js";

describe("loadCachePrimingUrls", () => {
  it("reads a bare array", async () => {
    const kv = new FakeKV();
    kv.seedJSON("cache:priming", ["/", "/about"]);
    expect(await loadCachePrimingUrls(kv)).toEqual(["/", "/about"]);
  });

  it("reads the { urls } config shape", async () => {
    const kv = new FakeKV();
    kv.seedJSON("cache:priming", { urls: ["/x"] });
    expect(await loadCachePrimingUrls(kv)).toEqual(["/x"]);
  });

  it("returns [] when missing", async () => {
    expect(await loadCachePrimingUrls(new FakeKV())).toEqual([]);
  });
});

describe("primeCache", () => {
  it("fetches each URL and stores 2xx responses keyed by the public URL", async () => {
    const cache = new FakeCache();
    const seen: string[] = [];
    const fetcher = async (req: Request) => {
      seen.push(req.url);
      return new Response("ok", { status: 200 });
    };

    const results = await primeCache({
      urls: ["/", "/about"],
      cache,
      keyBase: "https://site.com",
      fetcher,
    });

    expect(seen).toEqual(["https://site.com/", "https://site.com/about"]);
    expect(results.every((r) => r.cached)).toBe(true);
    expect(await cache.match("https://site.com/about")).toBeTruthy();
  });

  it("does not cache non-2xx responses", async () => {
    const cache = new FakeCache();
    const results = await primeCache({
      urls: ["/missing"],
      cache,
      keyBase: "https://site.com",
      fetcher: async () => new Response("nope", { status: 404 }),
    });
    expect(results[0].cached).toBe(false);
    expect(await cache.match("https://site.com/missing")).toBeUndefined();
  });

  it("fetches from fetchBase but keys by keyBase", async () => {
    const cache = new FakeCache();
    const seen: string[] = [];
    await primeCache({
      urls: ["/"],
      cache,
      keyBase: "https://public.com",
      fetchBase: "http://127.0.0.1:3000",
      fetcher: async (req) => {
        seen.push(req.url);
        return new Response("ok");
      },
    });
    expect(seen).toEqual(["http://127.0.0.1:3000/"]);
    expect(await cache.match("https://public.com/")).toBeTruthy();
  });

  it("reports cached:false when the cache drops an uncacheable 2xx response", async () => {
    // Simulates the real Cache API refusing to retain e.g. `no-cache` responses:
    // put() is a no-op, so a follow-up match() finds nothing.
    const droppingCache = {
      match: async () => undefined,
      put: async () => {},
      delete: async () => false,
    };
    const results = await primeCache({
      urls: ["/"],
      cache: droppingCache,
      keyBase: "https://site.com",
      fetcher: async () => new Response("ok", { status: 200 }),
    });
    expect(results[0]).toMatchObject({ status: 200, cached: false });
  });

  it("records an error without throwing when the fetch fails", async () => {
    const cache = new FakeCache();
    const results = await primeCache({
      urls: ["/"],
      cache,
      keyBase: "https://site.com",
      fetcher: async () => {
        throw new Error("boom");
      },
    });
    expect(results[0]).toMatchObject({ cached: false, status: 0, error: "boom" });
  });
});

describe("primeCacheFromKV", () => {
  it("loads URLs from KV then primes", async () => {
    const kv = new FakeKV();
    kv.seedJSON("cache:priming", { urls: ["/"] });
    const cache = new FakeCache();
    const results = await primeCacheFromKV({
      kv,
      cache,
      keyBase: "https://site.com",
      fetcher: async () => new Response("ok"),
    });
    expect(results).toHaveLength(1);
    expect(await cache.match("https://site.com/")).toBeTruthy();
  });
});

describe("serveWithCache", () => {
  it("returns MISS and populates the cache on first request", async () => {
    const cache = new FakeCache();
    let calls = 0;
    const res = await serveWithCache(new Request("https://site.com/"), {
      cache,
      fetcher: async () => {
        calls++;
        return new Response("body", { status: 200 });
      },
    });
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(calls).toBe(1);
    expect(await cache.match("https://site.com/")).toBeTruthy();
  });

  it("returns HIT from cache without calling the fetcher again", async () => {
    const cache = new FakeCache();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return new Response("body");
    };
    const req = () => new Request("https://site.com/");
    await serveWithCache(req(), { cache, fetcher });
    const second = await serveWithCache(req(), { cache, fetcher });
    expect(second.headers.get("X-Cache")).toBe("HIT");
    expect(calls).toBe(1);
  });

  it("does not cache non-2xx responses", async () => {
    const cache = new FakeCache();
    const res = await serveWithCache(new Request("https://site.com/x"), {
      cache,
      fetcher: async () => new Response("no", { status: 500 }),
    });
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(await cache.match("https://site.com/x")).toBeUndefined();
  });

  it("bypasses the cache for non-GET requests", async () => {
    const cache = new FakeCache();
    let calls = 0;
    const res = await serveWithCache(
      new Request("https://site.com/", { method: "POST" }),
      {
        cache,
        fetcher: async () => {
          calls++;
          return new Response("ok");
        },
      }
    );
    expect(res.headers.get("X-Cache")).toBeNull();
    expect(calls).toBe(1);
  });

  it("uses waitUntil for the cache write when provided", async () => {
    const cache = new FakeCache();
    const pending: Promise<unknown>[] = [];
    await serveWithCache(new Request("https://site.com/"), {
      cache,
      fetcher: async () => new Response("ok"),
      waitUntil: (p) => pending.push(p),
    });
    expect(pending).toHaveLength(1);
    await Promise.all(pending);
    expect(await cache.match("https://site.com/")).toBeTruthy();
  });
});
