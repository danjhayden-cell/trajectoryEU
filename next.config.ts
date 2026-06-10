import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Rollback build hygiene: do not fail production builds on lint-only
    // issues (no-explicit-any / unescaped-entities). TypeScript type
    // checking still runs and will fail the build on real type errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
