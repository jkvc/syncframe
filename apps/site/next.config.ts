import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.CHECK_BUILD === "1" ? ".next-check" : ".next",
  transpilePackages: ['@syncframe/core', '@syncframe/spatial', '@syncframe/redis'],
};

export default nextConfig;
