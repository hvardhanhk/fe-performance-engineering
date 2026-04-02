"use client";

/**
 * BadPageClient — all the anti-patterns in one place.
 *
 * Reading this file alongside /optimized/page.tsx shows the contrast.
 * Each ❌ comment maps to a specific CWV regression.
 */

import { useState, useEffect } from "react";
import { VitalsPanel } from "@/components/VitalsPanel";

// ❌ ANTI-PATTERN: Top-level static import of a heavy chart library.
//    Even if we never render a chart on this page, the entire recharts bundle
//    is included in this chunk. Code splitting would tree-shake this away.
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Fake "heavy" computation ─────────────────────────────────────────────────

/**
 * ❌ ANTI-PATTERN: Expensive calculation run synchronously on every render.
 * No useMemo → re-runs on every keystroke when search state changes.
 * Simulates a real-world mistake: filtering/sorting a large dataset inline.
 */
function expensiveFilter(items: Item[], query: string): Item[] {
  // Simulate O(n²) work
  let result = items;
  for (let pass = 0; pass < 3; pass++) {
    result = result.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  }
  return result;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: number;
  title: string;
  body: string;
}

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BadPageClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

  // ❌ ANTI-PATTERN: Data fetched in useEffect with no caching.
  //    Every mount (hot-reload, navigation back) re-fetches from the network.
  //    No loading placeholder with reserved dimensions → CLS.
  //    No SSR pre-fetch → blank page until JS runs → high LCP.
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        // Build 500 items (repeat the 100 API posts 5×) to demo no-virtualisation
        const expanded: Item[] = Array.from({ length: 5 }, (_, i) =>
          data.map((post: Post) => ({
            id: post.id + i * 100,
            title: `[Copy ${i + 1}] ${post.title}`,
            body: post.body,
          }))
        ).flat();
        setItems(expanded);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // ❌ ANTI-PATTERN: Synchronous localStorage read blocks the main thread
    //    during component mount. On slow devices this creates a long task → INP.
    const _cached = localStorage.getItem("bad-page-cache");

    // ❌ ANTI-PATTERN: Generating chart data inline with no memoisation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChartData(
      Array.from({ length: 20 }, (_, i) => ({
        name: String(i),
        value: Math.random() * 100,
      }))
    );
  }, []);

  // ❌ ANTI-PATTERN: No debounce on search → every keystroke triggers a
  //    synchronous re-render + the expensive expensiveFilter above → high INP.
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // ❌ ANTI-PATTERN: expensiveFilter runs on every render, not memoised.
  const filtered = expensiveFilter(items, query);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">❌</span>
          <h1 className="text-3xl font-bold">Bad Performance Page</h1>
        </div>
        <p className="text-[--foreground]/60 max-w-2xl">
          This page intentionally implements common performance anti-patterns.
          Open DevTools → Performance tab and compare against /optimized.
        </p>
      </div>

      {/* Live vitals */}
      <VitalsPanel page="bad" />

      {/* Anti-pattern annotations */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ANTIPATTERNS.map((ap) => (
          <div key={ap.title} className="card border-[--bad]/30">
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">{ap.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[--bad]">{ap.title}</p>
                <p className="text-xs text-[--foreground]/50 mt-0.5">{ap.description}</p>
                <span className="mt-1 inline-block text-xs bg-[--bad]/10 text-[--bad] px-1.5 py-0.5 rounded">
                  Harms: {ap.metric}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ❌ Chart with no lazy loading — loaded even if off-screen */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Chart (no lazy load)</h2>
        <p className="text-xs text-[--foreground]/40">
          ❌ recharts imported statically — full bundle loaded regardless of visibility
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="var(--bad)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ❌ Images with no dimensions → massive CLS */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Images (no dimensions, no next/image)</h2>
        <p className="text-xs text-[--foreground]/40">
          ❌ Raw &lt;img&gt; with no width/height → browser allocates 0px until image loads → CLS
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`https://picsum.photos/seed/${i * 10}/400/300`}
              alt={`Demo image ${i}`}
              // ❌ No width/height attributes
              // ❌ No loading="lazy"
              // ❌ Not using next/image (no optimisation, no format conversion)
              className="rounded w-full"
            />
          ))}
        </div>
      </div>

      {/* ❌ Unvirtualised list with no debounce on search */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">
          Large List ({filtered.length} items — no virtualisation)
        </h2>
        <p className="text-xs text-[--foreground]/40">
          ❌ All {items.length} DOM nodes rendered at once. ❌ No debounce on search input.
        </p>

        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search (no debounce)…"
          className="w-full bg-[--surface-hover] border border-[--border] rounded px-3 py-2 text-sm focus:outline-none focus:border-[--accent]"
        />

        {/* ❌ No height reservation → content jumps as loading state changes → CLS */}
        {loading ? (
          <p className="text-[--foreground]/40 text-sm">Loading…</p>
        ) : (
          // ❌ Rendering all items in the DOM — 500 nodes → huge memory + slow scroll → INP
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 rounded bg-[--surface-hover] text-sm"
              >
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-xs text-[--foreground]/40 truncate">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Anti-pattern annotations ─────────────────────────────────────────────────

const ANTIPATTERNS = [
  {
    icon: "🖼️",
    title: "Raw <img> tags",
    description: "No dimensions → layout shift as images load",
    metric: "CLS",
  },
  {
    icon: "📦",
    title: "No code splitting",
    description: "recharts & heavy deps imported at top level",
    metric: "FCP / LCP",
  },
  {
    icon: "🔄",
    title: "CSR-only rendering",
    description: "Server sends empty shell → nothing to paint",
    metric: "LCP / TTFB",
  },
  {
    icon: "⌨️",
    title: "No debounce",
    description: "Every keystroke triggers synchronous re-render",
    metric: "INP",
  },
  {
    icon: "📋",
    title: "No virtualisation",
    description: "500 DOM nodes rendered simultaneously",
    metric: "INP / Memory",
  },
  {
    icon: "🚫",
    title: "No memoisation",
    description: "Expensive filter re-runs on every render",
    metric: "INP",
  },
  {
    icon: "🌐",
    title: "No data caching",
    description: "Re-fetches on every mount, no stale-while-revalidate",
    metric: "LCP / TTFB",
  },
  {
    icon: "💾",
    title: "Sync localStorage read",
    description: "Blocks the main thread during mount",
    metric: "INP / Long tasks",
  },
  {
    icon: "📏",
    title: "No layout reservation",
    description: "Content jumps when loading state resolves",
    metric: "CLS",
  },
];
