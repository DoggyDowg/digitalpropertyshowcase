/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'ik.imagekit.io',
      'placehold.co',
      'picsum.photos',
      'loremflickr.com'
    ],
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
    // Keep other packages but remove Three.js related ones
    'react-pdf',
    '@react-pdf/renderer'
  ]
}

module.exports = nextConfig 