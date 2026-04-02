/**
 * Unit tests for the web-vitals instrumentation library.
 * These are the most critical tests — if vitals.ts is broken,
 * we lose observability in production.
 */

import {
  storeVital,
  loadVitalsHistory,
  getLatestSnapshot,
  clearVitalsHistory,
  formatMetricValue,
  getRatingColor,
} from "@/lib/vitals";
import type { VitalMetric } from "@/types/vitals";

const makeMetric = (
  name: VitalMetric["name"],
  value: number,
  page: "bad" | "optimized" = "bad"
): VitalMetric => ({
  name,
  value,
  rating: "good",
  timestamp: new Date().toISOString(),
  page,
});

beforeEach(() => {
  clearVitalsHistory();
});

describe("storeVital / loadVitalsHistory", () => {
  it("stores and retrieves a metric", () => {
    const metric = makeMetric("LCP", 1200);
    storeVital(metric);
    const history = loadVitalsHistory();
    expect(history).toHaveLength(1);
    expect(history[0].name).toBe("LCP");
    expect(history[0].value).toBe(1200);
  });

  it("appends multiple metrics", () => {
    storeVital(makeMetric("LCP", 1200));
    storeVital(makeMetric("CLS", 0.05));
    storeVital(makeMetric("INP", 80));
    expect(loadVitalsHistory()).toHaveLength(3);
  });

  it("returns empty array when nothing stored", () => {
    expect(loadVitalsHistory()).toEqual([]);
  });
});

describe("getLatestSnapshot", () => {
  it("returns nulls when no metrics exist for a page", () => {
    const snap = getLatestSnapshot("optimized");
    expect(snap.lcp).toBeNull();
    expect(snap.cls).toBeNull();
    expect(snap.inp).toBeNull();
  });

  it("returns latest metric for each name", () => {
    storeVital(makeMetric("LCP", 2000, "optimized"));
    storeVital(makeMetric("LCP", 1200, "optimized")); // newer value
    storeVital(makeMetric("CLS", 0.02, "optimized"));

    const snap = getLatestSnapshot("optimized");
    // Should return the most recent LCP
    expect(snap.lcp?.value).toBe(1200);
    expect(snap.cls?.value).toBe(0.02);
  });

  it("isolates metrics by page", () => {
    storeVital(makeMetric("LCP", 4800, "bad"));
    storeVital(makeMetric("LCP", 1200, "optimized"));

    expect(getLatestSnapshot("bad").lcp?.value).toBe(4800);
    expect(getLatestSnapshot("optimized").lcp?.value).toBe(1200);
  });
});

describe("formatMetricValue", () => {
  it("formats LCP in ms", () => {
    expect(formatMetricValue("LCP", 1234)).toBe("1234ms");
  });

  it("formats CLS with 3 decimal places", () => {
    expect(formatMetricValue("CLS", 0.123456)).toBe("0.123");
  });

  it("formats INP in ms", () => {
    expect(formatMetricValue("INP", 85.7)).toBe("86ms");
  });
});

describe("getRatingColor", () => {
  it("returns green for good", () => {
    expect(getRatingColor("good")).toBe("var(--good)");
  });

  it("returns amber for needs-improvement", () => {
    expect(getRatingColor("needs-improvement")).toBe("var(--warn)");
  });

  it("returns red for poor", () => {
    expect(getRatingColor("poor")).toBe("var(--bad)");
  });
});
