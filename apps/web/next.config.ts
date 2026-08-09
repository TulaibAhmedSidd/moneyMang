import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile monorepo workspace packages so Next.js can resolve them
  transpilePackages: ["@money/shared", "@money/api-client"],
};

export default nextConfig;
