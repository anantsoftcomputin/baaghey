import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**" }],
    localPatterns: [
      {
        pathname: "/images/**",
      },
      {
        pathname: "/brand/**",
      },
    ],
  },
};

export default nextConfig;
