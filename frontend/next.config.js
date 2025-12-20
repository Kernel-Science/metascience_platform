/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for larger file uploads (backend on Render supports 100MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

module.exports = nextConfig;
