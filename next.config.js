/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

// Setup Cloudflare Pages development platform for local development
if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform();
}

module.exports = nextConfig;
