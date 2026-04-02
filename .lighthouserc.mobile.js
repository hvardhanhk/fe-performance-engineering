/**
 * Lighthouse CI — Mobile Configuration
 *
 * Mirrors .lighthouserc.js but simulates a mid-tier Android device on a
 * 4G connection. Real mobile users see dramatically different scores than
 * desktop — this run catches mobile-only regressions (excessive JS parse
 * time, large hero images not serving mobile sizes, etc.)
 *
 * Run locally:
 *   npm run lhci:mobile
 */

/** @type {import('@lhci/cli').LighthouseCIConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "started server on",
      startServerReadyTimeout: 60000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/optimized",
        "http://localhost:3000/dashboard",
      ],
      numberOfRuns: 3,
      settings: {
        // Lighthouse mobile preset: Moto G4-class device emulation
        preset: "perf",
        throttlingMethod: "devtools",
        // Simulates mid-tier 4G (typical emerging-market mobile conditions)
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        onlyCategories: ["performance", "accessibility"],
      },
    },

    assert: {
      assertMatrix: [
        // ─── /optimized — strict mobile budgets ──────────────────────────
        {
          matchingUrlPattern: ".*/optimized.*",
          assertions: {
            "categories:performance":   ["error", { minScore: 0.8  }],
            "categories:accessibility": ["error", { minScore: 0.9  }],

            // Mobile LCP/CLS/TBT thresholds are looser than desktop
            "largest-contentful-paint": ["error", { maxNumericValue: 4000  }],
            "cumulative-layout-shift":  ["error", { maxNumericValue: 0.1   }],
            "total-blocking-time":      ["warn",  { maxNumericValue: 600   }],
            "interactive":              ["warn",  { maxNumericValue: 7300  }],
            "first-contentful-paint":   ["warn",  { maxNumericValue: 3000  }],

            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",
            "unused-javascript":         ["warn", { maxLength: 10 }],
          },
        },

        // ─── /dashboard — moderate mobile budgets ────────────────────────
        {
          matchingUrlPattern: ".*/dashboard.*",
          assertions: {
            "categories:performance":   ["warn",  { minScore: 0.7  }],
            "categories:accessibility": ["error", { minScore: 0.9  }],
            "largest-contentful-paint": ["warn",  { maxNumericValue: 5000  }],
            "cumulative-layout-shift":  ["warn",  { maxNumericValue: 0.1   }],

            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",
          },
        },

        // ─── / (home) ─────────────────────────────────────────────────────
        {
          matchingUrlPattern: ".*localhost:3000/$",
          assertions: {
            "categories:performance":   ["warn", { minScore: 0.7 }],
            "categories:accessibility": ["warn", { minScore: 0.9 }],
            "largest-contentful-paint": ["warn", { maxNumericValue: 5000 }],

            "lcp-lazy-loaded":           "off",
            "non-composited-animations": "off",
            "prioritize-lcp-image":      "off",
          },
        },
      ],
    },

    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci-mobile",
    },
  },
};
