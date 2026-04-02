/**
 * 404 — Server Component (no client JS needed).
 *
 * Performance note: next/navigation's `notFound()` throws a special
 * signal that Next.js catches and renders this page. It returns a 404
 * status code which prevents search engines from indexing broken URLs
 * (important for Core Web Vitals field data — crawlers can skew your CrUX scores).
 */

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <p className="text-6xl font-bold text-[--foreground]/10">404</p>
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-[--foreground]/50">
            This page doesn&apos;t exist. Check the URL or navigate back.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[--accent] hover:bg-[--accent-hover] text-white font-medium text-sm transition-colors"
        >
          ← Back to Performance Lab
        </Link>
      </div>
    </div>
  );
}
