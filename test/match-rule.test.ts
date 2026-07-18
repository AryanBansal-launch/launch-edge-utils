import { describe, it, expect } from "vitest";
import { matchRule } from "../src/utils/match-rule.js";

describe("matchRule", () => {
  const rules = [
    { source: "/legacy/about", destination: "/about" },
    { source: "/old-shop/*", destination: "/shop/*" },
    { source: "/archive/*", destination: "/blog/archive/*" },
    { source: "/drop/*", destination: "/gone" },
  ];

  it("matches exact sources", () => {
    expect(matchRule("/legacy/about", rules)?.destination).toBe("/about");
  });

  it("returns null when nothing matches", () => {
    expect(matchRule("/nope", rules)).toBeNull();
  });

  it("substitutes the wildcard tail into the destination", () => {
    expect(matchRule("/old-shop/a/b", rules)?.destination).toBe("/shop/a/b");
    expect(matchRule("/archive/2020", rules)?.destination).toBe("/blog/archive/2020");
  });

  it("treats a wildcard-less destination as a static catch-all (tail dropped)", () => {
    expect(matchRule("/drop/x/y", rules)?.destination).toBe("/gone");
  });

  it("matches the wildcard prefix boundary (empty tail)", () => {
    expect(matchRule("/old-shop/", rules)?.destination).toBe("/shop/");
  });

  it("does not match a wildcard prefix without its trailing slash", () => {
    expect(matchRule("/old-shopX", rules)).toBeNull();
  });

  it("honors array order — first match wins", () => {
    const ordered = [
      { source: "/a/*", destination: "/first/*" },
      { source: "/a/b", destination: "/second" },
    ];
    expect(matchRule("/a/b", ordered)?.destination).toBe("/first/b");
  });
});
