import { describe, it, expect } from "vitest";
import { generateLaunchConfig } from "../src/launch/config.js";

describe("generateLaunchConfig", () => {
  it("fills in defaults for omitted sections", () => {
    expect(generateLaunchConfig({})).toEqual({
      redirects: [],
      rewrites: [],
      cache: { cachePriming: { urls: [] } },
    });
  });

  it("preserves provided redirects and rewrites", () => {
    const cfg = generateLaunchConfig({
      redirects: [
        { source: "/a", destination: "/b", statusCode: 308 },
      ],
      rewrites: [{ source: "/api/*", destination: "https://api.example.com" }],
    });
    expect(cfg.redirects).toHaveLength(1);
    expect(cfg.rewrites).toHaveLength(1);
  });

  it("preserves cache priming URLs", () => {
    const cfg = generateLaunchConfig({
      cache: { cachePriming: { urls: ["/home", "/about"] } },
    });
    expect(cfg.cache?.cachePriming?.urls).toEqual(["/home", "/about"]);
  });
});
