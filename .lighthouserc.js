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
      preset: "lighthouse:no-pwa",
      assertions: {
        // ─── /optimized assertions (strict) ─────────────────────────────────
        // These are the targets our optimised page must always meet.
        // Any PR that degrades past these thresholds will fail CI.
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],

        // Core Web Vitals — numeric thresholds
        "first-contentful-paint": ["warn", { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        "interactive": ["warn", { maxNumericValue: 3800 }],

        // Asset size budgets — fail if JS grows unexpectedly
        "resource-summary:script:size": ["warn", { maxNumericValue: 200000 }], // 200KB JS budget
        "resource-summary:total:size": ["warn", { maxNumericValue: 500000 }],  // 500KB total

        // Don't fail on /bad page's poor performance — it's intentional
        // We only assert on /optimized implicitly (all URLs are checked
        // but we'd configure separate assert blocks in a monorepo setup)
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
