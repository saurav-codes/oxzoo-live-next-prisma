import { info } from "@/lib/checks.ts";
import { health, json, preflight } from "@/lib/zoo.ts";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return json(req, 200, health(info));
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
