# next-prisma

Deployed with [ox](https://deploywithox.com): deploy a repo to your own server with one command, no Docker. [Docs](https://deploywithox.com/docs) · [Guide for this stack](https://deploywithox.com/docs/guides/nextjs)

**Live demo:** https://next-prisma.s3.zoo.sorv.dev

> **Role in the zoo:** project `next-prisma` of [oxzoo-live](https://github.com/saurav-codes/oxzoo-live-control/blob/main/zoo/README.md#projects), deployed with [ox](https://deploywithox.com) on server s3 at https://next-prisma.s3.zoo.sorv.dev. The contract it follows is [DESIGN.md](https://github.com/saurav-codes/oxzoo-live-control/blob/main/zoo/DESIGN.md).

Next.js 15 with the App Router on s3: a guestbook rendered on the server from
PostgreSQL through Prisma 7, with committed migrations that ox applies on
deploy.

## What it proves

- Proof level P2: real round trips against the PostgreSQL that ox provides.
- `prisma`: creates a row, reads it back, deletes it, and checks it is gone.
- `migrations`: every folder in `prisma/migrations` is recorded as finished in
  `_prisma_migrations`; a folder the database has not applied fails the check
  with `pending: <name>`.
- `ssr`: the app fetches its own `/` over `127.0.0.1:$PORT` and checks the
  server-rendered guestbook marker; it fails when the page rendered but its
  database read failed.

## ox features exercised

- Zero-config Next.js detection: `npm ci`, `npm run build`, start
  `npx next start -H 127.0.0.1 -p $PORT` (no start script on purpose, so ox
  binds the loopback address).
- Prisma detection from `prisma/schema.prisma`: migrate step
  `npx prisma migrate deploy` and the built-in postgres service with
  `DATABASE_URL`.
- Node pinned by `package.json` `engines.node` (24).

## Endpoints

| Path | What |
|------|------|
| `GET /` | the guestbook, newest 50 entries, rendered on the server |
| form on `/` | server action: name 1 to 40 letters, digits, spaces, `_ . ' -`; message 1 to 280 characters; 3 entries per minute per IP |
| `GET /_zoo/health`, `GET /_zoo/probe` | the zoo contract, route handlers in `app/%5Fzoo/` (a plain `_zoo` folder is private in Next.js) |

Prisma 7 uses the `prisma-client` generator (output `lib/generated/prisma`, built
by `prisma generate` in `npm run build`) with the `@prisma/adapter-pg` driver
adapter; the pool has 5 s connect, statement and query timeouts. The URL lives in
`prisma.config.ts` and is only needed by migrate, so the build works without
`DATABASE_URL`. `prisma` is a regular dependency because ox runs
`npx prisma migrate deploy` on the server. Probe rows use the name `zoo-probe`,
which the form rejects and the page hides.

## Variables

| Name | Source | Role in probe |
|------|--------|---------------|
| `PORT`, `HOST`, `PUBLIC_HOST`, `OX_ENV`, `OX_RELEASE` | provided by ox | none |
| `DATABASE_URL` | provided by ox (postgres service) | plain, fp only |
| `ZOO_PANEL_ORIGIN` | yours, `https://zoo-control.s1.zoo.sorv.dev` | plain |

## Run and test

```sh
npm ci
npm test        # zoo-sig vectors, verify reasons, CORS, trace ids, ring, rate limit, probe lock, entry validation, client IP, pending migrations
npm run build
DATABASE_URL=postgresql://... npx prisma migrate deploy
DATABASE_URL=postgresql://... PORT=3000 npx next start -H 127.0.0.1 -p 3000
```

Local result (2026-10-09, PostgreSQL 18 on a random port): `npm test` 11 of 11
pass; the build (with type check) succeeds without `DATABASE_URL`;
`prisma migrate deploy` applies `20261009000000_init`; the probe is `ok: true` for
all three checks; CORS answers only `ZOO_PANEL_ORIGIN`, preflight 204. In a
browser, two entries are signed and listed, a bad name shows the error, and the
fourth entry within a minute is rate limited. An extra empty migration folder
fails `migrations` as pending; with PostgreSQL stopped all three checks fail with
`Can't reach database server` and the page shows a database error.

## ox check

```console
ox check ~/oxzoo-live/next-prisma (manifest: none)

  app.start                  npx next start -H 127.0.0.1 -p $PORT                 detected:package.json
  build.install              npm ci                                               detected:package-lock.json
  build.commands[0]          npm run build                                        detected:package.json
  build.migrate              npx prisma migrate deploy                            detected:prisma/schema.prisma
  tools.node                 24                                                   detected:package.json
  services.postgres          postgres 18 (shared)                                 detected:prisma/schema.prisma

  Provided by ox: PORT, HOST, OX_ENV, OX_PROJECT, OX_RELEASE, OX_DATA_DIR, PUBLIC_URL, PUBLIC_HOST, DATABASE_URL
  Set on the dashboard before the first deploy: ZOO_PANEL_ORIGIN

Ready to deploy.
```
