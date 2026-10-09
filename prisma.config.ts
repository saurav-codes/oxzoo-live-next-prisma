import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Only migrate needs the URL; generate runs at build time, possibly without it.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
