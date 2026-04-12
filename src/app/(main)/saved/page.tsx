import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import type { SavedItem, Hackathon, Profile, LfgPost } from "@/types/database";
import SavedDashboard from "@/components/saved-dashboard";

export default async function SavedPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }

  const supabase = createClient();

  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const items = (savedItems as SavedItem[]) ?? [];

  const hackathonIds = items
    .filter((i) => i.item_type === "hackathon")
    .map((i) => i.item_id);

  const builderIds = items
    .filter((i) => i.item_type === "builder")
    .map((i) => i.item_id);

  const [hackathonsResult, buildersResult, myPostsResult] = await Promise.all([
    hackathonIds.length > 0
      ? supabase
          .from("hackathons")
          .select("*")
          .in("id", hackathonIds)
      : Promise.resolve({ data: [] }),
    builderIds.length > 0
      ? supabase
          .from("profiles")
          .select("*")
          .in("id", builderIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("lfg_posts")
      .select("*, hackathon:hackathons(*)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Items</h1>
        <p className="text-muted-foreground">
          Your bookmarked hackathons, builders, and LFG posts
        </p>
      </div>
      <SavedDashboard
        hackathons={(hackathonsResult.data as Hackathon[]) ?? []}
        builders={(buildersResult.data as Profile[]) ?? []}
        myPosts={(myPostsResult.data as LfgPost[]) ?? []}
      />
    </div>
  );
}
