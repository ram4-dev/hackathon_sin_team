import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET /api/hackathons/:id */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
