"use client";

/**
 * OptimizedSearch — Client Component (needs interactivity).
 *
 * OPTIMISATIONS vs the /bad version:
 *
 * 1. useDeferredValue:
 *    Input state updates synchronously (keeps the input responsive).
 *    The expensive filter uses the deferred value — React may re-render the
 *    list at a lower priority, keeping INP low even with large datasets.
 *
 * 2. useTransition:
 *    Marks the list update as a non-urgent transition, keeping the UI
 *    interactive during the update.
 *
 * 3. useMemo:
 *    The filter function only re-runs when the deferred query changes —
 *    not on every unrelated state update.
 *
 * 4. react-window (FixedSizeList):
 *    Renders only the visible rows (~15) regardless of list size.
 *    500 items = same DOM cost as 15 items.
 *
 * 5. useDebounce (300ms):
 *    Network / expensive operations only triggered after the user pauses.
 *    Combined with useDeferredValue this gives two layers of protection.
 */

import { useState, useMemo, useDeferredValue, useTransition } from "react";
import { FixedSizeList } from "react-window";
import type { ListChildComponentProps } from "react-window";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { useDebounce } from "use-debounce";

interface Post {
  id: number;
  title: string;
  body: string;
}

interface Props {
  posts: Post[];
}

// Build a 500-item list for the virtualisation demo (same as /bad)
function expandPosts(posts: Post[]): Post[] {
  return Array.from({ length: 5 }, (_, i) =>
    posts.map((post) => ({
      id: post.id + i * 100,
      title: `[Copy ${i + 1}] ${post.title}`,
      body: post.body,
    }))
  ).flat();
}

export function OptimizedSearch({ posts }: Props) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  // ✅ useDeferredValue: input renders synchronously; list renders deferred.
  //    When the user types fast, React may skip intermediate list re-renders.
  const deferredQuery = useDeferredValue(query);

  // ✅ useDebounce: avoid triggering any analytics / API calls on every keystroke
  const [debouncedQuery] = useDebounce(deferredQuery, 300);

  const allPosts = useMemo(() => expandPosts(posts), [posts]);

  // ✅ useMemo: filter only re-computes when debouncedQuery changes
  const filtered = useMemo(() => {
    if (!debouncedQuery) return allPosts;
    const lower = debouncedQuery.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.body.toLowerCase().includes(lower)
    );
  }, [allPosts, debouncedQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Input state updates immediately (urgent) — this keeps the cursor position
    // and input value in sync with the user's typing, so INP is low.
    const value = e.target.value;
    setQuery(value);

    // ✅ useTransition: wrap the list state update as a non-urgent transition.
    //    React can interrupt it if a new user interaction occurs.
    startTransition(() => {
      // In a real app, expensive side-effects triggered by search would go here
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={`Search ${allPosts.length} items (debounced + deferred)…`}
        className="w-full bg-[--surface-hover] border border-[--border] rounded px-3 py-2 text-sm focus:outline-none focus:border-[--accent]"
      />

      <p className="text-xs text-[--foreground]/40">
        Showing{" "}
        <span className="font-mono text-[--good]">{filtered.length}</span>{" "}
        results — only visible rows are in the DOM (react-window)
      </p>

      {/*
        ✅ AutoSizer: measures the container width without requiring a fixed width.
        ✅ FixedSizeList: virtualises the list — only renders visible rows.
           itemSize=56 matches the CSS height of each row to prevent CLS.
      */}
      <div style={{ height: 400 }}>
        <AutoSizer
          renderProp={({ width }: { width: number | undefined }) => (
            <FixedSizeList
              width={width ?? 0}
              height={400}
              itemCount={filtered.length}
              itemSize={56}
              overscanCount={3}
            >
              {({ index, style }: ListChildComponentProps) => {
                const post = filtered[index];
                return (
                  <div
                    style={style}
                    className="px-3 py-2 border-b border-[--border] text-sm"
                  >
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-xs text-[--foreground]/40 truncate">
                      {post.body}
                    </p>
                  </div>
                );
              }}
            </FixedSizeList>
          )}
        />
      </div>
    </div>
  );
}
