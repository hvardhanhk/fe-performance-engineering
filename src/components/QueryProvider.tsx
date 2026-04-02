"use client";

/**
 * QueryProvider — wraps the app in TanStack Query's QueryClientProvider.
 *
 * WHY A SEPARATE COMPONENT:
 * QueryClientProvider requires 'use client'. The root layout must remain
 * a Server Component for RSC to work. Isolating the provider here keeps
 * the client boundary as small as possible.
 *
 * WHY TANSTACK QUERY IMPROVES PERFORMANCE:
 *
 * 1. Deduplication: if 5 components request the same URL simultaneously,
 *    only ONE network request fires. Without TanStack Query you'd get 5.
 *
 * 2. staleTime: the window during which cached data is served without
 *    any revalidation. Setting staleTime=60000 means navigating back to
 *    a page within 60s serves instant cached data — no spinner, no request.
 *    This directly improves LCP on repeat visits.
 *
 * 3. Background refetch: when staleTime expires, TanStack Query refetches
 *    in the background while showing stale data. User never waits.
 *    This is client-side stale-while-revalidate, mirroring ISR on the server.
 *
 * 4. gcTime: how long unused cache entries stay in memory. Set high for
 *    data that doesn't change often (config, user profile) — instant
 *    navigation when the user returns.
 *
 * Tradeoff: staleTime means users might see data up to N ms old.
 * For real-time data (stock prices, live scores), set staleTime=0.
 * For content that rarely changes, staleTime=300000 (5min) is reasonable.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime: 60s — cached data served instantly during this window.
        // This is the most impactful setting for perceived performance.
        staleTime: 60 * 1000,
        // gcTime: 5min — keep unused cache entries alive for back-navigation
        gcTime: 5 * 60 * 1000,
        // Don't retry on error in development — fail fast for debugging
        retry: process.env.NODE_ENV === "production" ? 3 : 0,
        // Refetch when the tab regains focus — keeps data fresh on long sessions
        refetchOnWindowFocus: true,
      },
    },
  });
}

// Singleton on the server (avoids creating a new client per request)
// New instance on the client (avoids shared state between users in SSR)
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: reuse the existing client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures the client is only created once per component mount
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development — zero production cost */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
