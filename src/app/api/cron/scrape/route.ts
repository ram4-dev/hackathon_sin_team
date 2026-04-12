import { runAllScrapers } from "@/lib/scrapers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/cron/scrape
 *
 * Vercel Cron: runs daily at 06:00 UTC (configured in vercel.json).
 * Also callable manually — protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  const results = await runAllScrapers();
  const elapsed = Date.now() - start;

  const total = results.reduce(
    (acc, r) => ({
      fetched: acc.fetched + r.fetched,
      upserted: acc.upserted + r.upserted,
      errors: acc.errors + r.errors,
    }),
    { fetched: 0, upserted: 0, errors: 0 }
  );

  return NextResponse.json({ ok: true, elapsed_ms: elapsed, total, results });
}
