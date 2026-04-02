/**
 * Tests for mock data generators.
 * These are used by the dashboard and must be deterministic within bounds.
 */

import { MOCK_COMPARISON, MOCK_LIGHTHOUSE, MOCK_BUNDLE_SIZES, generateTrend } from "@/lib/mock-data";

describe("MOCK_COMPARISON", () => {
  it("has all 5 metrics", () => {
    const names = MOCK_COMPARISON.map((e) => e.metric);
    expect(names).toContain("LCP");
    expect(names).toContain("CLS");
    expect(names).toContain("INP");
    expect(names).toContain("FCP");
    expect(names).toContain("TTFB");
  });

  it("bad values are always worse than optimized", () => {
    for (const entry of MOCK_COMPARISON) {
      expect(entry.bad).toBeGreaterThan(entry.optimized!);
    }
  });

  it("optimized LCP is under the good threshold", () => {
    const lcp = MOCK_COMPARISON.find((e) => e.metric === "LCP")!;
    expect(lcp.optimized).toBeLessThan(lcp.goodThreshold);
  });
});

describe("MOCK_LIGHTHOUSE", () => {
  it("has entries for both pages", () => {
    expect(MOCK_LIGHTHOUSE.find((l) => l.page === "bad")).toBeDefined();
    expect(MOCK_LIGHTHOUSE.find((l) => l.page === "optimized")).toBeDefined();
  });

  it("optimized performance score is >= 90", () => {
    const opt = MOCK_LIGHTHOUSE.find((l) => l.page === "optimized")!;
    expect(opt.performance).toBeGreaterThanOrEqual(90);
  });
});

describe("MOCK_BUNDLE_SIZES", () => {
  it("optimized total is less than bad total", () => {
    const bad = MOCK_BUNDLE_SIZES.find((b) => b.page === "bad")!;
    const opt = MOCK_BUNDLE_SIZES.find((b) => b.page === "optimized")!;
    expect(opt.totalKb).toBeLessThan(bad.totalKb);
  });
});

describe("generateTrend", () => {
  it("returns 7 data points", () => {
    expect(generateTrend("LCP", "bad")).toHaveLength(7);
  });

  it("bad trend values are higher than optimized", () => {
    const bad = generateTrend("LCP", "bad");
    const opt = generateTrend("LCP", "optimized");
    const badAvg = bad.reduce((s, d) => s + d.value, 0) / bad.length;
    const optAvg = opt.reduce((s, d) => s + d.value, 0) / opt.length;
    expect(badAvg).toBeGreaterThan(optAvg);
  });
});
