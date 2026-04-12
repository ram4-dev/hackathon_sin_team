import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/lfg
 *
 * Query params:
 *   type          - "looking_for_team" | "looking_for_members"
 *   status        - "open" | "in_conversation" | "closed" (default: open)
 *   hackathon_id  - filter by hackathon
 *   modality      - "remote" | "in-person" | "both"
 *   skill         - matches against skills_offered array
 *   role_needed   - matches against roles_needed array
 *   limit         - max results (default 20, max 100)
 *   offset        - pagination offset
 *
 * POST /api/lfg  — requires auth
 * Body: { type, hackathon_id?, title, description?, skills_offered, roles_needed, modality, timezone?, language, level_expected? }
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = request.nextUrl;

  const type = searchParams.get("type");
  const status = searchParams.get("status") ?? "open";
  const hackathonId = searchParams.get("hackathon_id");
  const modality = searchParams.get("modality");
  const skill = searchParams.get("skill");
  const roleNeeded = searchParams.get("role_needed");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = supabase
    .from("lfg_posts")
    .select(
      `*, author:profiles(id, username, full_name, avatar_url, location_city, location_country, roles, stack, status)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (hackathonId) query = query.eq("hackathon_id", hackathonId);
  if (modality) query = query.eq("modality", modality);
  if (skill) query = query.contains("skills_offered", [skill]);
  if (roleNeeded) query = query.contains("roles_needed", [roleNeeded]);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, limit, offset });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const body = await request.json();
  const { type, hackathon_id, title, description, skills_offered, roles_needed, modality, timezone, language, level_expected } = body;

  if (!type || !title || !language) {
    return NextResponse.json(
      { error: "Missing required fields: type, title, language" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("lfg_posts")
    .insert({
      type,
      hackathon_id: hackathon_id ?? null,
      author_id: userId,
      title,
      description: description ?? null,
      skills_offered: skills_offered ?? [],
      roles_needed: roles_needed ?? [],
      modality: modality ?? null,
      timezone: timezone ?? null,
      language,
      level_expected: level_expected ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
