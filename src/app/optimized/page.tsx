/**
 * /optimized — Server Component entry point.
 *
 * WHY THIS STRUCTURE IMPROVES CWV:
 *
 * 1. SSR + Suspense streaming:
 *    - Server renders above-the-fold HTML immediately → fast LCP
 *    - <Suspense> streams below-the-fold sections independently
 *    - User sees meaningful content before any client JS runs
 *
 * 2. React Server Components (RSC):
 *    - Data fetching happens on the server → no client waterfall
 *    - Server components produce zero client JS → smaller bundle → faster FCP
 *
 * 3. next/image:
 *    - Serves avif/webp, correct dimensions → no CLS, smaller payload → LCP
 *    - priority prop on hero image → preloaded in <head> → early LCP candidate
 *
 * 4. next/font:
 *    - Font pre-loaded at build time → no FOUT → no font-swap CLS
 *
 * 5. Dynamic imports (below-the-fold components):
 *    - Chart / heavy UI only loaded when needed → smaller initial bundle → FCP/LCP
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { VitalsPanel } from "@/components/VitalsPanel";
import { OptimizedList } from "./OptimizedList";
import { OptimizedSearch } from "./OptimizedSearch";
import { LazyChart } from "./LazyChart";
import { OptimizationCard } from "./OptimizationCard";
import { PostsSkeleton } from "./PostsSkeleton";
import { WorkerSearchDemo } from "./WorkerSearchDemo";

export const metadata: Metadata = {
  title: "Optimized",
  description:
    "Best-practice frontend performance: SSR, RSC, next/image, code splitting, virtualisation, and debouncing.",
};

// ISR: revalidate every 60 seconds.
// Tradeoff: content may be up to 60s stale, but TTFB is near-instant (CDN cache hit).
// For a content feed this is usually acceptable; for real-time data use revalidate=0.
export const revalidate = 60;

// ─── Server-side data fetch ───────────────────────────────────────────────────
// Runs on the server → no client waterfall → data is in the HTML on first load.
// fetch() in Next.js App Router is automatically deduped and cached.

async function getPosts() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    // Next.js extended fetch options:
    // force-cache: cached for the revalidation window (ISR)
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json() as Promise<Array<{ id: number; title: string; body: string }>>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OptimizedPage() {
  // Data is fetched here on the server — NOT in useEffect on the client.
  // This means the data is embedded in the initial HTML → no client waterfall.
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <h1 className="text-3xl font-bold">Optimized Performance Page</h1>
          </div>
          <p className="text-[--foreground]/60 max-w-2xl">
            Every pattern here is chosen to improve a specific Core Web Vital.
            Compare your DevTools Performance trace against /bad.
          </p>
        </div>

        {/* Live vitals */}
        <VitalsPanel page="optimized" />

        {/* Optimisation annotations */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIMIZATIONS.map((opt) => (
            <OptimizationCard key={opt.title} {...opt} />
          ))}
        </div>

        {/* ✅ Hero image: next/image with explicit dimensions → no CLS.
            priority=true adds a <link rel="preload"> in the document head →
            browser starts loading the LCP candidate before JS runs. */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Images (next/image, reserved dimensions)</h2>
          <p className="text-xs text-[--foreground]/40">
            ✅ Explicit width/height prevents CLS. avif/webp served automatically. Priority preloads the hero.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i, idx) => (
              // ✅ Reserved aspect-ratio container → no layout shift
              <div key={i} className="relative aspect-[4/3] rounded overflow-hidden bg-[--surface-hover]">
                <Image
                  src={`https://picsum.photos/seed/${i * 10}/400/300`}
                  alt={`Demo image ${i}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                  // ✅ Only the first image is priority (above-fold LCP candidate)
                  priority={idx === 0}
                  // ✅ Lazy load all other images — saves bandwidth on initial load
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>

        {/*
          ✅ Suspense streaming: the list renders progressively.
          - Server sends the outer shell immediately (fast FCP)
          - PostsSkeleton shows with reserved dimensions (no CLS)
          - Data streams in as it resolves on the server
        */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">
            Virtualised + Debounced List ({posts.length} server-fetched items)
          </h2>
          <p className="text-xs text-[--foreground]/40">
            ✅ Virtualised (react-window) → only ~15 DOM nodes regardless of list size.
            ✅ Debounced search → main thread free between keystrokes → low INP.
          </p>
          <Suspense fallback={<PostsSkeleton />}>
            <OptimizedSearch posts={posts} />
          </Suspense>
        </div>

        {/*
          ✅ LazyChart uses dynamic import — the recharts bundle is only loaded
          when this section scrolls into view (IntersectionObserver).
          This removes ~100KB from the initial JS bundle → faster FCP.
        */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Chart (dynamically imported)</h2>
          <p className="text-xs text-[--foreground]/40">
            ✅ recharts loaded only when visible — removed from initial bundle.
          </p>
          <Suspense fallback={<div className="skeleton h-48 w-full rounded" />}>
            <LazyChart />
          </Suspense>
        </div>

        {/* ✅ Server-rendered list (RSC) — full list is in the HTML, zero JS */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Server-Rendered Posts (RSC)</h2>
          <p className="text-xs text-[--foreground]/40">
            ✅ This section is a React Server Component — rendered to HTML, zero client JS.
          </p>
          <Suspense fallback={<PostsSkeleton />}>
            <OptimizedList posts={posts.slice(0, 10)} />
          </Suspense>
        </div>

        {/*
          ✅ Web Worker demo — the deepest INP optimisation.
          Computation runs on a separate OS thread → main thread free to paint.
          Open DevTools → Performance to see the difference.
        */}
        <Suspense fallback={<div className="skeleton h-64 w-full rounded" />}>
          <WorkerSearchDemo posts={posts} />
        </Suspense>

      </div>
    </div>
  );
}

// ─── Optimisation annotations ─────────────────────────────────────────────────

const OPTIMIZATIONS = [
  {
    icon: "⚡",
    title: "SSR + ISR",
    description: "Server renders HTML; revalidates every 60s in background",
    metric: "LCP / TTFB",
    variant: "good" as const,
  },
  {
    icon: "🖼️",
    title: "next/image",
    description: "avif/webp, reserved dimensions, priority preload",
    metric: "CLS / LCP",
    variant: "good" as const,
  },
  {
    icon: "✂️",
    title: "Code splitting",
    description: "Charts loaded dynamically when scrolled into view",
    metric: "FCP / LCP",
    variant: "good" as const,
  },
  {
    icon: "🔍",
    title: "Debounced search",
    description: "300ms debounce frees main thread between keystrokes",
    metric: "INP",
    variant: "good" as const,
  },
  {
    icon: "📜",
    title: "Virtualised list",
    description: "react-window renders ~15 DOM nodes regardless of list size",
    metric: "INP / Memory",
    variant: "good" as const,
  },
  {
    icon: "🏗️",
    title: "React Server Components",
    description: "Server components produce zero client JS weight",
    metric: "FCP / Bundle",
    variant: "good" as const,
  },
  {
    icon: "💾",
    title: "Data caching",
    description: "ISR + TanStack Query — data served from cache by default",
    metric: "TTFB / LCP",
    variant: "good" as const,
  },
  {
    icon: "📐",
    title: "Skeleton loaders",
    description: "Reserved dimensions prevent layout shift during load",
    metric: "CLS",
    variant: "good" as const,
  },
  {
    icon: "🔤",
    title: "next/font",
    description: "Self-hosted, size-adjusted — zero font-swap CLS",
    metric: "CLS",
    variant: "good" as const,
  },
];
