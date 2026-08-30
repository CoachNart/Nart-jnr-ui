/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/kitsetups/:path*",
        destination: "http://127.0.0.1:8787/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
