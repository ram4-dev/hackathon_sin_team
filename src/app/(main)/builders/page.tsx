import { createClient } from "@/lib/supabase/server";
import { BuilderList } from "@/components/builders/builder-list";
import type { Profile } from "@/types/database";

export default async function BuildersPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
  }

  const builders: Profile[] = profiles ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Builders</h1>
        <p className="mt-1 text-muted-foreground">
          {builders.length} builder{builders.length !== 1 ? "s" : ""} in the
          community
        </p>
      </div>
      <BuilderList builders={builders} />
    </div>
  );
}
