import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
