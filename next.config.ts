import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include Prisma query engine binary in the Vercel deployment bundle
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**"],
  },
};

export default nextConfig;
