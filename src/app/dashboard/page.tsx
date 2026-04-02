import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";
import { MOCK_COMPARISON, MOCK_LIGHTHOUSE, MOCK_BUNDLE_SIZES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Before vs after performance comparison: Core Web Vitals, Lighthouse scores, and bundle sizes.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">📊 Performance Dashboard</h1>
          <p className="text-[--foreground]/60 max-w-2xl">
            Side-by-side comparison of /bad vs /optimized. Real metrics captured
            from your browser session + mock Lighthouse CI data.
          </p>
        </div>

        {/* Quick-navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/bad",       label: "❌ Bad Page",      sub: "View anti-patterns" },
            { href: "/optimized", label: "✅ Optimized Page", sub: "View best practices" },
            { href: "/api/cache-demo?bust=1", label: "🌐 Cache Demo", sub: "Test CDN headers" },
          ].map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="card hover:border-[--accent]/60 transition-colors group block"
            >
              <p className="font-semibold group-hover:text-[--accent] transition-colors">
                {card.label}
              </p>
              <p className="text-xs text-[--foreground]/40 mt-1">{card.sub}</p>
            </a>
          ))}
        </div>

        <Suspense fallback={<div className="skeleton h-[600px] w-full rounded" />}>
          <DashboardClient
            comparison={MOCK_COMPARISON}
            lighthouse={MOCK_LIGHTHOUSE}
            bundles={MOCK_BUNDLE_SIZES}
          />
        </Suspense>
      </div>
    </div>
  );
}
