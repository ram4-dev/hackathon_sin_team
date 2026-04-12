import { createServiceClient } from "@/lib/supabase/service";
import { geocode } from "./geocode";
import { scrapeDevpost } from "./devpost";
import { scrapeMLH } from "./mlh";
import { scrapeLuma } from "./luma";
import { scrapeReddit } from "./reddit";
import { scrapeTwitter } from "./twitter";
import type { ScrapedHackathon } from "./types";

export type ScrapeResult = {
  source: string;
  fetched: number;
  upserted: number;
  errors: number;
};

function inferStatus(h: ScrapedHackathon): "upcoming" | "active" | "past" {
  const now = new Date();
  if (h.end_date && new Date(h.end_date) < now) return "past";
  if (h.start_date && new Date(h.start_date) <= now) return "active";
  return "upcoming";
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function upsertBatch(
  supabase: ServiceClient,
  items: ScrapedHackathon[]
): Promise<{ upserted: number; errors: number }> {
  if (!items.length) return { upserted: 0, errors: 0 };

  // ── Phase 1: upsert all items immediately (no geocoding yet) ─────────────
  const rows = items.map((h) => ({
    source: h.source,
    source_id: h.source_id,
    name: h.name,
    organizer: h.organizer ?? null,
    description: h.description ?? null,
    start_date: h.start_date ?? null,
    end_date: h.end_date ?? null,
    registration_deadline: h.registration_deadline ?? null,
    modality: h.modality,
    location_city: h.location_city ?? null,
    location_country: h.location_country ?? null,
    location_lat: null,
    location_lng: null,
    category: h.category ?? null,
    tags: h.tags,
    prize_pool: h.prize_pool ?? null,
    official_url: h.official_url,
    image_url: h.image_url ?? null,
    status: inferStatus(h),
  }));

  const { error, count } = await supabase
    .from("hackathons")
    .upsert(rows, { onConflict: "source,source_id", count: "exact" });

  if (error) return { upserted: 0, errors: 1 };

  // ── Phase 2: geocode items that have a city/country ──────────────────────
  // In-memory cache to avoid duplicate Nominatim calls within the same run
  const geoCache = new Map<string, { lat: number; lng: number } | null>();

  for (const h of items) {
    if (!h.location_city && !h.location_country) continue;

    const key = [h.location_city, h.location_country].filter(Boolean).join(",");
    if (!geoCache.has(key)) {
      geoCache.set(key, await geocode(h.location_city, h.location_country));
      await new Promise((r) => setTimeout(r, 1100)); // Nominatim 1 req/s
    }
    const geo = geoCache.get(key);
    if (!geo) continue;

    await supabase
      .from("hackathons")
      .update({ location_lat: geo.lat, location_lng: geo.lng })
      .eq("source", h.source)
      .eq("source_id", h.source_id);
  }

  return { upserted: count ?? 0, errors: 0 };
}

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const supabase = createServiceClient();

  const scrapers: [string, () => Promise<ScrapedHackathon[]>][] = [
    ["devpost", scrapeDevpost],
    ["mlh", scrapeMLH],
    ["luma", scrapeLuma],
    ["reddit", scrapeReddit],
    ["twitter", scrapeTwitter],
  ];

  // ── Run all scrapers in parallel (each hits a different external source) ──
  const settled = await Promise.allSettled(
    scrapers.map(async ([source, scraper]) => ({
      source,
      items: await scraper(),
    }))
  );

  // ── Upsert + geocode sequentially (Nominatim rate limit) ──────────────────
  const results: ScrapeResult[] = [];
  for (const result of settled) {
    if (result.status === "rejected") {
      results.push({ source: "unknown", fetched: 0, upserted: 0, errors: 1 });
      continue;
    }
    const { source, items } = result.value;
    const { upserted, errors } = await upsertBatch(supabase, items);
    results.push({ source, fetched: items.length, upserted, errors });
  }

  return results;
}
