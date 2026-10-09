import { checks, info } from "@/lib/checks.ts";
import { preflight, probe, variable } from "@/lib/zoo.ts";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return probe(req, info, checks, [variable("DATABASE_URL", "service"), variable("ZOO_PANEL_ORIGIN", "plain", { show: true })]);
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
