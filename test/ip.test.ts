import { describe, it, expect } from "vitest";
import { getClientIP } from "../src/utils/ip.js";

const reqWith = (headers: Record<string, string>) =>
  new Request("https://example.com/", { headers });

describe("getClientIP", () => {
  it("prefers cf-connecting-ip over everything", () => {
    const r = reqWith({
      "cf-connecting-ip": "1.1.1.1",
      "true-client-ip": "2.2.2.2",
      "x-real-ip": "3.3.3.3",
      "x-forwarded-for": "4.4.4.4",
    });
    expect(getClientIP(r)).toBe("1.1.1.1");
  });

  it("falls back to true-client-ip when cf-connecting-ip absent", () => {
    const r = reqWith({ "true-client-ip": "2.2.2.2", "x-real-ip": "3.3.3.3" });
    expect(getClientIP(r)).toBe("2.2.2.2");
  });

  it("falls back to x-real-ip", () => {
    const r = reqWith({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "4.4.4.4" });
    expect(getClientIP(r)).toBe("3.3.3.3");
  });

  it("uses leftmost x-forwarded-for as a last resort", () => {
    const r = reqWith({ "x-forwarded-for": "4.4.4.4, 5.5.5.5" });
    expect(getClientIP(r)).toBe("4.4.4.4");
  });

  it("ignores x-forwarded-for when trustForwardedFor is false", () => {
    const r = reqWith({ "x-forwarded-for": "4.4.4.4" });
    expect(getClientIP(r, { trustForwardedFor: false })).toBeNull();
  });

  it("returns null when no headers are present", () => {
    expect(getClientIP(reqWith({}))).toBeNull();
  });
});
