import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Strict mode catches subtle React bugs earlier in dev
  reactStrictMode: true,

  // standalone: copies only the minimum files needed to run the server.
  // Result: Docker image goes from ~1GB (full node_modules) to ~150MB.
  // This also dramatically reduces container cold-start time in ECS/Lambda.
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,

  // Remove console.* calls in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Used in /bad demo to pull large unoptimised images
      { protocol: "https", hostname: "loremflickr.com" },
    ],
    // avif → webp → jpeg fallback chain: measurable LCP improvement
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        // Next.js content-hashes these filenames; immutable = permanent CDN cache
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // s-maxage=60 → CDN serves from cache for 60s
          // stale-while-revalidate=300 → background refresh, no user-visible latency
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  experimental: {
    // Tree-shake large icon/chart libraries — only used exports are bundled
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default withBundleAnalyzer(nextConfig);
