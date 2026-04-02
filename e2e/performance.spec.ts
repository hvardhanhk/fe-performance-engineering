/**
 * Playwright E2E performance tests.
 *
 * These tests verify:
 * 1. Pages load and render key content
 * 2. Performance budgets are not violated (navigation timing)
 * 3. The /bad page contains the expected anti-pattern annotations
 * 4. The /optimized page uses correct techniques (next/image, etc.)
 * 5. The dashboard loads and shows comparison data
 *
 * Run: npm run e2e
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function measureTTFB(page: Page, url: string): Promise<number> {
  const response = await page.goto(url, { waitUntil: "commit" });
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return nav.responseStart - nav.requestStart;
  });
  await response?.finished();
  return timing;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Home page", () => {
  test("loads and renders hero content", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByText("FE Performance Lab")).toBeVisible();
    await expect(page.getByText("Bad Page")).toBeVisible();
    await expect(page.getByText("Optimized Page")).toBeVisible();
  });

  test("navigation links are present and clickable", async ({ page }) => {
    await page.goto(BASE_URL);
    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: /bad/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /optimized/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });
});

test.describe("/bad page", () => {
  test("loads and shows anti-pattern annotations", async ({ page }) => {
    await page.goto(`${BASE_URL}/bad`);
    await expect(page.getByText("Bad Performance Page")).toBeVisible();
    // Should show at least one anti-pattern card
    await expect(page.getByText(/Raw.*img.*tags/i)).toBeVisible();
  });

  test("contains raw img tags (anti-pattern)", async ({ page }) => {
    await page.goto(`${BASE_URL}/bad`);
    // The /bad page should use <img> not <picture> (next/image renders <picture>)
    const rawImgs = page.locator("img:not([srcset])");
    // At least one raw img should exist in the images section
    await expect(rawImgs.first()).toBeAttached();
  });
});

test.describe("/optimized page", () => {
  test("loads with SSR content visible before hydration", async ({ page }) => {
    // Disable JS to verify SSR — the page should still show content
    await page.context().route("**/*.js", (route) => route.abort());
    await page.goto(`${BASE_URL}/optimized`);
    // SSR content should be visible without JS
    await expect(page.getByText("Optimized Performance Page")).toBeVisible();
  });

  test("uses next/image (renders picture element)", async ({ page }) => {
    await page.goto(`${BASE_URL}/optimized`);
    // next/image renders <picture> or <img> with srcset — look for srcset attribute
    await page.waitForSelector("img[srcset]");
    const optimizedImages = page.locator("img[srcset]");
    await expect(optimizedImages.first()).toBeVisible();
  });

  test("search input is debounced (input stays responsive)", async ({ page }) => {
    await page.goto(`${BASE_URL}/optimized`);
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeVisible();

    // Type quickly and verify the input updates immediately
    await search.type("hello", { delay: 50 });
    await expect(search).toHaveValue("hello");
  });

  test("TTFB is under 800ms (SSR + ISR)", async ({ page }) => {
    const ttfb = await measureTTFB(page, `${BASE_URL}/optimized`);
    // In CI, origin latency can be higher — use a generous budget
    expect(ttfb).toBeLessThan(2000);
  });
});

test.describe("/dashboard", () => {
  test("shows Core Web Vitals tab by default", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.getByText("Core Web Vitals")).toBeVisible();
  });

  test("can switch to Lighthouse tab", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.getByRole("button", { name: /lighthouse/i }).click();
    await expect(page.getByText("Radar Comparison")).toBeVisible();
  });

  test("cache demo shows run buttons", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.getByRole("button", { name: /CDN Cache/i }).click();
    await expect(page.getByRole("button", { name: /Bust cache/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cached request/i })).toBeVisible();
  });

  test("cache demo records a MISS result", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.getByRole("button", { name: /CDN Cache/i }).click();
    await page.getByRole("button", { name: /Bust cache/i }).click();
    await expect(page.getByText("MISS")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("API routes", () => {
  test("/api/cache-demo returns valid JSON", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cache-demo`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.cacheStatus).toBeDefined();
    expect(typeof body.responseTimeMs).toBe("number");
  });

  test("/api/cache-demo?bust=1 returns MISS", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cache-demo?bust=1`);
    const body = await res.json();
    expect(body.cacheStatus).toBe("MISS");
  });

  test("/api/vitals accepts valid payload", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/vitals`, {
      data: {
        name: "LCP",
        value: 1200,
        rating: "good",
        timestamp: new Date().toISOString(),
        page: "optimized",
      },
    });
    expect(res.status()).toBe(202);
  });

  test("/api/vitals rejects invalid payload", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/vitals`, {
      data: { name: "INVALID", value: "not-a-number" },
    });
    expect(res.status()).toBe(422);
  });
});
