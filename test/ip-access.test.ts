import { describe, it, expect } from "vitest";
import { ipAccessControl } from "../src/security/ip-access.js";

const reqWith = (headers: Record<string, string>) =>
  new Request("https://example.com/", { headers });

describe("ipAccessControl", () => {
  it("blocks denied IPs (from cf-connecting-ip)", () => {
    const res = ipAccessControl(reqWith({ "cf-connecting-ip": "1.2.3.4" }), {
      deny: ["1.2.3.4"],
    })!;
    expect(res.status).toBe(403);
  });

  it("allows non-denied IPs", () => {
    expect(
      ipAccessControl(reqWith({ "cf-connecting-ip": "9.9.9.9" }), {
        deny: ["1.2.3.4"],
      })
    ).toBeNull();
  });

  it("blocks IPs not in allow-list", () => {
    const res = ipAccessControl(reqWith({ "cf-connecting-ip": "9.9.9.9" }), {
      allow: ["1.2.3.4"],
    })!;
    expect(res.status).toBe(403);
  });

  it("permits IPs in allow-list", () => {
    expect(
      ipAccessControl(reqWith({ "cf-connecting-ip": "1.2.3.4" }), {
        allow: ["1.2.3.4"],
      })
    ).toBeNull();
  });

  it("fails CLOSED on allow-list when no trusted IP header is present", () => {
    const res = ipAccessControl(reqWith({}), { allow: ["1.2.3.4"] })!;
    expect(res.status).toBe(403);
  });

  it("fails OPEN on deny-only when no trusted IP header is present", () => {
    expect(ipAccessControl(reqWith({}), { deny: ["1.2.3.4"] })).toBeNull();
  });

  it("rejects spoofed XFF when trustForwardedFor is false", () => {
    // Attacker sets XFF hoping to slip into the allow-list
    const r = reqWith({ "x-forwarded-for": "1.2.3.4" });
    const res = ipAccessControl(r, {
      allow: ["1.2.3.4"],
      trustForwardedFor: false,
    })!;
    expect(res.status).toBe(403);
  });
});
