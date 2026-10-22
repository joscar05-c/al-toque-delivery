import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@delivery/shared"],
  // Nota: En Next.js 16+, serverActions están habilitados por defecto.
  // El límite de body se configura en el route handler o server action individualmente.
  // Si las subidas de imágenes fallan con "Body exceeded limit", 
  // agregar `maxDuration` y `bodySizeLimit` en las server actions específicas.
};

export default nextConfig;
