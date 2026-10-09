import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIP, MESSAGE_MAX, parseEntry, pendingMigrations } from "../lib/guestbook.ts";

test("parseEntry validates name and message", () => {
  assert.deepEqual(parseEntry(" Ana ", " hello "), { ok: true, name: "Ana", message: "hello" });
  assert.deepEqual(parseEntry("", "hi"), { ok: false, error: "name" });
  assert.deepEqual(parseEntry("a".repeat(41), "hi"), { ok: false, error: "name" });
  assert.deepEqual(parseEntry("<script>", "hi"), { ok: false, error: "name" });
  assert.deepEqual(parseEntry("zoo-probe", "hi"), { ok: false, error: "name" });
  assert.deepEqual(parseEntry(null, "hi"), { ok: false, error: "name" });
  assert.deepEqual(parseEntry("Ana", "  "), { ok: false, error: "message" });
  assert.equal(parseEntry("Ana", "x".repeat(MESSAGE_MAX)).ok, true);
  assert.deepEqual(parseEntry("Ana", "x".repeat(MESSAGE_MAX + 1)), { ok: false, error: "message" });
  assert.deepEqual(parseEntry("Ana", "a\u0000b"), { ok: false, error: "message" });
});

test("client IP is the last forwarded entry", () => {
  assert.equal(clientIP("1.2.3.4, 5.6.7.8"), "5.6.7.8");
  assert.equal(clientIP(null), "local");
});

test("pending migrations", () => {
  assert.deepEqual(pendingMigrations(["b_two", "a_one"], ["a_one"]), ["b_two"]);
  assert.deepEqual(pendingMigrations(["a_one"], ["a_one"]), []);
});
