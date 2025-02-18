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
  webpack: (config) => {
    // Remove Three.js configs but keep other webpack configs if any
    return config
  },
  transpilePackages: [
    // Keep other packages but remove Three.js related ones
    'react-pdf',
    '@react-pdf/renderer'
  ]
}

module.exports = nextConfig 