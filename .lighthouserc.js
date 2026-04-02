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
 * Why no preset?
 * `lighthouse:no-pwa` asserts minScore on every audit including ones that
 * return `notApplicable` (no numeric value). Those produce NaN and always
 * fail. We enumerate only the audits we actually want to enforce.
 *
 * Why assertMatrix?
 * /bad intentionally fails accessibility and performance audits — applying
 * the same strict assertions to it would mean suppressing them globally,
 * which lets real bugs on /optimized and /dashboard go undetected.
 * assertMatrix applies different rules per URL pattern.
 */

/** @type {import('@lhci/cli').LighthouseCIConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "started server on",
      // 60s — cold CI runners with no warm cache need the extra headroom
      startServerReadyTimeout: 60000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/bad",
        "http://localhost:3000/optimized",
        "http://localhost:3000/dashboard",
      ],
      // 3 runs → median is taken — smooths out single-run noise
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        // devtools throttling actually applies CPU/network via Chrome DevTools
        // Protocol — closer to real field data than simulate's mathematical model
        throttlingMethod: "devtools",
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },

    assert: {
      // Per-URL assertion rules.
      // Strict budgets on /optimized and /dashboard (our "good" pages).
      // Relaxed on /bad (intentional anti-pattern demo) and / (home).
      assertMatrix: [
        // ─── /optimized and /dashboard — strict enforcement ────────────────
        {
          matchingUrlPattern: ".*/(optimized|dashboard).*",
          assertions: {
            // Category scores
            "categories:performance":    ["error", { minScore: 0.9 }],
            "categories:accessibility":  ["error", { minScore: 0.9 }],
            "categories:best-practices": ["error", { minScore: 0.9 }],
            "categories:seo":            ["error", { minScore: 0.9 }],

            // Core Web Vitals
            "first-contentful-paint":   ["warn",  { maxNumericValue: 1800 }],
            "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
            "cumulative-layout-shift":  ["error", { maxNumericValue: 0.1  }],
            "total-blocking-time":      ["warn",  { maxNumericValue: 300  }],
            "interactive":              ["warn",  { maxNumericValue: 3800 }],

            // Accessibility — now enforced since heading-order is fixed
            "heading-order": ["error", { minScore: 0.9 }],

            // Asset budgets
            "resource-summary:script:size": ["warn", { maxNumericValue: 500000 }],
            "resource-summary:total:size":  ["warn", { maxNumericValue: 750000 }],

            // Audits that return notApplicable — disable to avoid NaN
            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",

            // Realistic unused-JS ceiling
            "unused-javascript": ["warn", { maxLength: 10 }],
          },
        },

        // ─── / (home) — moderate enforcement ──────────────────────────────
        {
          matchingUrlPattern: ".*localhost:3000/$",
          assertions: {
            "categories:performance":    ["warn",  { minScore: 0.8 }],
            "categories:accessibility":  ["error", { minScore: 0.9 }],
            "categories:best-practices": ["error", { minScore: 0.9 }],
            "categories:seo":            ["error", { minScore: 0.9 }],

            "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
            "cumulative-layout-shift":  ["warn", { maxNumericValue: 0.1  }],

            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",
            "unused-javascript":         ["warn", { maxLength: 10 }],
          },
        },

        // ─── /bad — intentional anti-pattern demo, minimal assertions ─────
        {
          matchingUrlPattern: ".*/bad.*",
          assertions: {
            // Only assert it doesn't completely crash (score > 0)
            "categories:performance":    ["warn", { minScore: 0.1 }],
            // Don't enforce accessibility/heading/images — all intentionally bad
            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",
          },
        },
      ],
    },

    upload: {
      // Saves reports to .lighthouseci/ so CI can upload them as artifacts.
      // Switch to target:'lhci' + serverBaseUrl for persistent trend history.
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
