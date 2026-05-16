import { describe, it, expect } from "vitest";
import {
  blockAICrawlers,
  AI_CRAWLERS,
  ALL_BOTS,
} from "../src/security/block-bots.js";

const reqWithUA = (ua: string) =>
  new Request("https://example.com/", { headers: { "user-agent": ua } });

describe("blockAICrawlers", () => {
  it("blocks GPTBot by default", () => {
    const res = blockAICrawlers(reqWithUA("Mozilla/5.0 GPTBot/1.0"))!;
    expect(res.status).toBe(403);
  });

  it("blocks ClaudeBot by default", () => {
    const res = blockAICrawlers(reqWithUA("ClaudeBot/1.0"))!;
    expect(res.status).toBe(403);
  });

  it("does NOT block Googlebot by default (SEO safety)", () => {
    expect(blockAICrawlers(reqWithUA("Googlebot/2.1"))).toBeNull();
  });

  it("does NOT block Bingbot by default", () => {
    expect(blockAICrawlers(reqWithUA("bingbot/2.0"))).toBeNull();
  });

  it("allows normal browsers", () => {
    expect(
      blockAICrawlers(
        reqWithUA(
          "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/123 Safari/537.36"
        )
      )
    ).toBeNull();
  });

  it("returns null when no User-Agent header is set", () => {
    expect(blockAICrawlers(new Request("https://example.com/"))).toBeNull();
  });

  it("opts in to blocking everything via ALL_BOTS", () => {
    const res = blockAICrawlers(reqWithUA("Googlebot/2.1"), ALL_BOTS)!;
    expect(res.status).toBe(403);
  });

  it("exports AI_CRAWLERS as the default list", () => {
    expect(AI_CRAWLERS).toContain("gptbot");
    expect(AI_CRAWLERS).not.toContain("googlebot");
  });
});
