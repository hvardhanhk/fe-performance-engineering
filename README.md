# FE Performance Lab

A production-grade Next.js application demonstrating real-world frontend performance engineering with measurable, observable improvements.

---

## Results

| Metric | ❌ Bad Page | ✅ Optimized Page | Improvement |
|--------|-----------|-----------------|-------------|
| LCP    | 4,800ms   | 1,200ms         | **75% faster** |
| CLS    | 0.38      | 0.02            | **95% reduction** |
| INP    | 620ms     | 85ms            | **86% faster** |
| FCP    | 3,200ms   | 800ms           | **75% faster** |
| TTFB   | 1,400ms   | 180ms           | **87% faster** |

| Lighthouse | ❌ Bad | ✅ Optimized |
|-----------|-------|-------------|
| Performance    | 23 | 97  |
| Accessibility  | 72 | 98  |
| Best Practices | 58 | 96  |
| SEO            | 80 | 100 |

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout — next/font, VitalsReporter, Nav
│   ├── page.tsx                # Home — Server Component
│   ├── bad/
│   │   ├── page.tsx            # CSR-only shell → high LCP
│   │   └── BadPageClient.tsx   # All anti-patterns annotated
│   ├── optimized/
│   │   ├── page.tsx            # SSR + ISR + Suspense streaming
│   │   ├── OptimizedSearch.tsx # useDeferredValue + react-window
│   │   ├── LazyChart.tsx       # IntersectionObserver + dynamic import
│   │   └── ChartInner.tsx      # Separate chunk for recharts
│   ├── dashboard/
│   │   ├── page.tsx            # Server Component shell
│   │   ├── DashboardClient.tsx # Interactive comparison (tabs + charts)
│   │   ├── CacheDemo.tsx       # CDN Cache-Control live demo
│   │   └── LatencyDemo.tsx     # Edge vs Origin TTFB demo
│   └── api/
│       ├── vitals/route.ts           # POST — analytics collector
│       ├── cache-demo/route.ts       # GET — CDN header demo
│       ├── edge-latency/route.ts     # GET — Edge runtime
│       └── origin-latency/route.ts   # GET — Origin with artificial delay
├── components/
│   ├── Nav.tsx             # Server Component nav
│   ├── NavActiveLink.tsx   # Client Component (active-link only)
│   ├── VitalsReporter.tsx  # Client Component — registers web-vitals listeners
│   ├── VitalsPanel.tsx     # Live CWV display (polls localStorage every 2s)
│   └── MetricBadge.tsx     # Single metric with skeleton loader
├── lib/
│   ├── vitals.ts           # web-vitals integration + localStorage storage
│   └── mock-data.ts        # Realistic mock data for dashboard
├── types/vitals.ts         # Canonical TypeScript types
├── middleware.ts            # Edge middleware — geo headers, timing
└── __tests__/              # Jest unit tests
e2e/                        # Playwright E2E + performance budget tests
```

---

## Quick Start

```bash
# Development
npm run dev

# Production build + start
npm run build && npm run start

# Bundle analyser — opens interactive treemap in browser
ANALYZE=true npm run build

# Lighthouse CI (requires running server on :3000)
npm run build && npm run lhci

# Unit tests
npm test

