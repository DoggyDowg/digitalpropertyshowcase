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
  // Disable default favicon
  generateEtags: false,
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 