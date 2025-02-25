/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io'
      },
      {
        protocol: 'https',
        hostname: 'urguvlckmcehdiibsiwf.supabase.co'
      }
    ],
    domains: ['ckqbqxqvxgvxqgzc.public.blob.vercel-storage.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js in server environment
    if (isServer) {
      config.resolve.alias.canvas = false;
      config.module.rules.push({
        test: /pdf\.js$/,
        use: 'null-loader'
      });
    }
    return config;
  },
  // Only transpile packages that actually need it
  transpilePackages: [
    'react-pdf',
    '@react-pdf/renderer'
  ],
  // Ensure static assets are properly handled
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        // Specific headers for favicon
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 