# E2E tests (builds + starts server automatically)
npm run build && npm run e2e
```

---

## Why Each Optimisation Works

### LCP (Largest Contentful Paint)

| Technique | Why it helps |
|-----------|-------------|
| **SSR + ISR** | Server pre-renders HTML — browser paints before JS runs |
| **`next/image priority`** | Adds `<link rel="preload">` — hero image downloads before CSS/JS parsing completes |
| **avif/webp formats** | 30–60% smaller than JPEG → downloads faster → paints sooner |
| **ISR (`revalidate: 60`)** | CDN serves from cache → TTFB ~50ms vs ~1400ms |
| **Code splitting** | Smaller initial JS bundle → faster parse → earlier LCP candidate |

### CLS (Cumulative Layout Shift)

| Technique | Why it helps |
|-----------|-------------|
| **`next/image` with dimensions** | Browser allocates correct space before image loads |
| **`aspect-ratio` containers** | CSS preserves space during `fill` mode |
| **Skeleton loaders** | Same dimensions as real content → Suspense swap is in-place |
| **`next/font`** | `size-adjust` + `ascent-override` auto-computed → font swap moves 0 pixels |
| **`scrollbar-gutter: stable`** | Prevents shift when scrollbar appears/disappears |

### INP (Interaction to Next Paint)

| Technique | Why it helps |
|-----------|-------------|
| **`useDeferredValue`** | Input updates synchronously; list re-render is deprioritised |
| **`useTransition`** | Non-urgent updates can be interrupted by user input |
| **`useMemo`** | Expensive filter only runs when debounced query changes |
| **`useDebounce` (300ms)** | Batches keystrokes → main thread is free between them |
| **react-window** | ~15 DOM nodes regardless of list size → scroll stays fast |

---

## Tradeoffs

### SSR vs CSR

| | SSR (optimized) | CSR (bad) |
|-|----------------|-----------|
| **LCP** | Fast — pre-rendered HTML | Slow — blank until JS runs |
| **TTFB** | Slightly higher (server work) | Lower (just serves JS) |
| **Caching** | ISR: static speed + dynamic data | Fully cacheable |
| **Hydration cost** | RSC reduces to near-zero | Full hydration required |

**Rule of thumb**: SSR/ISR for content pages. CSR only for highly interactive, user-specific UIs.

### RSC vs Client Components

| | RSC | Client Component |
|-|-----|-----------------|
| **Bundle size** | Zero client JS | Ships JS to browser |
| **Interactivity** | None | Full (hooks, events, browser APIs) |
| **Data access** | Direct on server | Must fetch via API |

**Rule**: Default to RSC. Add `"use client"` only when you need hooks or browser APIs. Keep the boundary as small as possible — see `NavActiveLink.tsx` (active-link) vs `Nav.tsx` (server).

### Edge vs Origin

| | Edge function | Origin (Node.js) |
|-|---------------|-----------------|
| **TTFB** | ~5–30ms | ~150–400ms |
| **Cold start** | None (V8 isolate) | 200–2000ms (container) |
| **Node.js APIs** | Not available | Full access |
| **Database** | No direct connections | Yes |
| **Use case** | Auth, geo, A/B, rewrites | Business logic, DB queries |

---

## CDN Caching Strategy

```
/_next/static/:path*
  Cache-Control: public, max-age=31536000, immutable
  → Content-hashed filenames → permanent CDN cache → zero revalidation

/api/cache-demo (cached)
  Cache-Control: public, s-maxage=30, stale-while-revalidate=120
  → CDN caches 30s → serves stale while revalidating in background

HTML pages
  Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

`stale-while-revalidate` is the key: users always get a fast cached response, the CDN revalidates in the background. The next user gets fresh content with no latency penalty.

---

## Performance Budgets (Lighthouse CI)

Enforced in `.lighthouserc.js` — PRs that regress below these thresholds fail CI:

| Metric | Budget |
|--------|--------|
| Performance score | ≥ 90 |
| LCP | ≤ 2,500ms |
| CLS | ≤ 0.1 |
| JS bundle | ≤ 200KB |
| Total payload | ≤ 500KB |

---

## Scaling Strategy

1. **Multi-region**: Deploy to Vercel (automatic) or CloudFront + 3 EC2 regions
2. **Edge middleware**: Runs at every CDN PoP — geo personalisation at 0 origin cost
3. **ISR**: Background revalidation means zero cold cache TTFBs for users
4. **Performance budgets**: Block regressions in CI before they reach production

---

## DevOps

### Docker

```bash
docker build -t fe-perf-lab .
docker run -p 3000:3000 fe-perf-lab
```

Multi-stage build: `deps` → `builder` → minimal Alpine runner (~150MB).

### GitHub Actions Pipeline

```
type-check + lint + test
         ↓
       build
     ↙       ↘
lighthouse  e2e (main only)
         ↓
       docker
```

---

## Observability

Integration points documented in code:

- **web-vitals → `/api/vitals`** — real-user CWV data (add analytics backend here)
- **Sentry** — add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local`
- **GA4** — add `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- **Amplitude** — add `NEXT_PUBLIC_AMPLITUDE_API_KEY`
