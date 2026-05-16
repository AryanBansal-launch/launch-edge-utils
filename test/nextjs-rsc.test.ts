import { describe, it, expect, vi, afterEach } from "vitest";
import { handleNextJS_RSC } from "../src/nextjs/rsc.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleNextJS_RSC", () => {
  it("returns null when path is not affected", () => {
    const r = new Request("https://example.com/other", {
      headers: { rsc: "1" },
    });
    expect(handleNextJS_RSC(r, { affectedPaths: ["/page"] })).toBeNull();
  });

  it("returns null when _rsc query param is already present", () => {
    const r = new Request("https://example.com/page?_rsc=1", {
      headers: { rsc: "1" },
    });
    expect(handleNextJS_RSC(r, { affectedPaths: ["/page"] })).toBeNull();
  });

  it("returns null when rsc header is absent", () => {
    const r = new Request("https://example.com/page");
    expect(handleNextJS_RSC(r, { affectedPaths: ["/page"] })).toBeNull();
  });

  it("fires fetch with rsc header stripped on affected paths", async () => {
    const captured: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (req: Request) => {
        captured.push(req);
        return new Response("ok");
      })
    );

    const r = new Request("https://example.com/page", {
      headers: { rsc: "1", "x-other": "keep" },
    });
    const result = handleNextJS_RSC(r, { affectedPaths: ["/page"] });
    expect(result).not.toBeNull();
    const res = await result!;
    expect(res.status).toBe(200);
    expect(captured).toHaveLength(1);
    expect(captured[0].headers.get("rsc")).toBeNull();
    expect(captured[0].headers.get("x-other")).toBe("keep");
  });
});
