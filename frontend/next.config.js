/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  async redirects() {
    return [
      // The old "Methods" page was renamed to "Docs". Keep old links working.
      {
        source: "/methods",
        destination: "/docs",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
