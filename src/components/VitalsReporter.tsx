"use client";

/**
 * VitalsReporter — zero-render Client Component.
 *
 * Registers web-vitals listeners once on mount. Placed in the root layout
 * so it catches metrics regardless of which page the user navigates to.
 *
 * Why a separate component?
 * - The root layout itself can remain a Server Component.
 * - Dynamic import ensures web-vitals never appears in the server bundle.
 * - useEffect fires after hydration, so it never blocks the initial render.
 */

import { useEffect } from "react";
import { initVitals } from "@/lib/vitals";

export function VitalsReporter() {
  useEffect(() => {
    initVitals();
  }, []);

  return null;
}
