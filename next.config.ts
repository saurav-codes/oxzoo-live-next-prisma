import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  env: { BUILT_AT: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") },
};

export default config;
