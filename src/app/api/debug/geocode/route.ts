import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

/** GET /api/debug/geocode — test geocoding pipeline end-to-end */
export async function GET() {
  const supabase = createServiceClient();

  // 1. Test Nominatim directly (raw, no geocode wrapper)
  let rawResult: unknown = null;
  let rawError: string | null = null;
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=Atlanta%2C%20US",
      { headers: { "User-Agent": "HackathonFinder/1.0" }, cache: "no-store" }
    );
    rawResult = { status: res.status, ok: res.ok, data: await res.json() };
  } catch (e) {
    rawError = String(e);
  }

  // 2. Test Nominatim via geocode helper
  let geoResult: unknown = null;
  let geoError: string | null = null;
  try {
    const { geocode } = await import("@/lib/scrapers/geocode");
    geoResult = await geocode("Atlanta", "US");
  } catch (e) {
    geoError = String(e);
  }

  // 2. Test update in Supabase
  let updateResult: { error?: string; matched?: number } = {};
  if (geoResult) {
    const { error, count } = await supabase
      .from("hackathons")
      .update({ location_lat: geoResult.lat, location_lng: geoResult.lng })
      .eq("location_city", "Atlanta")
      .select("id")
      .then((r) => ({ error: r.error?.message, count: r.data?.length ?? 0 }));
    updateResult = { error, matched: count };
  }

  // 3. Verify
  const { data: verify } = await supabase
    .from("hackathons")
    .select("name, location_lat, location_lng")
    .eq("location_city", "Atlanta")
    .limit(3);

  return NextResponse.json({ rawResult, rawError, geoResult, geoError, updateResult, verify });
}
