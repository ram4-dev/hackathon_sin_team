import { getAuthUserId } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { geocode } from "@/lib/scrapers/geocode";
import { NextResponse } from "next/server";

// Nominatim's 1 req/s limit means each event takes ~1.1s. Keep a batch small
// enough to finish within the function timeout; call the endpoint repeatedly
// from the client if there are more than BATCH_LIMIT rows pending.
export const maxDuration = 60;

const BATCH_LIMIT = 25;

/**
 * POST /api/hackathons/geocode-missing
 *
 * Backfills lat/lng for hackathons that have a city/country but no
 * coordinates (so they don't show up on the map). Throttled to Nominatim's
 * 1 req/s budget. Only authenticated users may trigger this.
 */
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("hackathons")
    .select("id, location_city, location_country")
    .is("location_lat", null)
    .not("location_city", "is", null)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[geocode-missing] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  let geocoded = 0;
  const failed: { id: string; city: string | null; country: string | null }[] = [];
  const cache = new Map<string, { lat: number; lng: number } | null>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const key = `${row.location_city ?? ""}|${row.location_country ?? ""}`;
    let geo = cache.get(key) ?? null;

    if (!cache.has(key)) {
      geo = await geocode(row.location_city ?? undefined, row.location_country ?? undefined);
      if (!geo && row.location_city && row.location_country) {
        await new Promise((r) => setTimeout(r, 1100));
        geo = await geocode(row.location_city ?? undefined);
      }
      cache.set(key, geo);
    }

    if (geo) {
      const { error: upErr } = await supabase
        .from("hackathons")
        .update({ location_lat: geo.lat, location_lng: geo.lng })
        .eq("id", row.id);
      if (upErr) {
        console.error(`[geocode-missing] update failed for ${row.id}:`, upErr);
        failed.push({ id: row.id, city: row.location_city, country: row.location_country });
      } else {
        geocoded++;
      }
    } else {
      failed.push({ id: row.id, city: row.location_city, country: row.location_country });
    }

    // Respect Nominatim rate limit.
    if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 1100));
  }

  return NextResponse.json({
    scanned: rows.length,
    geocoded,
    failed: failed.length,
    failedDetail: failed,
  });
}
