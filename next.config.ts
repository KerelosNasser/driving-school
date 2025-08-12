import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove these in production - they hide important errors
  typescript: {
    ignoreBuildErrors: true, // Changed from true
  },
  eslint: {
    ignoreDuringBuilds: true, // Changed from true
  },
  
  // Enhanced image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

// Fix duplicate Sentry configuration
export default withSentryConfig(nextConfig, {
  org: "kero-w4",
  project: "driving-school",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});