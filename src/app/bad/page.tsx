/**
 * /bad — Anti-pattern simulation page.
 *
 * INTENTIONAL performance issues (each labelled with the CWV metric it harms):
 *
 * 1. Raw <img> tags with no dimensions → CLS (layout shift as images load)
 * 2. No SSR — data fetched entirely on the client → LCP (nothing to paint)
 * 3. Render-blocking fake heavy bundle → FCP / LCP
 * 4. No code splitting — all heavy components imported at top level → JS parse time
 * 5. Synchronous localStorage read in render → INP / long tasks
 * 6. No debounce on search input → INP (main thread thrash per keystroke)
 * 7. Entire list re-renders on every keystroke → INP
 * 8. No virtualisation for 500-item list → memory + scroll INP
 * 9. Repeated expensive calculations on every render (no memo) → INP
 * 10. No caching — data re-fetched on every component mount → LCP / TTFB
 *
 * This is NOT production code. Each issue is annotated to explain what it
 * breaks and why the fix in /optimized works.
 */

import type { Metadata } from "next";
import { BadPageClient } from "./BadPageClient";

export const metadata: Metadata = {
  title: "Bad (Anti-patterns)",
  description:
    "Demonstration of common frontend performance anti-patterns that harm Core Web Vitals.",
};

// ❌ No ISR / SSG — page is CSR-only; the server sends an empty shell.
//    This maximises LCP because the user sees nothing until client JS runs.
export default function BadPage() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      {/* ❌ No reserved space here — the panel below pushes content down → CLS */}
      <BadPageClient />
    </div>
  );
}
