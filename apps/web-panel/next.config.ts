import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@delivery/shared"],
  // Los Server Actions envían el archivo de imagen en el body. El límite por
  // defecto (1 MB) rebotaba con "Body exceeded 1 MB limit" al crear un plato
  // con foto. Se amplía para soportar imágenes típicas de cámara de celular.
  serverActions: {
    bodySizeLimit: "10mb",
  },
};

export default nextConfig;