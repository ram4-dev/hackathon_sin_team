import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import type { LfgPost } from "@/types/database";
import LfgList from "@/components/lfg/lfg-list";

export default async function LfgPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }

  const supabase = createClient();

  const { data: posts } = await supabase
    .from("lfg_posts")
    .select("*, author:profiles(*), hackathon:hackathons(*)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          Find teammates or join a team for your next hackathon
        </p>
      </div>
      <LfgList posts={(posts as LfgPost[]) ?? []} />
    </div>
  );
}
