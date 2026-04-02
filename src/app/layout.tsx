import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { VitalsReporter } from "@/components/VitalsReporter";
import { QueryProvider } from "@/components/QueryProvider";

/*
  Why Inter via next/font?
  - Self-hosted at build time → no third-party DNS lookup → faster FCP
  - size-adjust + ascent-override auto-computed → font-swap CLS = 0
  - Only the latin subset → smaller payload
*/
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FE Performance Lab",
    template: "%s | FE Performance Lab",
  },
  description:
    "A production-grade demonstration of frontend performance engineering: Core Web Vitals instrumentation, before/after comparisons, Lighthouse CI, CDN caching, and Edge vs Origin latency.",
  openGraph: {
    title: "FE Performance Lab",
    description: "Real-world frontend performance engineering demonstrations",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/*
          Resource hints — fired before any JavaScript runs.

          preconnect to picsum.photos: the /bad and /optimized pages both load
          images from this origin. Opening the TCP+TLS connection early saves
          ~100–200ms per image request. The crossOrigin attribute is required
          for CORS-enabled origins to share the connection.

          dns-prefetch: fallback for browsers that don't support preconnect.
          Resolves the DNS before the request starts — ~20–120ms saving.

          WHY THIS IMPROVES LCP:
          The hero image request starts as soon as the browser discovers the
          src attribute. If the TCP connection isn't open yet, the image must
          wait for: DNS (50ms) + TCP (50ms) + TLS (50ms) = 150ms before any
          data flows. preconnect eliminates this wait for the most critical origins.
        */}
        {/*
          GA4 — loaded only when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set.
          strategy="afterInteractive" defers the script until after hydration
          so it never blocks FCP or LCP. The gtag() calls in analytics.ts
          will no-op until this script runs.
        */}
        {process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}', {
                  send_page_view: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `}
            </Script>
          </>
        )}
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
        {/* jsonplaceholder — used for data fetching demos */}
        <link rel="preconnect" href="https://jsonplaceholder.typicode.com" />
        <link rel="dns-prefetch" href="https://jsonplaceholder.typicode.com" />
      </head>
      <body className="min-h-full flex flex-col bg-[--background] text-[--foreground]">
        {/*
          QueryProvider wraps the entire app in TanStack Query context.
          Client Component boundary is kept here (not in layout) so the
          layout itself stays a Server Component.
        */}
        <QueryProvider>
          {/*
            VitalsReporter: zero-render Client Component that registers
            web-vitals + Long Tasks + Navigation Timing observers.
            Placed before content so it captures all metrics from first load.
          */}
          <VitalsReporter />
          <Nav />
          <main className="flex-1">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
