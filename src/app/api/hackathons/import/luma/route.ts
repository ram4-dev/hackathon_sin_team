import { getAuthUserId } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { scrapeLumaEventUrl } from "@/lib/scrapers/luma";
import { geocode } from "@/lib/scrapers/geocode";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/hackathons/import/luma
 *
 * Lets authenticated users import a public Luma event into BuilderMap.
 * Parses __NEXT_DATA__ from the event page — no Luma API key required.
 *
 * Body: { url: string }  — e.g. "https://lu.ma/my-hackathon"
 * Returns: { hackathon: Hackathon } | { error: string }
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url: unknown = body?.url;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
  }

  if (!url.includes("lu.ma") && !url.includes("luma.com")) {
    return NextResponse.json(
      { error: "URL must be from luma.com or lu.ma (e.g. https://luma.com/my-event)" },
      { status: 400 }
    );
  }

  const scraped = await scrapeLumaEventUrl(url);
  if (!scraped) {
    return NextResponse.json(
      {
        error:
          "Could not extract event data from this URL. Make sure the event is public and try again.",
      },
      { status: 422 }
    );
  }

  // Geocode if location is available. Retry with just the city if the
  // combined "city, country" lookup fails (Nominatim sometimes misses those).
  let geo: { lat: number; lng: number } | null = null;
  if (scraped.location_city || scraped.location_country) {
    geo = await geocode(scraped.location_city, scraped.location_country);
    if (!geo && scraped.location_city && scraped.location_country) {
      geo = await geocode(scraped.location_city);
    }
    if (!geo && scraped.location_country) {
      geo = await geocode(undefined, scraped.location_country);
    }
  }
  const geocodeWarning =
    !geo && scraped.location_city
      ? `Could not pin "${scraped.location_city}" on the map. The event was imported and will show once someone retries geocoding.`
      : null;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("hackathons")
    .upsert(
      {
        source: scraped.source,
        source_id: scraped.source_id,
        name: scraped.name,
        organizer: scraped.organizer ?? null,
        description: scraped.description ?? null,
        start_date: scraped.start_date ?? null,
        end_date: scraped.end_date ?? null,
        registration_deadline: null,
        modality: scraped.modality,
        location_city: scraped.location_city ?? null,
        location_country: scraped.location_country ?? null,
        location_lat: geo?.lat ?? null,
        location_lng: geo?.lng ?? null,
        category: null,
        tags: scraped.tags,
        prize_pool: null,
        official_url: scraped.official_url,
        image_url: scraped.image_url ?? null,
        status: scraped.status,
        created_by: userId,
      },
      { onConflict: "source,source_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { hackathon: data, warning: geocodeWarning },
    { status: 201 }
  );
}
