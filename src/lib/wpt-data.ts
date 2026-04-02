/**
 * WebPageTest result data.
 *
 * In a real CI setup these would be fetched from the WPT REST API
 * (api.webpagetest.org) after triggering a test run. Here we store
 * representative results as static data so the dashboard can display
 * them without a live WPT account.
 *
 * HOW TO CONNECT THE REAL API (staff-level):
 *   1. Set WEBPAGETEST_API_KEY in your env
 *   2. POST to api.webpagetest.org/runtest.php with your URL
 *   3. Poll GET /testStatus.php?test={id} until statusCode=200
 *   4. Fetch GET /jsonResult.php?test={id} for the full payload
 *   5. Store in your database / pass to this dashboard via props
 *
 * The structure below mirrors the WPT JSON response shape so swapping
 * in real data requires only replacing the values, not the types.
 */

export interface WPTMetrics {
  TTFB: number;           // ms
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  fullyLoaded: number;
  requests: number;
  bytesIn: number;        // KB
  lighthouse: {
    performance: number;  // 0–100
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

export interface WPTResult {
  page: "bad" | "optimized";
  testId: string;
  testUrl: string;
  location: string;
  connection: string;
  capturedAt: string;
  metrics: WPTMetrics;
  filmstripFrames: { time: string; src: string; label: string }[];
  waterfallSrc: string;
  summary: string;
}

export const WPT_RESULTS: WPTResult[] = [
  {
    page: "bad",
    testId: "mock-bad-001",
    testUrl: "/bad",
    location: "Dulles, VA (EC2)",
    connection: "Cable (5/1 Mbps, 28ms RTT)",
    capturedAt: "2025-01-15T10:00:00Z",
    metrics: {
      TTFB:                   1400,
      firstContentfulPaint:   3200,
      largestContentfulPaint: 4800,
      cumulativeLayoutShift:  0.38,
      totalBlockingTime:       980,
      speedIndex:             4100,
      fullyLoaded:            5200,
      requests:               12,
      bytesIn:                5242,  // KB
      lighthouse: {
        performance:    23,
        accessibility:  72,
        bestPractices:  58,
        seo:            80,
      },
    },
    filmstripFrames: [
      { time: "0.0s", src: "/wpt/bad/filmstrip-1.svg", label: "Blank (CSR not run)" },
      { time: "1.2s", src: "/wpt/bad/filmstrip-2.svg", label: "Loading spinner" },
      { time: "2.8s", src: "/wpt/bad/filmstrip-3.svg", label: "Partial — layout shifting" },
      { time: "4.2s", src: "/wpt/bad/filmstrip-4.svg", label: "Images loading (4.1MB)" },
      { time: "4.8s", src: "/wpt/bad/filmstrip-5.svg", label: "LCP — fully loaded" },
    ],
    waterfallSrc: "/wpt/bad/waterfall.svg",
    summary:
      "CSR-only rendering means the server sends an empty HTML shell. The browser must download, parse, and execute a 842KB JS bundle before any content is visible. Images are unoptimised JPEG (avg 1.3MB each) with no dimensions causing massive CLS. No caching means every request hits origin.",
  },
  {
    page: "optimized",
    testId: "mock-opt-001",
    testUrl: "/optimized",
    location: "Dulles, VA (EC2)",
    connection: "Cable (5/1 Mbps, 28ms RTT)",
    capturedAt: "2025-01-15T10:05:00Z",
    metrics: {
      TTFB:                    180,
      firstContentfulPaint:    800,
      largestContentfulPaint: 1200,
      cumulativeLayoutShift:  0.02,
      totalBlockingTime:        45,
      speedIndex:              950,
      fullyLoaded:            1800,
      requests:                 9,
      bytesIn:                422,   // KB
      lighthouse: {
        performance:    97,
        accessibility:  98,
        bestPractices:  96,
        seo:           100,
      },
    },
    filmstripFrames: [
      { time: "0.2s", src: "/wpt/optimized/filmstrip-1.svg", label: "SSR shell + skeletons" },
      { time: "0.8s", src: "/wpt/optimized/filmstrip-2.svg", label: "FCP — images preloaded" },
      { time: "1.2s", src: "/wpt/optimized/filmstrip-3.svg", label: "LCP ✅ fully painted" },
    ],
    waterfallSrc: "/wpt/optimized/waterfall.svg",
    summary:
      "ISR means the server returns pre-rendered HTML in 180ms (CDN cache hit). Hero image is preloaded in <head> so it starts downloading before JS runs. avif format reduces image payload by 95%. Code splitting means the initial JS chunk is 124KB. All static assets are immutably cached.",
  },
];
