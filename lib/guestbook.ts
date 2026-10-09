// Guestbook input rules, kept free of framework imports so plain Node tests can load them.
export const NAME_MAX = 40;
export const MESSAGE_MAX = 280;
export const PROBE_NAME = "zoo-probe";

const NAME_RE = /^[\p{L}\p{N} _.'-]+$/u;
const CONTROL_RE = /[\u0000-\u0008\u000b-\u001f\u007f]/;

export type EntryInput = { ok: true; name: string; message: string } | { ok: false; error: "name" | "message" };

export const ERRORS: Record<string, string> = {
  name: `Name must be 1 to ${NAME_MAX} letters, digits, spaces or _ . ' -`,
  message: `Message must be 1 to ${MESSAGE_MAX} characters`,
  rate: "Slow down: 3 entries per minute",
  db: "The database is unavailable, try again",
};

export function parseEntry(name: unknown, message: unknown): EntryInput {
  const n = typeof name === "string" ? name.trim() : "";
  const m = typeof message === "string" ? message.trim() : "";
  if (!n || [...n].length > NAME_MAX || !NAME_RE.test(n) || n === PROBE_NAME) return { ok: false, error: "name" };
  if (!m || [...m].length > MESSAGE_MAX || CONTROL_RE.test(m)) return { ok: false, error: "message" };
  return { ok: true, name: n, message: m };
}

// clientIP takes the last X-Forwarded-For entry (the one the local proxy added).
export function clientIP(xff: string | null): string {
  return xff?.split(",").pop()?.trim() || "local";
}

// pendingMigrations lists migration folders that the database has not applied.
export function pendingMigrations(folders: string[], applied: string[]): string[] {
  const done = new Set(applied);
  return folders.filter((f) => !done.has(f)).sort();
}
