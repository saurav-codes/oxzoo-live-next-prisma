import { db } from "@/lib/db.ts";
import { ERRORS, MESSAGE_MAX, NAME_MAX, PROBE_NAME } from "@/lib/guestbook.ts";
import { health } from "@/lib/zoo.ts";
import { info } from "@/lib/checks.ts";
import { sign } from "./actions.ts";

export const dynamic = "force-dynamic";

const box = { border: "1px solid #ddd", borderRadius: 14, padding: "0.5rem 1rem", listStyle: "none" } as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const h = health(info);
  let entries: { id: number; name: string; message: string; createdAt: Date }[] = [];
  let failed = false;
  try {
    entries = await db().entry.findMany({ where: { name: { not: PROBE_NAME } }, orderBy: { createdAt: "desc" }, take: 50 });
  } catch (err) {
    console.error("guestbook read:", (err as Error).message);
    failed = true;
  }
  return (
    <main data-zoo-ssr="next-prisma" data-entries={failed ? "db-error" : entries.length}>
      <h1>Guestbook</h1>
      <p style={{ color: "#666" }}>
        Next.js 15 on ox, rendered on the server by {h.name}@{h.server} from PostgreSQL through Prisma. Release <code>{h.release}</code>.
      </p>
      <form action={sign} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input name="name" aria-label="name" placeholder="Name" maxLength={NAME_MAX} required />
        <input name="message" aria-label="message" placeholder="Say something" maxLength={MESSAGE_MAX} required style={{ flex: 1 }} />
        <button>Sign</button>
      </form>
      {e && ERRORS[e] && <p role="alert" style={{ color: "#b00" }}>{ERRORS[e]}</p>}
      {failed && <p role="alert" style={{ color: "#b00" }}>{ERRORS.db}</p>}
      <ul style={box}>
        {entries.map((x) => (
          <li key={x.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" }}>
            <strong>{x.name}</strong> {x.message} <time style={{ color: "#999", fontSize: "0.8em" }}>{x.createdAt.toISOString().slice(0, 16).replace("T", " ")}</time>
          </li>
        ))}
        {entries.length === 0 && !failed && <li style={{ color: "#999" }}>No entries yet. Be the first.</li>}
      </ul>
      <p>
        <a href="/_zoo/health">health</a> · <a href="/_zoo/probe">probe</a>
      </p>
    </main>
  );
}
