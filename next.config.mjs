/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Typesikkerhet håndheves av `tsc`/`npm run typecheck`; ESLint kjøres
  // separat med `npm run lint` for å holde produksjonsbygget raskt.
  eslint: { ignoreDuringBuilds: true },
  // Charts and the map are heavy client bundles; keep them tree-shaken.
  experimental: {
    optimizePackageImports: ["@observablehq/plot", "d3"],
  },
};

export default nextConfig;
