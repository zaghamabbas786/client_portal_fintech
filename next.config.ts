import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Browser-side Router Cache: pages are kept in-memory after first visit.
    // Navigating back within these windows is instant — zero server calls.
    staleTimes: {
      dynamic: 300,  // 5 min for auth-gated / dynamic pages
      static: 3600,  // 1 hour for fully static pages
    },
  },
}

export default nextConfig
