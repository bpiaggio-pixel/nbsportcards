import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // En Next 16 serverActions está habilitado por defecto.
  // Si lo querés explícito, ahora es un objeto (no boolean).
  experimental: {
    serverActions: {},
  },
};

export default nextConfig;


