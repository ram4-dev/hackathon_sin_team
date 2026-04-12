import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET /api/builders/:id */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, location_city, location_country, location_lat, location_lng, stack, roles, modality, status, github_url, x_url, linkedin_url, website_url, telegram_url, discord_url, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Builder not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
