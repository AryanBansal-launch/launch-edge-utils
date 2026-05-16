import { describe, it, expect } from "vitest";
import { jsonResponse } from "../src/response/json.js";

describe("jsonResponse", () => {
  it("sets Content-Type to application/json by default", async () => {
    const res = jsonResponse({ ok: true });
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("respects user-supplied status", () => {
    const res = jsonResponse({ err: "x" }, { status: 422 });
    expect(res.status).toBe(422);
  });

  it("preserves user-supplied Content-Type override", () => {
    const res = jsonResponse(
      { ok: true },
      { headers: { "Content-Type": "application/problem+json" } }
    );
    expect(res.headers.get("Content-Type")).toBe("application/problem+json");
  });

  it("serializes arrays", async () => {
    const res = jsonResponse([1, 2, 3]);
    expect(await res.json()).toEqual([1, 2, 3]);
  });
});
