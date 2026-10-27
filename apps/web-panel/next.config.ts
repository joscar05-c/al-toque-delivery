import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@delivery/shared"],
  async rewrites() {
    return [
      { source: "/privacy", destination: "/politica-de-privacidad" },
      { source: "/privacidad", destination: "/politica-de-privacidad" },
      { source: "/privacy-policy", destination: "/politica-de-privacidad" },
      { source: "/politicas-privacidad", destination: "/politica-de-privacidad" },
      { source: "/delete-account", destination: "/eliminar-cuenta" },
      { source: "/eliminacion-cuenta", destination: "/eliminar-cuenta" },
    ];
  },
};

export default nextConfig;
