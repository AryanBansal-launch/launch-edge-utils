import { describe, it, expect } from "vitest";
import { blockDefaultDomains } from "../src/security/block-default-domains.js";

const reqAt = (url: string) => new Request(url);

describe("blockDefaultDomains", () => {
  it("blocks the exact default domain", () => {
    const res = blockDefaultDomains(reqAt("https://contentstackapps.com/"))!;
    expect(res.status).toBe(403);
  });

  it("blocks subdomains of the default domain", () => {
    const res = blockDefaultDomains(reqAt("https://app.contentstackapps.com/"))!;
    expect(res.status).toBe(403);
  });

  it("does NOT block a hostname that merely contains the domain string", () => {
    expect(
      blockDefaultDomains(reqAt("https://evil-contentstackapps.com/"))
    ).toBeNull();
    expect(
      blockDefaultDomains(reqAt("https://mycontentstackapps.com.attacker.io/"))
    ).toBeNull();
  });

  it("respects a custom domain", () => {
    const res = blockDefaultDomains(reqAt("https://preview.foo.com/"), {
      domainToBlock: "foo.com",
    })!;
    expect(res.status).toBe(403);
  });

  it("custom domain — does not over-block similar names", () => {
    expect(
      blockDefaultDomains(reqAt("https://myfoo.com/"), {
        domainToBlock: "foo.com",
      })
    ).toBeNull();
  });

  it("allows the canonical hostname", () => {
    expect(blockDefaultDomains(reqAt("https://www.example.com/"))).toBeNull();
  });
});
