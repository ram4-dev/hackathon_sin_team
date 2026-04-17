import type { ScrapedHackathon } from "./types";

/** luma.com — parses __NEXT_DATA__ JSON embedded in their Next.js pages */

interface LumaEvent {
  api_id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  url: string;
  cover_url?: string;
  location_type?: string;
  geo_address_info?: {
    city?: string;
    country?: string;
    full_address?: string;
    type?: string;
    city_state?: string;
  };
  hosts?: { name?: string }[];
  ticket_info?: { is_free?: boolean };
}

/** Extract a slug from a Luma URL like https://lu.ma/my-event → "my-event" */
function slugFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.pathname.replace(/^\//, "").split("/")[0] || url;
  } catch {
    return url;
  }
}

function parseSingleEvent(html: string): LumaEvent | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const json = JSON.parse(match[1]);
    const props = json?.props?.pageProps;
    if (!props) return null;

    // Actual Luma structure (confirmed): pageProps.initialData.data.event
    if (props.initialData?.data?.event?.api_id) return props.initialData.data.event;
    // Fallbacks for other page variants
    if (props.initialData?.event?.api_id) return props.initialData.event;
    if (props.event?.api_id) return props.event;
    if (props.event?.event?.api_id) return props.event.event;
    if (props.data?.event?.api_id) return props.data.event;
  } catch {
    return null;
  }
  return null;
}

/**
 * Fetch a single Luma event URL and return it as a ScrapedHackathon.
 * Works for public events without authentication.
 */
export async function scrapeLumaEventUrl(
  url: string
): Promise<ScrapedHackathon | null> {
  const normalizedUrl = url.startsWith("http") ? url : `https://luma.com/${url}`;
  try {
    const res = await fetch(normalizedUrl, {
      headers: { "User-Agent": "HackathonFinder/1.0", Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const html = await res.text();
    const ev = parseSingleEvent(html);
    if (!ev) return null;

    const evUrl = ev.url?.startsWith("http") ? ev.url : normalizedUrl;
    const start = toISO(ev.start_at);
    const end = toISO(ev.end_at);
    const geo = ev.geo_address_info;
    const cityGuess = geo?.city || geo?.city_state?.split(",")[0]?.trim();
    const isOnline =
      ev.location_type === "online" || geo?.type === "online" || !cityGuess;

    const status: ScrapedHackathon["status"] =
      end && new Date(end) < new Date()
        ? "past"
        : start && new Date(start) <= new Date()
        ? "active"
        : "upcoming";

    return {
      source: "luma",
      source_id: ev.api_id || slugFromUrl(normalizedUrl),
      name: ev.name,
      organizer: ev.hosts?.[0]?.name,
      description: ev.description?.slice(0, 400),
      start_date: start,
      end_date: end,
      modality: isOnline ? "remote" : "in-person",
      location_city: isOnline ? undefined : cityGuess,
      location_country: isOnline ? undefined : geo?.country,
      tags: ["luma"],
      official_url: evUrl,
      image_url: ev.cover_url,
      status,
    };
  } catch {
    return null;
  }
}

function parseNextData(html: string): LumaEvent[] {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  try {
    const json = JSON.parse(match[1]);
    const props = json?.props?.pageProps;
    if (!props) return [];

    // Actual structure as of 2025: initialData.featured_place.events
    if (props.initialData?.featured_place?.events) {
      return props.initialData.featured_place.events.map(
        (e: { event: LumaEvent } | LumaEvent) => ("event" in e ? e.event : e)
      );
    }
    // Fallbacks for other page types
    if (props.searchResults?.events) {
      return props.searchResults.events.map(
        (e: { event: LumaEvent } | LumaEvent) => ("event" in e ? e.event : e)
      );
    }
    if (props.events) {
      return props.events.map(
        (e: { event: LumaEvent } | LumaEvent) => ("event" in e ? e.event : e)
      );
    }
    if (props.data?.events) {
      return props.data.events.map(
        (e: { event: LumaEvent } | LumaEvent) => ("event" in e ? e.event : e)
      );
    }
  } catch {
    return [];
  }
  return [];
}

function toISO(dt?: string): string | undefined {
  if (!dt) return undefined;
  const d = new Date(dt);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

export async function scrapeLuma(): Promise<ScrapedHackathon[]> {
  const urls = [
    "https://luma.com/hackathon",
    "https://luma.com/discover?query=hackathon",
  ];

  const results: ScrapedHackathon[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "HackathonFinder/1.0", Accept: "text/html" },
        redirect: "follow",
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const events = parseNextData(html);

      for (const ev of events) {
        const evUrl = ev.url?.startsWith("http")
          ? ev.url
          : `https://luma.com/${ev.api_id}`;
        if (seen.has(evUrl)) continue;
        seen.add(evUrl);

        const start = toISO(ev.start_at);
        const end = toISO(ev.end_at);
        const geo = ev.geo_address_info;
        const cityGuess = geo?.city || geo?.city_state?.split(",")[0]?.trim();
        const isOnline =
          ev.location_type === "online" ||
          geo?.type === "online" ||
          !cityGuess;

        const status: ScrapedHackathon["status"] =
          end && new Date(end) < new Date()
            ? "past"
            : start && new Date(start) <= new Date()
            ? "active"
            : "upcoming";

        results.push({
          source: "luma",
          source_id: ev.api_id,
          name: ev.name,
          organizer: ev.hosts?.[0]?.name,
          description: ev.description?.slice(0, 400),
          start_date: start,
          end_date: end,
          modality: isOnline ? "remote" : "in-person",
          location_city: isOnline ? undefined : cityGuess,
          location_country: isOnline ? undefined : geo?.country,
          tags: ["luma"],
          official_url: evUrl,
          image_url: ev.cover_url,
          status,
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}
