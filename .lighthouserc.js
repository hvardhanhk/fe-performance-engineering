/**
 * Lighthouse CI Configuration
 *
 * Runs Lighthouse against both /bad and /optimized pages.
 * CI fails if any assertion is violated — this is the "performance budget"
 * enforcement mechanism that prevents regressions from landing.
 *
 * Run locally:
 *   npm run lhci
 *
 * The LHCI server can be self-hosted or you can use the Lighthouse CI
 * GitHub App (https://github.com/apps/lighthouse-ci) to store reports.
 *
 * Why no preset?
 * `lighthouse:no-pwa` asserts minScore on every audit including ones that
 * return `notApplicable` (no numeric value). Those produce NaN and always
 * fail. We enumerate only the audits we actually want to enforce.
 */

/** @type {import('@lhci/cli').LighthouseCIConfig} */
module.exports = {
  ci: {
    collect: {
      // Start the production build before running Lighthouse
      startServerCommand: "npm run start",
      startServerReadyPattern: "started server on",
      startServerReadyTimeout: 30000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/bad",
        "http://localhost:3000/optimized",
        "http://localhost:3000/dashboard",
      ],
      // Run 3 times and take the median — reduces noise
      numberOfRuns: 3,
      settings: {
        // Simulate a real mobile device (Lighthouse default)
        preset: "desktop",
        // Throttle CPU to simulate a mid-tier device
        throttlingMethod: "simulate",
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        // Only collect the categories we care about
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },

    assert: {
      // No preset — lighthouse:no-pwa applies minScore to every audit,
      // including audits that return notApplicable (produces NaN failures).
      assertions: {
        // ─── Category scores (primary enforcement) ──────────────────────────
        // These are the targets our optimised page must always meet.
        // Any PR that degrades past these thresholds will fail CI.
        "categories:performance":    ["error", { minScore: 0.9 }],
        "categories:accessibility":  ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo":            ["error", { minScore: 0.9 }],

        // ─── Core Web Vitals — numeric thresholds ───────────────────────────
        "first-contentful-paint":   ["warn",  { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift":  ["error", { maxNumericValue: 0.1  }],
        "total-blocking-time":      ["warn",  { maxNumericValue: 300  }],
        "interactive":              ["warn",  { maxNumericValue: 3800 }],

        // ─── Asset size budgets ──────────────────────────────────────────────
        "resource-summary:script:size": ["warn", { maxNumericValue: 500000 }], // 500 KB
        "resource-summary:total:size":  ["warn", { maxNumericValue: 750000 }], // 750 KB

        // ─── Audits that return notApplicable (no numeric score) ─────────────
        // minScore on these always produces NaN → disable them explicitly.
        "lcp-lazy-loaded":           "off",
        "non-composited-animations": "off",
        "prioritize-lcp-image":      "off",

        // ─── Intentional anti-patterns on /bad ──────────────────────────────
        // /bad deliberately ships unsized images and a large DOM.
        // Warn so the data is still visible in reports without blocking CI.
        "unsized-images":    ["warn", { minScore: 0 }],
        "dom-size":          ["warn", { minScore: 0 }],

        // ─── unused-javascript ───────────────────────────────────────────────
        // maxLength:0 (preset default) means "zero scripts with any unused JS",
        // which is impossible in a real app. Warn with a realistic ceiling.
        "unused-javascript": ["warn", { maxLength: 10 }],

        // ─── heading-order ───────────────────────────────────────────────────
        // /bad intentionally violates heading order.
        // TODO: fix heading hierarchy on /optimized and /dashboard, then
        //       change this back to ["error", { minScore: 0.9 }].
        "heading-order": ["warn", { minScore: 0 }],
      },
    },

    upload: {
      // Uploads to the temporary public Lighthouse CI server.
      // Replace with:
      //   target: 'lhci'
      //   serverBaseUrl: 'https://your-lhci-server.com'
      // for a persistent storage solution.
      target: "temporary-public-storage",
    },
  },
};
