"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db.ts";
import { clientIP, parseEntry } from "@/lib/guestbook.ts";
import { RateLimit } from "@/lib/zoo.ts";

const limit = new RateLimit(3, 60_000);

export async function sign(form: FormData) {
  const parsed = parseEntry(form.get("name"), form.get("message"));
  if (!parsed.ok) redirect(`/?e=${parsed.error}`);
  if (!limit.allow(clientIP((await headers()).get("x-forwarded-for")))) redirect("/?e=rate");
  try {
    await db().entry.create({ data: { name: parsed.name, message: parsed.message } });
  } catch (e) {
    console.error("guestbook write:", (e as Error).message);
    redirect("/?e=db");
  }
  revalidatePath("/");
  redirect("/");
}
