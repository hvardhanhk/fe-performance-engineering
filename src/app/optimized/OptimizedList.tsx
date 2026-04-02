/**
 * OptimizedList — React Server Component.
 *
 * No "use client" directive → zero JS shipped to the browser for this component.
 * Data comes from the parent server component (page.tsx) as props — no additional
 * network request from the client.
 */

interface Post {
  id: number;
  title: string;
  body: string;
}

export function OptimizedList({ posts }: { posts: Post[] }) {
  return (
    <ul className="space-y-2" role="list">
      {posts.map((post) => (
        <li
          key={post.id}
          className="px-3 py-3 rounded bg-[--surface-hover] text-sm"
        >
          <p className="font-medium">{post.title}</p>
          <p className="text-xs text-[--foreground]/40 mt-0.5 line-clamp-2">
            {post.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
