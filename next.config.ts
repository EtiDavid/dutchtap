import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (only the files
  // actually needed at runtime) — the standard approach for a lean
  // Docker image, instead of shipping the whole node_modules tree.
  output: "standalone",
  // The dev-only badge defaults to bottom-left, where it would cover the Home tab of the bottom navigation.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
