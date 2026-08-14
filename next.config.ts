import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use the stable TypeScript compiler API. Next 16.3's CLI checker can emit
  // non-JSON output in some package-manager environments during `next build`.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
