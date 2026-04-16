export const LOCATION_FUZZ_KM = 3;

/**
 * Uniformly offsets a coordinate within a disk of `radiusKm`, for privacy.
 * At zoom 9 a 3 km jitter is imperceptible on the map but prevents exposing
 * exact user coordinates (from browser geolocation) to other users.
 */
export function fuzzCoords(lat: number, lng: number, radiusKm = LOCATION_FUZZ_KM) {
  const r = radiusKm * Math.sqrt(Math.random());
  const angle = 2 * Math.PI * Math.random();
  const deltaLat = (r * Math.cos(angle)) / 111;
  const deltaLng = (r * Math.sin(angle)) / (111 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + deltaLat, lng: lng + deltaLng };
}
