import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Mejorar el manejo de errores de hidratación
    optimizePackageImports: ['@prisma/client'],
  },
  // Configuración para desarrollo
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Período en ms donde las páginas se mantienen en memoria
      maxInactiveAge: 25 * 1000,
      // Número de páginas que se deben mantener simultáneamente
      pagesBufferLength: 2,
    },
  }),
};
