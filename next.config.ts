import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Los archivos de importación (stock, ventas) pueden pesar varios
      // MB; el límite por defecto de Next.js para Server Actions es 1MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
