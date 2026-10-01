import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server binds 0.0.0.0, and the demo is opened at 127.0.0.1.
  // Without this, Next.js blocks the dev client and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
