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
        hostname: 'placehold.co'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com'
      },
      {
        protocol: 'https',
        hostname: 'urguvlckmcehdiibsiwf.supabase.co'
      }
    ],
    domains: ['ckqbqxqvxgvxqgzc.public.blob.vercel-storage.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js
    if (isServer) {
      config.resolve.alias.canvas = false;
      config.module.rules.push({
        test: /pdf\.js$/,
        use: 'null-loader'
      });
    }
    return config;
  },
  transpilePackages: [
    'react-pdf',
    '@react-pdf/renderer',
    'sonner'
  ]
}

module.exports = nextConfig 