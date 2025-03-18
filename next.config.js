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
        hostname: 'urguvlckmcehdiibsiwf.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
    domains: [
      'urguvlckmcehdiibsiwf.supabase.co',
      'instagram.fmnl17-1.fna.fbcdn.net',
      'scontent.cdninstagram.com',
      'scontent-lhr8-1.cdninstagram.com',
      'scontent-lhr8-2.cdninstagram.com',
      'instagram.fcgk30-1.fna.fbcdn.net',
      'instagram.fmnl17-2.fna.fbcdn.net',
      'digitalpropertyshowcase.com',
      'www.digitalpropertyshowcase.com'
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle GLB files
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource'
    });

    // Handle Three.js imports
    config.module.rules.push({
      test: /three[\/\\]examples[\/\\].*\.js$/,
      use: 'babel-loader'
    });

    // Prevent server-side loading of Three.js
    if (isServer) {
      config.module.rules.push({
        test: /three/,
        use: 'null-loader'
      });
    }

    // Fix for ES modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx']
    };

    // Handle PDF.js worker
    config.resolve.alias.canvas = false;
    
    if (isServer) {
      config.module.rules.push({
        test: /pdf\.js$/,
        use: 'null-loader'
      });
    }

    return config;
  },
  // Disable strict mode temporarily while debugging
  reactStrictMode: false,
  // Add transpilePackages for Three.js and PDF.js
  transpilePackages: ['three', 'pdfjs-dist'],
}

module.exports = nextConfig 