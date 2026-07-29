/** @type {import('next').NextConfig} */
const nextConfig = {
  // API calls are now proxied via src/app/api/[...path]/route.ts
  // which correctly forwards Cookie and Set-Cookie headers.
  // The old rewrites() approach silently dropped Set-Cookie from
  // external domains, preventing Safari iOS from storing the auth cookie.
};

module.exports = nextConfig;