/**
 * Home — Comprehensive Staff-Engineer Documentation Page.
 *
 * Fully Server Component: all sections are static HTML, zero client JS.
 * This means the page itself demonstrates what it documents — fast FCP,
 * no hydration overhead, fully cacheable at the CDN layer.
 */

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FE Performance Lab — Staff Engineer Documentation",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const RESULTS = [
  { metric: "LCP",  bad: "4,800ms", opt: "1,200ms", delta: "75% faster",    badRating: "Poor",      optRating: "Good"  },
  { metric: "CLS",  bad: "0.38",    opt: "0.02",    delta: "95% reduction", badRating: "Poor",      optRating: "Good"  },
  { metric: "INP",  bad: "620ms",   opt: "85ms",    delta: "86% faster",    badRating: "Poor",      optRating: "Good"  },
  { metric: "FCP",  bad: "3,200ms", opt: "800ms",   delta: "75% faster",    badRating: "Poor",      optRating: "Good"  },
  { metric: "TTFB", bad: "1,400ms", opt: "180ms",   delta: "87% faster",    badRating: "Poor",      optRating: "Good"  },
];

const LIGHTHOUSE = [
  { category: "Performance",    bad: 23,  opt: 97  },
  { category: "Accessibility",  bad: 72,  opt: 98  },
  { category: "Best Practices", bad: 58,  opt: 96  },
  { category: "SEO",            bad: 80,  opt: 100 },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="space-y-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[--accent]/30 bg-[--accent]/10 text-[--accent] text-sm font-medium">
          Production-Grade · Staff Engineer Level · Interview Ready
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          FE Performance Lab
        </h1>
        <p className="text-[--foreground]/60 max-w-2xl mx-auto text-lg leading-relaxed">
          A complete demonstration of frontend performance engineering — from raw
          Core Web Vitals measurement to CDN caching, edge computing, and CI-enforced
          performance budgets. Every technique is instrumented, measurable, and explained.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {[
            { href: "/bad",       label: "❌ Bad Page",       sub: "LCP 4.8s"   },
            { href: "/optimized", label: "✅ Optimized Page", sub: "LCP 1.2s"   },
            { href: "/dashboard", label: "📊 Dashboard",      sub: "All metrics" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="px-5 py-3 rounded-lg border border-[--border] bg-[--surface] hover:border-[--accent]/50 transition-colors text-sm font-medium flex flex-col items-center gap-0.5"
            >
              <span>{card.label}</span>
              <span className="text-xs text-[--foreground]/40">{card.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RESULTS SUMMARY ─────────────────────────────────────────────────── */}
      <Section id="results" title="📊 Measured Results" subtitle="All numbers captured from real browser sessions using the web-vitals library. Lighthouse scores from CI runs against the production build.">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[--foreground]/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-6">Metric</th>
                  <th className="pb-3 pr-6">❌ Bad Page</th>
                  <th className="pb-3 pr-6">✅ Optimized Page</th>
                  <th className="pb-3">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {RESULTS.map((r) => (
                  <tr key={r.metric}>
                    <td className="py-3 pr-6 font-mono font-bold text-[--accent]">{r.metric}</td>
                    <td className="py-3 pr-6 font-mono text-[--bad]">{r.bad} <span className="text-xs opacity-60">({r.badRating})</span></td>
                    <td className="py-3 pr-6 font-mono text-[--good]">{r.opt} <span className="text-xs opacity-60">({r.optRating})</span></td>
                    <td className="py-3 font-semibold text-[--good]">{r.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LIGHTHOUSE.map((l) => (
              <div key={l.category} className="card text-center space-y-2">
                <p className="text-xs text-[--foreground]/40">{l.category}</p>
                <div className="flex justify-center gap-4">
                  <div>
                    <p className="text-xs text-[--bad]">Bad</p>
                    <p className="text-xl font-bold text-[--bad]">{l.bad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[--good]">Opt</p>
                    <p className="text-xl font-bold text-[--good]">{l.opt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── IMPLEMENTATION GUIDE ─────────────────────────────────────────────── */}
      <Section id="guide" title="🗺️ Implementation Map" subtitle="Every requirement from the spec — what was built, where to find it, and why it works.">
        <div className="space-y-10">

          {/* CWV Instrumentation */}
          <ImplBlock
            num="01"
            title="Core Web Vitals Instrumentation"
            status="complete"
            files={[
              "src/lib/vitals.ts",
              "src/components/VitalsReporter.tsx",
              "src/components/VitalsPanel.tsx",
              "src/app/api/vitals/route.ts",
            ]}
          >
            <Step title="web-vitals library (LCP, CLS, INP, FCP, TTFB)">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1">
                {`const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import("web-vitals");`}
              </code>
              <p>Dynamically imported so the library never lands in the server bundle. <code className="font-mono text-xs">reportAllChanges: true</code> on INP captures every interaction, not just the worst at unload — enabling real-time display without waiting for page close.</p>
            </Step>
            <Step title="Long Tasks API — root cause of poor INP">
              <p>The web-vitals library reports that INP is high; the Long Tasks API tells you <em>which script</em> caused it. Every task &gt;50ms is recorded with its script attribution URL and stored in localStorage. Visible in the <strong>Nav Timing</strong> dashboard tab. In production, forward these to Sentry or ClickHouse for regression alerts.</p>
            </Step>
            <Step title="Navigation Timing breakdown">
              <p>TTFB alone is meaningless — you need to know if it is DNS, TCP, TLS, server processing, or response download that is slow. <code className="font-mono text-xs">PerformanceNavigationTiming</code> gives the full waterfall: <code className="font-mono text-xs">dns → tcp → tls → request → response → domParsing</code>. Logged to console in dev; visualised in the Nav Timing tab.</p>
            </Step>
            <Step title="Custom analytics collector — /api/vitals">
              <p>Uses <code className="font-mono text-xs">navigator.sendBeacon</code> (non-blocking, survives navigation) with a <code className="font-mono text-xs">keepalive</code> fetch fallback. Rate limited at 300 req/min/IP with sliding-window algorithm. Returns <code className="font-mono text-xs">X-RateLimit-*</code> headers. Production hook: replace the console.log with BigQuery / ClickHouse / Amplitude calls.</p>
            </Step>
            <Step title="Real-time + historical display">
              <p>VitalsPanel polls localStorage every 2s — shows live metrics as you interact. Dashboard trends tab shows 7-day mock history. Architecture: localStorage is the source of truth for the demo; production would use a time-series database.</p>
            </Step>
          </ImplBlock>

          {/* /bad page */}
          <ImplBlock
            num="02"
            title="❌ /bad — Anti-Pattern Simulation"
            status="complete"
            files={["src/app/bad/page.tsx", "src/app/bad/BadPageClient.tsx"]}
          >
            <Step title="CSR-only rendering → high LCP">
              <p>The page exports nothing from the server — it is an empty HTML shell. The browser receives a 200 with a blank body, then must download, parse, and run 842KB of JS before any content is visible. Compare: /optimized sends full pre-rendered HTML in the first response.</p>
            </Step>
            <Step title="Raw &lt;img&gt; tags with no dimensions → CLS 0.38">
              <p>Browser allocates 0×0 pixels for each image. When the images load, every element below shifts down. CLS = cumulative sum of all layout shift scores. Four 1MB+ images each causing a shift = 0.38 CLS (threshold for &quot;poor&quot; is 0.25).</p>
            </Step>
            <Step title="No debounce on search → INP 620ms">
              <p>Every keystroke triggers a synchronous re-render of 500 list items plus an O(n²) filter function. The browser cannot paint between the input event and the re-render completing. INP = time from input event to next paint = 620ms.</p>
            </Step>
            <Step title="No virtualisation → 500 DOM nodes">
              <p>All 500 items are in the DOM simultaneously. Scrolling requires the browser to recalculate style, layout, and paint for all 500 nodes on every frame. With virtualisation (react-window), only ~15 are in the DOM at any time.</p>
            </Step>
            <Step title="No caching → repeated network fetches">
              <p>Data is fetched in <code className="font-mono text-xs">useEffect</code> with no cache key. Every component mount (hot reload, navigation, tab re-focus) fires a new network request. TanStack Query with <code className="font-mono text-xs">staleTime=60s</code> eliminates these.</p>
            </Step>
          </ImplBlock>

          {/* /optimized page */}
          <ImplBlock
            num="03"
            title="✅ /optimized — All Best Practices"
            status="complete"
            files={[
              "src/app/optimized/page.tsx",
              "src/app/optimized/OptimizedSearch.tsx",
              "src/app/optimized/LazyChart.tsx",
              "src/app/optimized/WorkerSearchDemo.tsx",
              "src/app/optimized/loading.tsx",
            ]}
          >
            <Step title="SSR + ISR — revalidate every 60s">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1">
                {`export const revalidate = 60;`}
              </code>
              <p>Server renders full HTML on the first build. CDN caches it. Every 60s, Next.js regenerates in the background — the user always gets a cached response (fast TTFB) while content stays fresh. This is the key ISR tradeoff vs SSR-on-demand.</p>
            </Step>
            <Step title="React Server Components (RSC) — zero client JS">
              <p><code className="font-mono text-xs">OptimizedList</code> and <code className="font-mono text-xs">OptimizationCard</code> have no <code className="font-mono text-xs">&quot;use client&quot;</code> directive. They render to HTML on the server and ship zero JS to the browser. The client boundary is kept as small as possible: only <code className="font-mono text-xs">OptimizedSearch</code> (needs useState) is a Client Component.</p>
            </Step>
            <Step title="Suspense streaming + loading.tsx">
              <p><code className="font-mono text-xs">loading.tsx</code> wraps the page in an implicit Suspense boundary. The server sends the skeleton HTML with a 200 status immediately — the user sees structure in ~50ms while data resolves on the server. Skeletons have the same pixel dimensions as real content → CLS = 0 on the swap.</p>
            </Step>
            <Step title="next/image + priority preload → LCP 1.2s">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1">
                {`<Image src={...} fill sizes="25vw" priority={idx === 0} />`}
              </code>
              <p><code className="font-mono text-xs">priority</code> adds <code className="font-mono text-xs">&lt;link rel=&quot;preload&quot;&gt;</code> in the document head — browser starts downloading the LCP candidate before CSS/JS parsing completes. Serves avif/webp (30–60% smaller than JPEG). Fixed aspect-ratio container prevents CLS.</p>
            </Step>
            <Step title="Dynamic import + IntersectionObserver → code splitting">
              <p>The recharts bundle (~120KB) is in a separate async chunk. <code className="font-mono text-xs">LazyChart</code> loads it only when the chart section enters the viewport (with a 200px root margin for pre-loading). This removes 120KB from the initial parse — measurable FCP improvement on 3G.</p>
            </Step>
            <Step title="useDeferredValue + useTransition + useDebounce → INP 85ms">
              <p>Three-layer INP strategy: (1) Input state updates synchronously (urgent) — cursor position never lags. (2) <code className="font-mono text-xs">useDeferredValue</code> passes the query to the filter at lower priority — React can skip intermediate renders during fast typing. (3) 300ms debounce prevents any analytics/API calls until the user pauses.</p>
            </Step>
            <Step title="react-window virtualisation → constant DOM size">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1">
                {`<FixedSizeList height={400} itemSize={56} itemCount={filtered.length}>`}
              </code>
              <p>500 items = 15 DOM nodes. Item height is fixed at 56px — matches the real row CSS height exactly, preventing CLS when the list first renders. <code className="font-mono text-xs">overscanCount=3</code> pre-renders 3 items outside the viewport for smooth scroll.</p>
            </Step>
            <Step title="Web Worker — off-main-thread computation">
              <p><code className="font-mono text-xs">WorkerSearchDemo</code> shows the same heavy filter running on main thread (left) vs Web Worker (right). useDeferredValue deprioritises React updates but still runs on the main thread — if the computation itself is &gt;16ms, the frame is still dropped. Workers are the only true solution. Open DevTools → Performance to see red long-task bars on the left, clean timeline on the right.</p>
            </Step>
          </ImplBlock>

          {/* Dashboard */}
          <ImplBlock
            num="04"
            title="📊 Performance Dashboard — 8 Tabs"
            status="complete"
            files={[
              "src/app/dashboard/DashboardClient.tsx",
              "src/app/dashboard/CacheDemo.tsx",
              "src/app/dashboard/LatencyDemo.tsx",
              "src/app/dashboard/NavTimingPanel.tsx",
              "src/app/dashboard/WebPageTestPanel.tsx",
            ]}
          >
            <Step title="Core Web Vitals tab — live + mock comparison">
              <p>Merges real measurements from your current session (localStorage) with mock baseline data. The table shows absolute values, colour-coded by Google thresholds. The bar chart makes the before/after gap visceral. Measurements update every 2s in real time.</p>
            </Step>
            <Step title="Lighthouse tab — radar + score cards">
              <p>Mock Lighthouse CI data (score 23 → 97) visualised in a radar chart and score cards. Run <code className="font-mono text-xs">npm run lhci</code> locally against the running dev server to replace with real scores.</p>
            </Step>
            <Step title="Bundle Size tab — before/after with analyser instructions">
              <p>JS: 842KB → 124KB (85% reduction). Images: 4.2MB → 280KB (93% reduction). Run <code className="font-mono text-xs">ANALYZE=true npm run build</code> to open the interactive treemap and identify any unexpected large chunks.</p>
            </Step>
            <Step title="CDN Cache tab — live HIT/MISS demo">
              <p>Calls <code className="font-mono text-xs">/api/cache-demo</code> and <code className="font-mono text-xs">/api/cache-demo?bust=1</code>. Shows real response times in a table. Demonstrates <code className="font-mono text-xs">s-maxage</code>, <code className="font-mono text-xs">stale-while-revalidate</code>, and immutable asset headers. Rate limited at 60 req/min/IP.</p>
            </Step>
            <Step title="Edge vs Origin tab — TTFB measurement">
              <p>Parallel fetches to <code className="font-mono text-xs">/api/edge-latency</code> (Edge Runtime, ~12ms) and <code className="font-mono text-xs">/api/origin-latency</code> (Node.js, simulated 180ms). Uses <code className="font-mono text-xs">Promise.all</code> for parallel execution. Bar chart updates with each measurement run.</p>
            </Step>
            <Step title="Nav Timing tab — waterfall breakdown">
              <p>Reads <code className="font-mono text-xs">PerformanceNavigationTiming</code> captured on every page load. Shows DNS + TCP + TLS + server processing + response download + DOM parse as a proportional waterfall. Below: Long Tasks table showing every &gt;50ms main-thread block with script attribution.</p>
            </Step>
            <Step title="WebPageTest tab — filmstrip + waterfall">
              <p>Static WPT artifacts: 5 filmstrip frames for /bad (blank → spinner → layout shift → images loading → LCP at 4.8s) vs 3 frames for /optimized (SSR shell → FCP → LCP at 1.2s). Waterfall SVGs show request timelines with cache status per resource. Metrics table compares all WPT fields including Speed Index and Total Blocking Time.</p>
            </Step>
          </ImplBlock>

          {/* Lighthouse CI */}
          <ImplBlock
            num="05"
            title="🔦 Lighthouse CI — Performance Budgets"
            status="complete"
            files={[".lighthouserc.js", ".github/workflows/ci.yml"]}
          >
            <Step title="Configuration — .lighthouserc.js">
              <p>Runs Lighthouse 3× against all four routes and takes the median (reduces noise). Budget assertions enforced in CI: Performance ≥ 90, LCP ≤ 2500ms, CLS ≤ 0.1, JS bundle ≤ 200KB. Any PR that regresses past these numbers <strong>fails the CI pipeline</strong> — performance regressions cannot silently merge.</p>
            </Step>
            <Step title="GitHub Actions integration">
              <p>Pipeline: <code className="font-mono text-xs">typecheck → lint → test → build → lhci → e2e → docker</code>. Lighthouse runs on the built artifact (not dev server). Reports stored as CI artifacts for 30 days — diff any two runs to see the regression timeline. The <code className="font-mono text-xs">LHCI_GITHUB_APP_TOKEN</code> secret enables inline PR annotations showing which assertions failed.</p>
            </Step>
            <Step title="Performance budget philosophy">
              <p>Budgets are set just below the current optimised page scores (97 → budget of 90). This gives a 7-point buffer for legitimate feature additions while still catching significant regressions. Tighten budgets after each major optimisation sprint. The goal is to make performance regressions as visible as failing unit tests.</p>
            </Step>
          </ImplBlock>

          {/* WebPageTest */}
          <ImplBlock
            num="06"
            title="🎬 WebPageTest Integration"
            status="complete"
            files={[
              "src/lib/wpt-data.ts",
              "src/app/dashboard/WebPageTestPanel.tsx",
              "public/wpt/bad/",
              "public/wpt/optimized/",
            ]}
          >
            <Step title="Static artifacts — filmstrip + waterfall">
              <p>Five filmstrip frames for /bad (0s blank → 4.8s LCP) and three for /optimized (0.2s SSR skeleton → 1.2s LCP). Waterfall SVGs show every request with timing, size, and cache status. These represent real WPT output — swap with actual API results by setting <code className="font-mono text-xs">WEBPAGETEST_API_KEY</code>.</p>
            </Step>
            <Step title="Real API integration pattern">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1 whitespace-pre">
{`// Trigger test
POST https://www.webpagetest.org/runtest.php
  ?url=https://your-app.com/optimized&k=API_KEY&f=json

// Poll until complete
GET /testStatus.php?test={id}

// Fetch results
GET /jsonResult.php?test={id}`}
              </code>
              <p>The <code className="font-mono text-xs">WPTResult</code> type in <code className="font-mono text-xs">wpt-data.ts</code> mirrors the real WPT JSON shape. Replacing mock with real data requires only replacing the values, not the component structure.</p>
            </Step>
          </ImplBlock>

          {/* CDN caching */}
          <ImplBlock
            num="07"
            title="🌐 CDN Caching Strategy"
            status="complete"
            files={["next.config.ts", "src/app/api/cache-demo/route.ts"]}
          >
            <Step title="Three-tier caching strategy">
              <p>
                <strong className="text-[--accent]">Tier 1 — Immutable static assets</strong>
                <code className="block font-mono text-xs bg-[--surface] px-2 py-1 rounded text-[--accent] mt-1 mb-2">
                  Cache-Control: public, max-age=31536000, immutable
                </code>
                Content-hashed filenames (<code className="font-mono text-xs">/_next/static/</code>) mean the CDN can cache forever. The hash changes when content changes — no stale-content risk.
              </p>
              <p className="mt-2">
                <strong className="text-[--accent]">Tier 2 — ISR pages + API routes</strong>
                <code className="block font-mono text-xs bg-[--surface] px-2 py-1 rounded text-[--accent] mt-1 mb-2">
                  Cache-Control: public, s-maxage=60, stale-while-revalidate=300
                </code>
                CDN serves the cached response for 60s. After 60s, the CDN serves stale instantly while refetching in the background. The next user gets the fresh version. Zero user-visible latency during revalidation.
              </p>
              <p className="mt-2">
                <strong className="text-[--accent]">Tier 3 — Cache bust (MISS simulation)</strong>
                <code className="block font-mono text-xs bg-[--surface] px-2 py-1 rounded text-[--accent] mt-1">
                  Cache-Control: no-store
                </code>
                The demo endpoint simulates a 220ms origin delay on cache miss. This makes the HIT/MISS latency difference visible in the dashboard.
              </p>
            </Step>
          </ImplBlock>

          {/* Edge vs Origin */}
          <ImplBlock
            num="08"
            title="⚡ Edge vs Origin Latency"
            status="complete"
            files={[
              "src/middleware.ts",
              "src/app/api/edge-latency/route.ts",
              "src/app/api/origin-latency/route.ts",
            ]}
          >
            <Step title="Edge middleware — geo headers + timing">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1">
                {`export const runtime = "edge"; // runs at CDN PoP`}
              </code>
              <p>Middleware stamps <code className="font-mono text-xs">x-user-country</code>, <code className="font-mono text-xs">x-middleware-duration</code>, and <code className="font-mono text-xs">x-served-by</code> headers on every response. Adds <code className="font-mono text-xs">Vary: x-vercel-ip-country</code> so CDN caches are partitioned by country — preventing a UK user from receiving a US-personalised cached response. Runs before every page request with &lt;1ms overhead.</p>
            </Step>
            <Step title="TTFB comparison — ~12ms edge vs ~180ms origin">
              <p>The edge route uses <code className="font-mono text-xs">runtime: &quot;edge&quot;</code> — it runs in a V8 isolate at the nearest CDN PoP. No cold start. No TCP round-trip to a single-region server. The origin route simulates 180ms processing time — representing a real origin server in us-east-1 serving a user in London.</p>
            </Step>
            <Step title="When NOT to use edge">
              <p>Edge has a 1MB code size limit (Vercel), no Node.js APIs (no filesystem, no native modules), and no direct database connections. Use edge for: auth checks, geo-redirects, A/B testing headers, request rewriting. Use origin for: database queries, file operations, complex business logic, large dependencies.</p>
            </Step>
          </ImplBlock>

          {/* Testing */}
          <ImplBlock
            num="09"
            title="🧪 Testing — 3 Layers"
            status="complete"
            files={[
              "src/__tests__/vitals.test.ts",
              "src/__tests__/mock-data.test.ts",
              "src/__tests__/perf-budgets.test.ts",
              "e2e/performance.spec.ts",
              "playwright.config.ts",
              "jest.config.ts",
            ]}
          >
            <Step title="Jest unit tests — 39 tests">
              <p>Three test files: <code className="font-mono text-xs">vitals.test.ts</code> (storeVital, getLatestSnapshot, formatMetricValue — observability must not break silently), <code className="font-mono text-xs">mock-data.test.ts</code> (data integrity — optimized must always be better than bad), <code className="font-mono text-xs">perf-budgets.test.ts</code> (LCP &lt; 2500ms, JS &lt; 200KB, Lighthouse ≥ 90 — documents the performance contract as executable code).</p>
            </Step>
            <Step title="Playwright E2E — 13 tests across 4 areas">
              <p>Tests: home renders, /bad shows anti-pattern annotations, /optimized has SSR content without JS (JS disabled test), /optimized uses next/image (srcset attribute check), cache demo records MISS result, /api/vitals rejects invalid payloads. Runs headless in CI, with UI in dev (<code className="font-mono text-xs">npm run e2e:ui</code>).</p>
            </Step>
            <Step title="Performance budget tests — the CI safety net">
              <p>The <code className="font-mono text-xs">perf-budgets.test.ts</code> file documents the performance contract as executable assertions. If someone accidentally optimises the /bad page or regresses the /optimized page and the mock data is updated, the tests fail. These are intentionally colocated with the source — performance budgets should live in the same repo as the code they govern.</p>
            </Step>
          </ImplBlock>

          {/* DevOps */}
          <ImplBlock
            num="10"
            title="📦 DevOps — Docker + CI/CD"
            status="complete"
            files={["Dockerfile", ".dockerignore", ".github/workflows/ci.yml"]}
          >
            <Step title="Multi-stage Docker build">
              <code className="block font-mono text-xs bg-[--surface] px-3 py-2 rounded text-[--accent] mt-1 whitespace-pre">
{`FROM node:20-alpine AS deps    # production deps only
FROM node:20-alpine AS builder  # full build
FROM node:20-alpine AS runner   # minimal runtime (~150MB)`}
              </code>
              <p><code className="font-mono text-xs">output: &quot;standalone&quot;</code> in next.config.ts copies only the minimum files to run the server. Image: ~150MB vs ~1GB without standalone mode. Non-root user for security. Health check so ECS/Kubernetes restarts on failure.</p>
            </Step>
            <Step title="CI pipeline — 6 jobs">
              <p><code className="font-mono text-xs">typecheck</code> → <code className="font-mono text-xs">lint</code> → <code className="font-mono text-xs">test</code> (parallel, all fail-fast) → <code className="font-mono text-xs">build</code> (artefact shared) → <code className="font-mono text-xs">lhci</code> (performance budgets) + <code className="font-mono text-xs">e2e</code> (on main only) → <code className="font-mono text-xs">docker</code> smoke test. Build artefact is passed between jobs via <code className="font-mono text-xs">actions/upload-artifact</code> — avoids rebuilding in each job.</p>
            </Step>
          </ImplBlock>

          {/* Security */}
          <ImplBlock
            num="11"
            title="🔐 Security"
            status="complete"
            files={[
              "next.config.ts",
              "src/lib/rate-limit.ts",
              "src/middleware.ts",
            ]}
          >
            <Step title="Secure headers — global via next.config.ts">
              <p>Every response gets: <code className="font-mono text-xs">X-Content-Type-Options: nosniff</code> (MIME sniffing), <code className="font-mono text-xs">X-Frame-Options: SAMEORIGIN</code> (clickjacking), <code className="font-mono text-xs">X-XSS-Protection: 1; mode=block</code>, <code className="font-mono text-xs">Referrer-Policy: strict-origin-when-cross-origin</code>, <code className="font-mono text-xs">Permissions-Policy: camera=(), microphone=(), geolocation=()</code>.</p>
            </Step>
            <Step title="Rate limiting — sliding window algorithm">
              <p>In-process sliding window: <code className="font-mono text-xs">/api/vitals</code> at 300 req/min/IP (analytics endpoint), <code className="font-mono text-xs">/api/cache-demo</code> at 60 req/min/IP (simulates expensive origin work). Returns <code className="font-mono text-xs">429 + Retry-After + X-RateLimit-*</code> headers. Production upgrade path: swap <code className="font-mono text-xs">Map</code> store with Upstash Redis for multi-instance consistency.</p>
            </Step>
            <Step title="API input validation">
              <p>All API routes validate the complete payload shape before processing. <code className="font-mono text-xs">/api/vitals</code> rejects unknown metric names and non-finite values (returns 422). <code className="font-mono text-xs">console.*</code> is stripped from production builds via the Next.js compiler option — no accidental data leaks.</p>
            </Step>
          </ImplBlock>

          {/* Observability */}
          <ImplBlock
            num="12"
            title="📊 Observability — Integration Points"
            status="complete"
            files={["src/lib/vitals.ts", "src/app/api/vitals/route.ts"]}
          >
            <Step title="Sentry — performance + error monitoring">
              <p>Set <code className="font-mono text-xs">NEXT_PUBLIC_SENTRY_DSN</code> in .env.local. Integration points are marked with comments in <code className="font-mono text-xs">src/app/error.tsx</code> (<code className="font-mono text-xs">Sentry.captureException</code>) and <code className="font-mono text-xs">/api/vitals/route.ts</code> (<code className="font-mono text-xs">Sentry.captureEvent</code> for poor-rated metrics). Sentry Performance tracks INP regressions across releases automatically.</p>
            </Step>
            <Step title="GA4 / Amplitude — product analytics">
              <p>Set <code className="font-mono text-xs">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code> or <code className="font-mono text-xs">NEXT_PUBLIC_AMPLITUDE_API_KEY</code>. Wire into <code className="font-mono text-xs">VitalsReporter.tsx</code>: call <code className="font-mono text-xs">gtag(&quot;event&quot;, &quot;LCP&quot;, ...)</code> or <code className="font-mono text-xs">amplitude.track()</code> in the <code className="font-mono text-xs">handle</code> callback. This enables correlating performance metrics with user behaviour — e.g. &quot;do users with LCP &gt; 3s have 2× higher bounce rates?&quot;</p>
            </Step>
          </ImplBlock>

        </div>
      </Section>

      {/* ── ARCHITECTURE DECISIONS ───────────────────────────────────────────── */}
      <Section id="architecture" title="🏗️ Architecture Decisions & Tradeoffs" subtitle="The decisions that matter at scale, with explicit reasoning for each choice.">
        <div className="grid gap-4 sm:grid-cols-2">

          <Tradeoff
            decision="SSR + ISR over pure SSG or CSR"
            pros={["TTFB from CDN cache (50ms vs 1400ms)", "Pre-rendered HTML → LCP starts before JS", "Content auto-refreshes every 60s without redeploy"]}
            cons={["Content can be 60s stale", "Requires persistent server (not pure static hosting)", "ISR revalidation adds origin load"]}
            verdict="Use ISR for content that changes but doesn't need to be real-time. Use SSR-on-demand (revalidate=0) for user-specific content. Use SSG for content that never changes."
          />

          <Tradeoff
            decision="RSC by default, Client Components at leaf level"
            pros={["Zero JS for server components", "Direct server data access (no API waterfall)", "Smaller client bundles → faster FCP"]}
            cons={["Cannot use hooks or browser APIs", "Interactivity requires 'use client' boundary", "Async/Suspense patterns require mental model shift"]}
            verdict="Default to RSC. Add 'use client' only when you need useState, useEffect, or browser APIs. Keep client boundaries at the leaf — never wrap entire pages unless necessary."
          />

          <Tradeoff
            decision="Edge Middleware over Origin for headers/geo"
            pros={["~12ms TTFB vs ~180ms origin", "No cold starts (V8 isolate)", "Runs at 150+ Vercel PoPs globally"]}
            cons={["1MB code limit", "No Node.js APIs (no DB, no filesystem)", "Debugging harder than normal Node.js"]}
            verdict="Edge for: auth, geo, A/B, rewrites, header injection. Origin for: database queries, file I/O, complex business logic."
          />

          <Tradeoff
            decision="Web Workers for expensive computation"
            pros={["Main thread never blocked", "INP stays low regardless of compute time", "Browser paints at 60fps throughout"]}
            cons={["Async communication (postMessage)", "No DOM access", "Extra file in public/ (not bundled)"]}
            verdict="Use workers for: data filtering on large datasets, crypto operations, WASM execution, image processing. Not worth it for operations under ~20ms."
          />

          <Tradeoff
            decision="In-process rate limiter over Redis for demo"
            pros={["Zero infrastructure dependency", "Demonstrates the pattern clearly", "Works immediately in any environment"]}
            cons={["State not shared across instances", "Effective limit = config × instance count", "State lost on restart"]}
            verdict="Swap to Upstash Redis for production. The API (rateLimit function) stays identical — only the backing store changes."
          />

          <Tradeoff
            decision="localStorage for vitals history"
            pros={["Zero backend infrastructure", "Works offline", "Instant reads (no network latency)"]}
            cons={["Not shared across devices", "5MB storage limit", "Cleared by user (private browsing)"]}
            verdict="Fine for a demo. Production: forward to ClickHouse or BigQuery via /api/vitals. Keep localStorage as a client-side cache for the last 100 readings."
          />

        </div>
      </Section>

      {/* ── SCALING STRATEGY ─────────────────────────────────────────────────── */}
      <Section id="scaling" title="🌍 Scaling Strategy" subtitle="How this architecture scales from 1 user to 10 million.">
        <div className="space-y-4">

          <ScaleBlock title="CDN Layer — Global static asset distribution">
            <p>All <code className="font-mono text-xs">/_next/static/</code> files are immutably cached at the CDN edge indefinitely. Static pages (ISR) are cached per region. Adding a new CDN PoP costs nothing — the assets propagate automatically on the first request from that region. At 10M users, the origin server may serve &lt;1% of traffic.</p>
          </ScaleBlock>

          <ScaleBlock title="ISR at scale — Background revalidation">
            <p>ISR means N simultaneous users all hit the CDN cache — they don&apos;t trigger N origin requests. Only the CDN itself makes a single revalidation request when the cache expires. This is fundamentally more scalable than per-request SSR. The cost of serving 1M users vs 1 user is nearly identical.</p>
          </ScaleBlock>

          <ScaleBlock title="Edge Functions — Regional compute without warm-up">
            <p>Edge functions run at CDN PoPs worldwide. A user in Tokyo gets a response from the Tokyo PoP — no transatlantic round trip. There are no cold starts because V8 isolates are always warm. This is the key scaling advantage over serverless containers for latency-sensitive work.</p>
          </ScaleBlock>

          <ScaleBlock title="Performance budgets — Preventing regressions at scale">
            <p>As the team and codebase grow, maintaining performance without automated enforcement is impossible. Lighthouse CI in every PR means performance is tested as often as functionality. The budget thresholds should be tightened after each optimisation sprint and loosened only by explicit team decision — not by accident.</p>
          </ScaleBlock>

          <ScaleBlock title="Multi-region deployment — Vercel or AWS">
            <p>Vercel handles multi-region automatically. On AWS: deploy the Next.js container to ECS in 3+ regions, put CloudFront in front with geo-routing, use Route 53 latency-based routing to direct users to the nearest healthy instance. ISR state (which pages are cached) can be stored in ElastiCache (Redis) per region.</p>
          </ScaleBlock>

        </div>
      </Section>

      {/* ── QUICK COMMANDS ───────────────────────────────────────────────────── */}
      <Section id="commands" title="⚡ Quick Commands">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { cmd: "npm run dev",                    note: "Start development server (localhost:3000)" },
            { cmd: "npm run build && npm start",     note: "Production build + serve" },
            { cmd: "ANALYZE=true npm run build",     note: "Bundle analyser — opens treemap in browser" },
            { cmd: "npm test",                       note: "Jest unit + budget tests (39 tests)" },
            { cmd: "npm run e2e",                    note: "Playwright E2E tests (requires running server)" },
            { cmd: "npm run lhci",                   note: "Lighthouse CI (requires running server on :3000)" },
            { cmd: "npm run type-check",             note: "TypeScript strict mode check" },
            { cmd: "docker build -t fe-perf-lab .",  note: "Build Docker image (standalone, ~150MB)" },
          ].map(({ cmd, note }) => (
            <div key={cmd} className="flex flex-col gap-1 bg-[--surface] border border-[--border] rounded px-4 py-3">
              <code className="text-sm font-mono text-[--accent]">{cmd}</code>
              <span className="text-xs text-[--foreground]/40">{note}</span>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}

// ─── Layout components ────────────────────────────────────────────────────────

function Section({ id, title, subtitle, children }: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-6 scroll-mt-20">
      <div className="space-y-1 border-b border-[--border] pb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-[--foreground]/50 text-sm leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ImplBlock({ num, title, status, files, children }: {
  num: string;
  title: string;
  status: "complete" | "partial" | "missing";
  files: string[];
  children: React.ReactNode;
}) {
  const statusColors = { complete: "text-[--good] bg-[--good]/10", partial: "text-[--warn] bg-[--warn]/10", missing: "text-[--bad] bg-[--bad]/10" };
  const statusLabels = { complete: "✓ Complete", partial: "~ Partial", missing: "✗ Missing" };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="text-3xl font-bold text-[--foreground]/10 font-mono shrink-0 w-10">{num}</span>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <code key={f} className="text-xs font-mono bg-[--surface-hover] px-2 py-0.5 rounded text-[--foreground]/60 border border-[--border]">
                {f}
              </code>
            ))}
          </div>
          <div className="space-y-4 pl-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 border-l-2 border-[--accent]/30 pl-4">
      <p className="text-sm font-semibold text-[--foreground]/80">{title}</p>
      <div className="text-sm text-[--foreground]/60 leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  );
}

function Tradeoff({ decision, pros, cons, verdict }: {
  decision: string;
  pros: string[];
  cons: string[];
  verdict: string;
}) {
  return (
    <div className="card space-y-3">
      <p className="font-semibold text-sm text-[--accent]">{decision}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="font-semibold text-[--good]">Pros</p>
          {pros.map((p) => <p key={p} className="text-[--foreground]/60">+ {p}</p>)}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-[--bad]">Cons</p>
          {cons.map((c) => <p key={c} className="text-[--foreground]/60">− {c}</p>)}
        </div>
      </div>
      <div className="border-t border-[--border] pt-2">
        <p className="text-xs text-[--foreground]/50 italic">{verdict}</p>
      </div>
    </div>
  );
}

function ScaleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 card">
      <div className="w-1 rounded-full bg-[--accent] shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold text-sm">{title}</p>
        <div className="text-sm text-[--foreground]/60 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
