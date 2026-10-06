import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The built-in local database ships WebAssembly files; load it from node_modules as-is.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
