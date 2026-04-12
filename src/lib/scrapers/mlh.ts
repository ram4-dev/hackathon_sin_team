import type { ScrapedHackathon } from "./types";

/**
 * MLH migrated from mlh.io to www.mlh.com and switched to an Inertia.js SPA.
 * Event data lives in <div id="app" data-page="{ JSON }"> — no CSS class parsing needed.
 */

interface MLHEvent {
  id: string;
  slug: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  url: string;
  formatType: string; // "digital" | "physical"
  location: string;
  backgroundUrl?: string;
  logoUrl?: string;
  websiteUrl?: string;
  venueAddress?: { city?: string; country?: string; state?: string } | null;
  region?: string | null;
}

function parseInertiaData(html: string): MLHEvent[] {
  const match = html.match(/id="app"\s+data-page="([^"]*)"/);
  if (!match) return [];
  try {
    // Inertia encodes the JSON with HTML entities
    const json = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const pageData = JSON.parse(json);
    return pageData?.props?.upcomingEvents ?? [];
  } catch {
    return [];
  }
}

function toISO(dt?: string): string | undefined {
  if (!dt) return undefined;
  const d = new Date(dt);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

export async function scrapeMLH(): Promise<ScrapedHackathon[]> {
  const results: ScrapedHackathon[] = [];
  const year = new Date().getFullYear();
  // Try current and next year's season
  const urls = [
    `https://www.mlh.com/seasons/${year}/events`,
    `https://www.mlh.com/seasons/${year + 1}/events`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "HackathonFinder/1.0", Accept: "text/html" },
        redirect: "follow",
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const events = parseInertiaData(html);

      for (const ev of events) {
        const isOnline = ev.formatType === "digital" || !ev.venueAddress?.city;
        const officialUrl =
          ev.websiteUrl ??
          `https://www.mlh.com/seasons/${year}/events/${ev.slug ?? ev.id}`;

        results.push({
          source: "mlh",
          source_id: String(ev.id ?? ev.slug),
          name: ev.name,
          start_date: toISO(ev.startsAt),
          end_date: toISO(ev.endsAt),
          modality: isOnline ? "remote" : "in-person",
          location_city: isOnline ? undefined : ev.venueAddress?.city,
          location_country: isOnline ? undefined : ev.venueAddress?.country,
          tags: ["mlh", ...(ev.region ? [ev.region] : [])],
          official_url: officialUrl,
          image_url: ev.backgroundUrl ?? ev.logoUrl,
          status: ev.status === "in_progress" ? "active" : "upcoming",
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}
