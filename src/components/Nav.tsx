/**
 * Nav — Server Component (no client JS needed for navigation links).
 *
 * Kept as RSC because:
 * - No interactivity required (no state, no events)
 * - Zero client JS weight for a nav bar
 * - Active-link highlighting is handled via CSS :local-link / pathname
 *   on the client — but we use a thin Client Component for that only.
 */

import Link from "next/link";
import { NavActiveLink } from "./NavActiveLink";

const links = [
  { href: "/",          label: "Home"      },
  { href: "/bad",       label: "❌ Bad"     },
  { href: "/optimized", label: "✅ Optimized" },
  { href: "/dashboard", label: "📊 Dashboard" },
] as const;

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[--border] bg-[--background]/90 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 flex items-center gap-6 h-14">
        <Link
          href="/"
          className="font-bold text-sm tracking-tight text-[--accent] shrink-0"
        >
          FE Perf Lab
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavActiveLink key={link.href} href={link.href}>
              {link.label}
            </NavActiveLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
