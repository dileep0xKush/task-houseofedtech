/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["socket.io"],
  turbopack: {},
};

export default nextConfig;
