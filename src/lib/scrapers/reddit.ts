import type { ScrapedHackathon } from "./types";

// Only hackathon-focused subreddits (not general programming subs)
const SUBREDDITS = ["hackathon", "hackathons"];

const EVENT_SIGNALS =
  /\b(register|sign[\s-]?up|apply|submission|deadline|prizes?|devpost|devfolio|mlh|join.{0,20}team|starts?\s+(on|at|in)|ends?\s+(on|at)|open\s+now|registration\s+open)\b|https?:\/\/(?!reddit)/i;

const DISCUSSION_SIGNALS =
  /\b(survived|tips|advice|experience|interview|r[eé]sum[eé]|should\s+i|how\s+(to|do)\b|first\s+hackathon\b|won\b|lost\b|learned|looking\s+for\s+feedback)\b/i;

interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  selftext?: string;
  created_utc: number;
  link_flair_text?: string;
  is_self: boolean;
}

function isEventPost(post: RedditPost): boolean {
  // Self posts with discussion signals → skip
  if (DISCUSSION_SIGNALS.test(post.title)) return false;
  // Flair says it's an announcement → keep
  if (/event|announcement|registration/i.test(post.link_flair_text ?? "")) return true;
  // Link post pointing to an external hackathon URL → keep
  if (!post.is_self && !post.url.includes("reddit.com")) return true;
  // Self post with event signals (dates, keywords, external URLs in text) → keep
  const text = `${post.title} ${post.selftext ?? ""}`;
  return EVENT_SIGNALS.test(text);
}

function extractOfficialUrl(post: RedditPost): string {
  if (!post.is_self && !post.url.includes("reddit.com")) return post.url;
  return `https://reddit.com${post.permalink}`;
}

function inferModality(text: string): ScrapedHackathon["modality"] {
  if (/\bin.?person\b|on.?site\b|venue\b|location:/i.test(text)) return "in-person";
  return "remote";
}

function extractLocation(text: string): { city?: string; country?: string } {
  const m = text.match(
    /(?:location|venue|where|city)[:\s]+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+)?)/
  );
  if (!m) return {};
  const parts = m[1].split(/,\s*/);
  return { city: parts[0]?.trim(), country: parts[1]?.trim() };
}

function inferDates(text: string): { start?: string; end?: string } {
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/g);
  if (isoMatch) return { start: isoMatch[0], end: isoMatch[1] };
  return {};
}

export async function scrapeReddit(): Promise<ScrapedHackathon[]> {
  const results: ScrapedHackathon[] = [];
  const seen = new Set<string>();

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=50`,
        {
          headers: { "User-Agent": "HackathonFinder/1.0" },
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const posts: RedditPost[] = (data.data?.children ?? []).map(
        (c: { data: RedditPost }) => c.data
      );

      for (const post of posts) {
        if (!isEventPost(post)) continue;

        const url = extractOfficialUrl(post);
        if (seen.has(url)) continue;
        seen.add(url);

        const fullText = `${post.title} ${post.selftext ?? ""}`;
        const { start, end } = inferDates(fullText);
        const { city, country } = extractLocation(fullText);

        const status: ScrapedHackathon["status"] =
          end && new Date(end) < new Date()
            ? "past"
            : start && new Date(start) <= new Date()
            ? "active"
            : "upcoming";

        results.push({
          source: "reddit",
          source_id: post.id,
          name: post.title.replace(/\[.*?\]\s*/g, "").trim().slice(0, 120),
          description: post.selftext?.slice(0, 400) || undefined,
          start_date: start,
          end_date: end,
          modality: inferModality(fullText),
          location_city: city,
          location_country: country,
          tags: ["reddit"],
          official_url: url,
          status,
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}
