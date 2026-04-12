import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/builders
 *
 * Query params:
 *   status        - "available" | "looking_for_team" | "networking"
 *   modality      - "remote" | "in-person" | "both"
 *   role          - any role string (matches against roles array)
 *   stack         - any stack string (matches against stack array)
 *   city          - partial city name match (case-insensitive)
 *   country       - partial country name match
 *   lat, lng, radius_km  - filter by proximity (all three required)
 *   limit         - max results (default 50, max 200)
 *   offset        - pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const modality = searchParams.get("modality");
  const role = searchParams.get("role");
  const stack = searchParams.get("stack");
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radius_km");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, location_city, location_country, location_lat, location_lng, stack, roles, modality, status, github_url, x_url, linkedin_url, website_url, telegram_url, discord_url, created_at",
      { count: "exact" }
    )
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (modality) query = query.eq("modality", modality);
  if (role) query = query.contains("roles", [role]);
  if (stack) query = query.contains("stack", [stack]);
  if (city) query = query.ilike("location_city", `%${city}%`);
  if (country) query = query.ilike("location_country", `%${country}%`);

  // Only return builders who have set a location
  if (lat && lng && radiusKm) {
    // Approximate bounding box filter (Supabase doesn't have native geo distance in PostgREST)
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
