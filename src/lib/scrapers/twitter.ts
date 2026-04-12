import type { ScrapedHackathon } from "./types";

/**
 * Searches recent tweets mentioning hackathons via Twitter API v2.
 * Requires env var X_BEARER_TOKEN.
 * Free tier: 500,000 tweets/month read, recent search only.
 */

interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  entities?: { urls?: { expanded_url: string }[] };
}

function extractHackathonUrl(tweet: Tweet): string | undefined {
  const urls = tweet.entities?.urls ?? [];
  return urls.find((u) =>
    /hackathon|devpost|devfolio|mlh\.io/i.test(u.expanded_url)
  )?.expanded_url;
}

export async function scrapeTwitter(): Promise<ScrapedHackathon[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const results: ScrapedHackathon[] = [];
  const query = encodeURIComponent(
    "hackathon registration open -is:retweet lang:en"
  );

  try {
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=50&tweet.fields=created_at,entities`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const tweets: Tweet[] = data.data ?? [];

    for (const tweet of tweets) {
      const url = extractHackathonUrl(tweet) ?? `https://twitter.com/i/web/status/${tweet.id}`;
      const created = tweet.created_at ? new Date(tweet.created_at) : new Date();

      results.push({
        source: "twitter",
        source_id: tweet.id,
        name: tweet.text.slice(0, 100).replace(/https?:\/\/\S+/g, "").trim(),
        description: tweet.text,
        modality: "remote",
        tags: ["twitter"],
        official_url: url,
        status: "upcoming",
      });
    }
  } catch {
    return [];
  }

  return results;
}
