import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRuntimeConfig } from "./runtime-config";
import { apiClient } from "./api-client";

/**
 * Regression guard for the GET /config integration.
 *
 * `/config` is the only backend route that does not use the
 * `{ success, data, meta }` envelope — it returns its fields at the top level,
 * and the Flutter client already depends on that shape, so the backend was
 * deliberately left alone. The web client used `apiClient.get()`, which unwraps
 * `.data`; against an unwrapped body that yields `undefined`, so
 * `config?.priceGraphEnabled` was permanently falsy and the price-history chart
 * could never render even with the flag on.
 */
function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body) };
}

describe("GET /config integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("1. the unwrapped top-level response is parsed correctly", () => {
    it("reads maxApiCalls and priceGraphEnabled straight off the body", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ maxApiCalls: 2, priceGraphEnabled: true }));

      await expect(getRuntimeConfig()).resolves.toEqual({
        maxApiCalls: 2,
        priceGraphEnabled: true,
      });
    });

    it("requests /config exactly once, on the configured API base", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ maxApiCalls: 4, priceGraphEnabled: false }));

      await getRuntimeConfig();

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/config$/);
    });

    it("degrades to null when the endpoint fails, rather than throwing into the page", async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, false, 500));
      await expect(getRuntimeConfig()).resolves.toBeNull();

      fetchMock.mockRejectedValue(new Error("network down"));
      await expect(getRuntimeConfig()).resolves.toBeNull();
    });
  });

  describe("2. priceGraphEnabled actually reaches the product page", () => {
    // This is the exact expression the product page gates the price-history
    // fetch on: `config?.priceGraphEnabled ? await getPriceHistory(...) : []`.
    const pageWouldShowChart = (config: { priceGraphEnabled: boolean } | null) =>
      Boolean(config?.priceGraphEnabled);

    it("gates the chart ON when the backend flag is true", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ maxApiCalls: 2, priceGraphEnabled: true }));
      expect(pageWouldShowChart(await getRuntimeConfig())).toBe(true);
    });

    it("gates the chart OFF when the backend flag is false", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ maxApiCalls: 2, priceGraphEnabled: false }));
      expect(pageWouldShowChart(await getRuntimeConfig())).toBe(false);
    });

    it("gates the chart OFF when /config is unreachable", async () => {
      fetchMock.mockRejectedValue(new Error("network down"));
      expect(pageWouldShowChart(await getRuntimeConfig())).toBe(false);
    });

    it("proves the original bug: the enveloped get() yields undefined for this body", async () => {
      const body = { maxApiCalls: 2, priceGraphEnabled: true };
      fetchMock.mockResolvedValue(jsonResponse(body));

      // The old call path — unwrapping `.data` from a body that has none.
      await expect(apiClient.get("/config")).resolves.toBeUndefined();

      // The fixed path returns the real flags from the same response.
      fetchMock.mockResolvedValue(jsonResponse(body));
      expect(pageWouldShowChart(await getRuntimeConfig())).toBe(true);
    });
  });

  describe("3. standard enveloped endpoints are unchanged", () => {
    it("get() still unwraps .data", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: "p1" }], meta: { count: 1 } }),
      );

      await expect(apiClient.get("/deals")).resolves.toEqual([{ id: "p1" }]);
    });

    it("getWithMeta() still returns the whole envelope", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: [], meta: { count: 0, hasMore: false } }),
      );

      await expect(apiClient.getWithMeta("/search?q=x")).resolves.toEqual({
        success: true,
        data: [],
        meta: { count: 0, hasMore: false },
      });
    });

    it("getCached() still unwraps .data and passes the revalidate window through", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ slug: "mobiles" }] }));

      await expect(apiClient.getCached("/categories", 3600)).resolves.toEqual([
        { slug: "mobiles" },
      ]);
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 3600 } });
    });

    it("still throws ApiError on a non-ok enveloped response", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false }, false, 404));
      await expect(apiClient.get("/products/slug/nope")).rejects.toThrow(/404/);
    });
  });
});
