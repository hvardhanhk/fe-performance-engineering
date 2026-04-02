"use client";

/**
 * Thin Client Component — only used for active-link highlighting.
 * This keeps the Nav server component clean while isolating client JS
 * to the smallest possible boundary.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface Props {
  href: string;
  children: React.ReactNode;
}

export function NavActiveLink({ href, children }: Props) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={clsx(
        "px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap",
        isActive
          ? "bg-[--accent] text-white"
          : "text-[--foreground]/70 hover:text-[--foreground] hover:bg-[--surface-hover]"
      )}
    >
      {children}
    </Link>
  );
}
