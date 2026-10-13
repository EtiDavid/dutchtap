import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (only the files
  // actually needed at runtime) — the standard approach for a lean
  // Docker image, instead of shipping the whole node_modules tree.
  output: "standalone",
  // The dev-only badge defaults to bottom-left, where it would cover the Home tab of the bottom navigation.
  devIndicators: { position: "top-right" },
  async headers() {
    // The worker file itself must never be served from a cache, or a new version could not be discovered.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] }];
  },
};

export default nextConfig;
