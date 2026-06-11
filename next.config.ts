import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite importar imagens de qualquer domínio externo (útil para avatares e fotos de produtos)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
