import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/utils", "@repo/validators"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
      allowedOrigins: [
        "localhost:3000",
        "j7flrdqb-3000.brs.devtunnels.ms",
        "localhost:3001",
        "j7flrdqb-3001.brs.devtunnels.ms",
        "localhost:3002",
        "j7flrdqb-3002.brs.devtunnels.ms",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kpaxpgjghrhklfmfbhay.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
