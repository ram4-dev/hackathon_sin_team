import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/hackathons
 *
 * Query params:
 *   status        - "upcoming" | "active" | "past"
 *   modality      - "remote" | "in-person" | "hybrid"
 *   category      - category string
 *   city          - partial city name (case-insensitive)
 *   country       - partial country name
 *   tag           - matches against tags array
 *   featured      - "true" to return only featured
 *   lat, lng, radius_km  - proximity filter
 *   limit         - max results (default 50, max 200)
 *   offset        - pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const modality = searchParams.get("modality");
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const tag = searchParams.get("tag");
  const featured = searchParams.get("featured");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radius_km");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = supabase
    .from("hackathons")
    .select("*", { count: "exact" })
    .order("start_date", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (modality) query = query.eq("modality", modality);
  if (category) query = query.eq("category", category);
  if (city) query = query.ilike("location_city", `%${city}%`);
  if (country) query = query.ilike("location_country", `%${country}%`);
  if (tag) query = query.contains("tags", [tag]);
  if (featured === "true") query = query.eq("is_featured", true);

  if (lat && lng && radiusKm) {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    const kmDeg = parseFloat(radiusKm) / 111;
    query = query
      .gte("location_lat", latN - kmDeg)
      .lte("location_lat", latN + kmDeg)
      .gte("location_lng", lngN - kmDeg)
      .lte("location_lng", lngN + kmDeg);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, limit, offset });
}
