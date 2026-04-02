"use client";

/**
 * WorkerSearchDemo — side-by-side comparison of main-thread vs Worker filtering.
 *
 * LEFT SIDE: filter runs synchronously on the main thread (same as /bad)
 * RIGHT SIDE: filter runs in a Web Worker — main thread free to paint at 60fps
 *
 * HOW TO OBSERVE THE DIFFERENCE:
 * 1. Open DevTools → Performance tab
 * 2. Type quickly in both inputs
 * 3. Left input: you'll see long tasks (red bars) blocking frames
 * 4. Right input: main thread stays clean; worker does the work
 *
 * STAFF-LEVEL NUANCE:
 * The Web Worker result arrives asynchronously (~1-2ms message round-trip).
 * During that window the UI shows the previous result, not a blank state.
 * This is acceptable because: the user typed a character and is still typing —
 * they don't expect instant results. The 1-2ms round-trip is imperceptible.
 *
 * For truly instant results you'd combine: Worker (compute) + optimistic UI
 * (show previous results while worker processes) = low INP + fresh data.
 */

import { useState, useTransition, useRef } from "react";
import { useWebWorker } from "@/hooks/useWebWorker";

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Props {
  posts: Post[];
}

// Heavy synchronous filter — same as the /bad page intentionally
function heavyFilterMainThread(posts: Post[], query: string): Post[] {
  if (!query) return posts;
  const lower = query.toLowerCase();
  // Simulate extra work to make the blocking visible in DevTools
  let result = posts;
  for (let pass = 0; pass < 5; pass++) {
    result = result.filter(
      (p) => p.title.toLowerCase().includes(lower) || p.body.toLowerCase().includes(lower)
    );
  }
  return result;
}

export function WorkerSearchDemo({ posts }: Props) {
  const [mainQuery, setMainQuery]       = useState("");
  const [workerQuery, setWorkerQuery]   = useState("");
  const [mainResults, setMainResults]   = useState<Post[]>(posts);
  const [workerResults, setWorkerResults] = useState<Post[]>(posts);
  const [workerMs, setWorkerMs]          = useState<number | null>(null);
  const [mainMs, setMainMs]              = useState<number | null>(null);
  const [, startTransition]              = useTransition();

  const { postMessage } = useWebWorker("/workers/heavy-compute.worker.js");
  const workerTimerRef = useRef<number>(0);

  // ── Main-thread path ──────────────────────────────────────────────────────
  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setMainQuery(q);
    const start = performance.now();
    // startTransition does NOT help here — the filter still blocks the thread
    startTransition(() => {
      setMainResults(heavyFilterMainThread(posts, q));
      setMainMs(Math.round(performance.now() - start));
    });
  };

  // ── Worker path ───────────────────────────────────────────────────────────
  const handleWorkerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setWorkerQuery(q);

    // Update input immediately — this is the URGENT state update
    // The results update asynchronously when the worker responds

    const clientStart = performance.now();
    workerTimerRef.current = clientStart;

    const results = await postMessage<Post[]>("FILTER_POSTS", {
      posts,
      query: q,
    });

    // Only apply if this is still the latest request (basic debounce)
    if (clientStart >= workerTimerRef.current) {
      setWorkerResults(results ?? posts);
      setWorkerMs(Math.round(performance.now() - clientStart));
    }
  };

  return (
    <div className="card space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          Web Worker vs Main Thread
        </h2>
        <p className="text-xs text-[--foreground]/50">
          Type in both boxes simultaneously. Open DevTools → Performance → record
          to see long tasks (red) on the left but not the right.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ── Main thread ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[--bad]">
              ❌ Main Thread (blocks paint)
            </span>
            {mainMs !== null && (
              <span className="text-xs font-mono" style={{ color: mainMs > 50 ? "var(--bad)" : "var(--warn)" }}>
                {mainMs}ms
              </span>
            )}
          </div>
          <input
            type="search"
            value={mainQuery}
            onChange={handleMainChange}
            placeholder="Filter on main thread…"
            className="w-full bg-[--surface-hover] border border-[--bad]/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-[--bad]"
          />
          <div className="text-xs text-[--foreground]/40">
            {mainResults.length} results
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {mainResults.slice(0, 10).map((p) => (
              <div key={p.id} className="px-2 py-1.5 rounded bg-[--surface-hover] text-xs">
                <p className="font-medium truncate">{p.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Web Worker ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[--good]">
              ✅ Web Worker (non-blocking)
            </span>
            {workerMs !== null && (
              <span className="text-xs font-mono text-[--good]">
                {workerMs}ms round-trip
              </span>
            )}
          </div>
          <input
            type="search"
            value={workerQuery}
            onChange={handleWorkerChange}
            placeholder="Filter in Web Worker…"
            className="w-full bg-[--surface-hover] border border-[--good]/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-[--good]"
          />
          <div className="text-xs text-[--foreground]/40">
            {workerResults.length} results
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {workerResults.slice(0, 10).map((p) => (
              <div key={p.id} className="px-2 py-1.5 rounded bg-[--surface-hover] text-xs">
                <p className="font-medium truncate">{p.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[--surface-hover] rounded p-3 text-xs space-y-1 text-[--foreground]/50">
        <p className="font-semibold text-[--foreground]/70">Why this matters</p>
        <p>
          The Web Worker runs on a separate OS thread. Even if the computation takes 200ms,
          the browser paints at 60fps throughout — INP stays low.
          useDeferredValue helps but still runs on the main thread; Web Workers are the
          only way to achieve true non-blocking computation.
        </p>
      </div>
    </div>
  );
}
