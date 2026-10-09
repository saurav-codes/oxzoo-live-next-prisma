import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

let client: PrismaClient | undefined;

// db returns one client per process. The pool fails fast instead of hanging a request.
export function db(): PrismaClient {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const adapter = new PrismaPg({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 5000, query_timeout: 5000 });
    client = new PrismaClient({ adapter });
  }
  return client;
}
