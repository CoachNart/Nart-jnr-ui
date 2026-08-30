/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/kitsetups/:path*",
        destination:
          process.env.KITSETUPS_BACKEND_URL ||
          "https://kitsetups-backend.onrender.com/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
