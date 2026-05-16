import { describe, it, expect, vi, afterEach } from "vitest";
import { chain } from "../src/middleware/chain.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chain", () => {
  it("returns the first non-null Response and skips later steps", async () => {
    const second = vi.fn(() => new Response("second", { status: 418 }));
    const third = vi.fn(() => new Response("third"));
    const handler = chain([
      () => null,
      second,
      third,
    ]);

    const res = await handler(new Request("https://example.com/"));
    expect(res.status).toBe(418);
    expect(second).toHaveBeenCalledOnce();
    expect(third).not.toHaveBeenCalled();
  });

  it("awaits async steps", async () => {
    const handler = chain([
      async () => null,
      async () => new Response("async", { status: 200 }),
    ]);
    const res = await handler(new Request("https://example.com/"));
    expect(await res.text()).toBe("async");
  });

  it("falls through to the final step when all steps return null", async () => {
    const handler = chain(
      [() => null, () => null],
      () => new Response("final", { status: 201 })
    );
    const res = await handler(new Request("https://example.com/"));
    expect(res.status).toBe(201);
  });

  it("defaults the final step to fetch(request) (origin pass-through)", async () => {
    const fetchMock = vi.fn(async () => new Response("origin"));
    vi.stubGlobal("fetch", fetchMock);

    const handler = chain([() => null]);
    const res = await handler(new Request("https://example.com/"));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await res.text()).toBe("origin");
  });
});
