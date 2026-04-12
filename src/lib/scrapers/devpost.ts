import type { ScrapedHackathon } from "./types";

const DEVPOST_API = "https://devpost.com/api/hackathons";

interface DevpostHackathon {
  id: number;
  title: string;
  url: string;
  tagline?: string;
  displayed_location?: { location?: string };
  submission_period_dates?: string;
  prize_amount?: string;
  themes?: { id: number; name: string }[];
  open_state?: string;
  organization_name?: string;
  thumbnail_url?: string;
}

function parseDevpostDates(raw?: string): { start?: string; end?: string } {
  if (!raw) return {};
  const parts = raw.split(" - ");
  const toISO = (s: string) => {
    const d = new Date(s.trim());
    return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  };
  return { start: toISO(parts[0]), end: toISO(parts[1]) };
}

function parseLocation(location?: string): {
  city?: string;
  country?: string;
  modality: "remote" | "in-person" | "hybrid";
} {
  if (!location || /online|virtual|remote|anywhere|worldwide/i.test(location)) {
    return { modality: "remote" };
  }
  const parts = location.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    modality: "in-person",
    city: parts[0],
    country: parts[parts.length - 1],
  };
}

function inferStatus(openState?: string, end?: string): ScrapedHackathon["status"] {
  const now = new Date();
  if (end && new Date(end) < now) return "past";
  if (openState === "closed") return "past";
  return "upcoming";
}

export async function scrapeDevpost(): Promise<ScrapedHackathon[]> {
  const results: ScrapedHackathon[] = [];

  for (let page = 1; page <= 5; page++) {
    try {
      const params = new URLSearchParams({
        order_by: "recently-added",
        status: "open",
        page: String(page),
        per_page: "50",
      });
      const res = await fetch(`${DEVPOST_API}?${params}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;

      const data = await res.json();
      const hackathons: DevpostHackathon[] = data.hackathons ?? [];
      if (!hackathons.length) break;

      for (const h of hackathons) {
        const { start, end } = parseDevpostDates(h.submission_period_dates);
        const { modality, city, country } = parseLocation(h.displayed_location?.location);

        results.push({
          source: "devpost",
          source_id: String(h.id),
          name: h.title,
          organizer: h.organization_name,
          description: h.tagline,
          start_date: start,
          end_date: end,
          modality,
          location_city: city,
          location_country: country,
          category: h.themes?.[0]?.name,
          tags: h.themes?.map((t) => t.name) ?? [],
          prize_pool: h.prize_amount,
          official_url: h.url,
          image_url: h.thumbnail_url,
          status: inferStatus(h.open_state, end),
        });
      }
    } catch {
      break;
    }
  }

  return results;
}
