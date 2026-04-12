/** Nominatim geocoding (free, no key required, 1 req/s limit) */
export async function geocode(
  city?: string,
  country?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!city && !country) return null;
  const q = [city, country].filter(Boolean).join(", ");
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 HackathonMap/1.0" },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error(`[geocode] ${res.status} for q="${q}"`);
      return null;
    }
    const data = await res.json();
    if (!data[0]) {
      console.error(`[geocode] empty result for q="${q}"`);
      return null;
    }
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {
    console.error(`[geocode] exception for q="${q}":`, e);
    return null;
  }
}
