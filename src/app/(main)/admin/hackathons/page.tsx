import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import type { Hackathon } from "@/types/database";
import AdminHackathonList from "@/components/hackathons/admin-hackathon-list";

export default async function AdminHackathonsPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect("/login");
  }

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_admin) {
    redirect("/map");
  }

  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manage Hackathons
        </h1>
        <p className="text-muted-foreground">
          Create, edit, and manage hackathon listings
        </p>
      </div>
      <AdminHackathonList
        hackathons={(hackathons as Hackathon[]) ?? []}
        userId={userId}
      />
    </div>
  );
}
