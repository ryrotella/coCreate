/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config) => {
    // Fix for canvas in Node.js environments
    config.externals.push({
      canvas: 'commonjs canvas',
    });
    return config;
  },
};

module.exports = nextConfig;
