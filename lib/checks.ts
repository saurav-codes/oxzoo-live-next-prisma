// Probe checks: Prisma write, read, delete; migration status; SSR self check over loopback.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { PROBE_NAME, pendingMigrations } from "./guestbook.ts";
import { type AppInfo, type CheckSpec, env } from "./zoo.ts";

export const info: AppInfo = {
  name: "next-prisma",
  stack: "Next.js 15 SSR + Prisma",
  build: { built_at: process.env.BUILT_AT || undefined },
};

// lastLine keeps the cause from Prisma's multi-line error messages.
async function lastLine<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    throw new Error((e as Error).message.trim().split("\n").pop() || "query failed");
  }
}

const prismaCheck: CheckSpec = {
  id: "prisma",
  label: "Prisma create, read, delete",
  env: ["DATABASE_URL"],
  run: () => lastLine(async () => {
    const token = randomUUID();
    const row = await db().entry.create({ data: { name: PROBE_NAME, message: token } });
    try {
      const back = await db().entry.findUnique({ where: { id: row.id } });
      if (back?.message !== token) throw new Error("read back a different row");
    } finally {
      await db().entry.delete({ where: { id: row.id } });
    }
    const left = await db().entry.count({ where: { id: row.id } });
    if (left !== 0) throw new Error("delete left the row behind");
    return `row ${row.id} written, read and deleted`;
  }),
};

const migrationsCheck: CheckSpec = {
  id: "migrations",
  label: "Prisma migrations applied, none pending",
  env: ["DATABASE_URL"],
  run: () => lastLine(async () => {
    const dir = join(process.cwd(), "prisma", "migrations");
    const folders = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
    const rows = await db().$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const pending = pendingMigrations(folders, rows.map((r) => r.migration_name));
    if (pending.length) throw new Error(`pending: ${pending.join(", ")}`);
    return `${folders.length} of ${folders.length} applied`;
  }),
};

const ssrCheck: CheckSpec = {
  id: "ssr",
  label: "Own guestbook page renders from PG",
  env: ["PORT", "DATABASE_URL"],
  async run(ctx) {
    const res = await fetch(`http://127.0.0.1:${env("PORT")}/`, { signal: ctx.signal, headers: { accept: "text/html" } });
    const html = await res.text();
    if (res.status !== 200) throw new Error(`GET / answered ${res.status}`);
    const m = html.match(/data-zoo-ssr="next-prisma" data-entries="([\w-]+)"/);
    if (!m) throw new Error("page has no server-rendered guestbook marker");
    if (m[1] === "db-error") throw new Error("page rendered, but its database read failed");
    return `GET 127.0.0.1:$PORT/ rendered ${m[1]} entries on the server`;
  },
};

export const checks = [prismaCheck, migrationsCheck, ssrCheck];
