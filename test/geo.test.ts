import { describe, it, expect } from "vitest";
import { getGeoHeaders } from "../src/geo/geo-headers.js";

describe("getGeoHeaders", () => {
  it("reads all geo headers", () => {
    const r = new Request("https://example.com/", {
      headers: {
        "x-country-code": "US",
        "x-region-code": "CA",
        "x-city": "San Francisco",
        "x-latitude": "37.77",
        "x-longitude": "-122.42",
      },
    });
    expect(getGeoHeaders(r)).toEqual({
      country: "US",
      region: "CA",
      city: "San Francisco",
      latitude: "37.77",
      longitude: "-122.42",
    });
  });

  it("returns nulls when headers are absent", () => {
    expect(getGeoHeaders(new Request("https://example.com/"))).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });
});
