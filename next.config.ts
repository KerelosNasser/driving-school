import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Set to false for production - only true during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Set to false for production - only true during development
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Optimize images for production
    formats: ['image/avif', 'image/webp'],
  },
  // Enable strict mode for better error catching
  reactStrictMode: true,
  // Optimize production builds
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*', 'framer-motion'],
  },
};

export default nextConfig;
