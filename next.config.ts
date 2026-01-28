import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // For demo purposes, allow unoptimized images
    // In production, configure your image CDN here
    unoptimized: true,
    // Example remote patterns for production:
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'cdn.ventocaffe.com',
    //   },
    // ],
  },
};

export default nextConfig;
