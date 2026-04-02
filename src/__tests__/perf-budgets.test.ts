/**
 * Performance budget tests.
 *
 * STAFF-LEVEL INSIGHT:
 * These tests enforce that our mock data (which reflects what Lighthouse CI
 * measures in the real build) stays within acceptable thresholds.
 *
 * They serve two purposes:
 * 1. Document the performance contract — someone reading this knows exactly
 *    what the team has committed to achieving.
 * 2. Catch accidental regressions — if someone adds a new heavy dependency
 *    to the /optimized page and mock bundle data is updated to reflect it,
 *    these tests will fail and require a conscious decision to update the budget.
 *
 * In a full production setup, these assertions would run against real
 * Lighthouse CI data stored in a database, not mock values. The pattern
 * is identical — you're asserting metric values against thresholds.
 *
 * "Performance budgets without CI enforcement are just aspirations."
 */

import { MOCK_COMPARISON, MOCK_BUNDLE_SIZES, MOCK_LIGHTHOUSE } from "@/lib/mock-data";
import { THRESHOLDS } from "@/lib/vitals";

// ─── Core Web Vitals budgets ──────────────────────────────────────────────────

describe("Optimized page Core Web Vitals budgets", () => {
  const opt = MOCK_COMPARISON;

  it("LCP must be under the 'good' threshold (2500ms)", () => {
    const lcp = opt.find((e) => e.metric === "LCP")!;
    expect(lcp.optimized).toBeLessThan(THRESHOLDS.LCP.good);
  });

  it("CLS must be under the 'good' threshold (0.1)", () => {
    const cls = opt.find((e) => e.metric === "CLS")!;
    expect(cls.optimized).toBeLessThan(THRESHOLDS.CLS.good);
  });

  it("INP must be under the 'good' threshold (200ms)", () => {
    const inp = opt.find((e) => e.metric === "INP")!;
    expect(inp.optimized).toBeLessThan(THRESHOLDS.INP.good);
  });

  it("FCP must be under the 'good' threshold (1800ms)", () => {
    const fcp = opt.find((e) => e.metric === "FCP")!;
    expect(fcp.optimized).toBeLessThan(THRESHOLDS.FCP.good);
  });

  it("TTFB must be under the 'good' threshold (800ms)", () => {
    const ttfb = opt.find((e) => e.metric === "TTFB")!;
    expect(ttfb.optimized).toBeLessThan(THRESHOLDS.TTFB.good);
  });
});

describe("Bad page metrics must be measurably worse (anti-pattern validation)", () => {
  // These tests ensure the /bad page still demonstrates the problems.
  // If someone accidentally optimises the /bad page, these will catch it.
  const opt = MOCK_COMPARISON;

  it("Bad LCP must be worse than good threshold", () => {
    const lcp = opt.find((e) => e.metric === "LCP")!;
    expect(lcp.bad).toBeGreaterThan(THRESHOLDS.LCP.poor);
  });

  it("Bad CLS must be worse than good threshold", () => {
    const cls = opt.find((e) => e.metric === "CLS")!;
    expect(cls.bad).toBeGreaterThan(THRESHOLDS.CLS.poor);
  });

  it("Bad INP must be worse than good threshold", () => {
    const inp = opt.find((e) => e.metric === "INP")!;
    expect(inp.bad).toBeGreaterThan(THRESHOLDS.INP.poor);
  });

  it("Optimized must be at least 50% better than bad on LCP", () => {
    const lcp = opt.find((e) => e.metric === "LCP")!;
    const improvement = (lcp.bad! - lcp.optimized!) / lcp.bad!;
    expect(improvement).toBeGreaterThan(0.5);
  });
});

// ─── Bundle size budgets ──────────────────────────────────────────────────────

describe("Bundle size budgets", () => {
  const optBundle = MOCK_BUNDLE_SIZES.find((b) => b.page === "optimized")!;

  it("Optimized JS bundle must be under 200KB", () => {
    expect(optBundle.jsKb).toBeLessThan(200);
  });

  it("Optimized total payload must be under 600KB", () => {
    expect(optBundle.totalKb).toBeLessThan(600);
  });

  it("Optimized image payload must be under 500KB", () => {
    expect(optBundle.imageKb).toBeLessThan(500);
  });

  it("Optimized JS must be at least 5× smaller than bad page JS", () => {
    const badBundle = MOCK_BUNDLE_SIZES.find((b) => b.page === "bad")!;
    expect(badBundle.jsKb / optBundle.jsKb).toBeGreaterThan(5);
  });
});

// ─── Lighthouse score budgets ─────────────────────────────────────────────────

describe("Lighthouse score budgets", () => {
  const optLH = MOCK_LIGHTHOUSE.find((l) => l.page === "optimized")!;

  it("Performance score >= 90", () => {
    expect(optLH.performance).toBeGreaterThanOrEqual(90);
  });

  it("Accessibility score >= 90", () => {
    expect(optLH.accessibility).toBeGreaterThanOrEqual(90);
  });

  it("Best practices score >= 90", () => {
    expect(optLH.bestPractices).toBeGreaterThanOrEqual(90);
  });

  it("SEO score >= 90", () => {
    expect(optLH.seo).toBeGreaterThanOrEqual(90);
  });
});

// ─── Threshold configuration integrity ───────────────────────────────────────

describe("THRESHOLDS configuration", () => {
  it("all five metrics have thresholds defined", () => {
    expect(THRESHOLDS.LCP).toBeDefined();
    expect(THRESHOLDS.CLS).toBeDefined();
    expect(THRESHOLDS.INP).toBeDefined();
    expect(THRESHOLDS.FCP).toBeDefined();
    expect(THRESHOLDS.TTFB).toBeDefined();
  });

  it("good threshold is always lower than poor threshold", () => {
    for (const [metric, t] of Object.entries(THRESHOLDS)) {
      expect(t.good).toBeLessThan(t.poor);
      // document the assertion so failures are readable
      if (t.good >= t.poor) {
        fail(`${metric}: good (${t.good}) must be < poor (${t.poor})`);
      }
    }
  });
});
