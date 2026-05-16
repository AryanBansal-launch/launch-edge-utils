import { describe, it, expect } from "vitest";
import { protectWithBasicAuth } from "../src/auth/basic-auth.js";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

const reqWith = (
  url: string,
  headers: Record<string, string> = {}
): Request => new Request(url, { headers });

describe("protectWithBasicAuth", () => {
  const opts = {
    hostnameIncludes: "staging.example.com",
    username: "alice",
    password: "s3cret:with:colons",
  };

  it("returns null when host doesn't match (no challenge)", () => {
    const r = reqWith("https://prod.example.com/");
    expect(protectWithBasicAuth(r, opts)).toBeNull();
  });

  it("challenges with 401 when host matches and no Authorization header", async () => {
    const r = reqWith("https://staging.example.com/");
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toMatch(/^Basic realm=/);
  });

  it("matches host via Host header", async () => {
    const r = reqWith("https://internal/", { host: "staging.example.com" });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });

  it("matches host via X-Forwarded-Host (local dev case)", async () => {
    const r = reqWith("http://127.0.0.1:3000/", {
      "x-forwarded-host": "staging.example.com:8787",
    });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });

  it("returns null on valid credentials so the chain continues", () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Basic " + b64("alice:s3cret:with:colons"),
    });
    expect(protectWithBasicAuth(r, opts)).toBeNull();
  });

  it("correctly splits on the first colon (passwords may contain ':')", () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Basic " + b64("alice:has:many:colons"),
    });
    const optsColons = { ...opts, password: "has:many:colons" };
    expect(protectWithBasicAuth(r, optsColons)).toBeNull();
  });

  it("rejects wrong password with 401", async () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Basic " + b64("alice:wrong"),
    });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });

  it("rejects malformed base64 with 401", async () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Basic !!!not-base64!!!",
    });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });

  it("rejects credentials with no colon", async () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Basic " + b64("nocolons"),
    });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });

  it("rejects non-Basic scheme", async () => {
    const r = reqWith("https://staging.example.com/", {
      authorization: "Bearer abc",
    });
    const res = await protectWithBasicAuth(r, opts)!;
    expect(res.status).toBe(401);
  });
});
