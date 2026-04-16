export const LOCATION_FUZZ_KM = 3;

function offsetFromDisk(lat: number, lng: number, radiusKm: number, rand1: number, rand2: number) {
  const r = radiusKm * Math.sqrt(rand1);
  const angle = 2 * Math.PI * rand2;
  const deltaLat = (r * Math.cos(angle)) / 111;
  const deltaLng = (r * Math.sin(angle)) / (111 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + deltaLat, lng: lng + deltaLng };
}

/**
 * Uniformly offsets a coordinate within a disk of `radiusKm`, for privacy.
 * At zoom 9 a 3 km jitter is imperceptible on the map but prevents exposing
 * exact user coordinates (from browser geolocation) to other users.
 */
export function fuzzCoords(lat: number, lng: number, radiusKm = LOCATION_FUZZ_KM) {
  return offsetFromDisk(lat, lng, radiusKm, Math.random(), Math.random());
}

// FNV-1a 32-bit hash of a string → stable seed per entity (e.g. user id).
function hashStringToU32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — tiny, deterministic PRNG in [0,1).
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic variant: same `seed` always produces the same offset.
 * Use with a stable id (profile.id) so a builder's marker doesn't jitter
 * between page loads, but is never shown at its true coordinates.
 */
export function fuzzCoordsSeeded(lat: number, lng: number, seed: string, radiusKm = LOCATION_FUZZ_KM) {
  const prng = mulberry32(hashStringToU32(seed));
  return offsetFromDisk(lat, lng, radiusKm, prng(), prng());
}
