/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-0b8bdb0f1981442e9118b343565c1579.r2.dev",
        pathname: "/gauntlets_game/**",
      },
      {
        protocol: "https",
        hostname: "pub-0b8bdb0f1981442e9118b343565c1579.r2.dev",
        pathname: "/slots/**",
      },
      {
        protocol: "https",
        hostname: "pub-0b8bdb0f1981442e9118b343565c1579.r2.dev",
        pathname: "/affinities/**",
      },
    ],
  },
};

module.exports = nextConfig;
