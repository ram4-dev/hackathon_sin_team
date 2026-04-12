import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { getGeoLocation } from "@/lib/geoip";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="flex-1 bg-background" /> }
);

export default async function MapPage() {
  const supabase = await createClient();

  const [{ data: builders }, { data: hackathons }, { data: remoteHackathons }, geo] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, location_city, location_country, location_lat, location_lng, stack, roles, modality, status")
      .not("location_lat", "is", null),
    supabase
      .from("hackathons")
      .select("id, name, organizer, start_date, end_date, modality, location_city, location_country, location_lat, location_lng, category, tags, prize_pool, status, is_featured")
      .not("location_lat", "is", null),
    supabase
      .from("hackathons")
      .select("id, name, organizer, start_date, end_date, category, tags, prize_pool, status, official_url, image_url")
      .eq("modality", "remote")
      .in("status", ["upcoming", "active"])
      .order("start_date", { ascending: true })
      .limit(50),
    getGeoLocation(),
  ]);

  return (
    <MapView
      builders={builders ?? []}
      hackathons={hackathons ?? []}
      remoteHackathons={remoteHackathons ?? []}
      initialCenter={geo ?? undefined}
    />
  );
}
