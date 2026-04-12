import { headers } from "next/headers";

export type GeoLocation = {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
};

/**
 * Resolves the approximate user location via:
 * 1. Vercel edge geolocation headers (zero latency, production)
 * 2. ipapi.co free API using the client IP (dev / non-Vercel)
 *
 * Returns null on loopback (local dev without a real IP) or on any error.
 */
export async function getGeoLocation(): Promise<GeoLocation | null> {
  try {
    const h = await headers();

    // ── Vercel geolocation headers ────────────────────────────────────────
    const vLat = h.get("x-vercel-ip-latitude");
    const vLng = h.get("x-vercel-ip-longitude");
    if (vLat && vLng) {
      return {
        lat: parseFloat(vLat),
        lng: parseFloat(vLng),
        city: h.get("x-vercel-ip-city") ?? undefined,
        region: h.get("x-vercel-ip-country-region") ?? undefined,
        country: h.get("x-vercel-ip-country") ?? undefined,
      };
    }

    // ── IP fallback (local dev / non-Vercel) ─────────────────────────────
    const forwarded = h.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;

    // Skip loopback / LAN — ipapi.co can't resolve private IPs
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return null;
    }

    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      next: { revalidate: 3600 }, // cache 1 h per IP
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error || !data.latitude || !data.longitude) return null;

    return {
      lat: data.latitude as number,
      lng: data.longitude as number,
      city: data.city as string | undefined,
      region: data.region as string | undefined,
      country: data.country_name as string | undefined,
    };
  } catch {
    return null;
  }
}
