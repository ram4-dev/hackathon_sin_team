import { createClient } from "@/lib/supabase/server";
import { HackathonList } from "@/components/hackathons/hackathon-list";
import { LumaImportButton } from "@/components/hackathons/luma-import-button";
import type { Hackathon } from "@/types/database";

export default async function HackathonsPage() {
  const supabase = await createClient();

  const { data: hackathons, error } = await supabase
    .from("hackathons")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching hackathons:", error);
  }

  const items: Hackathon[] = hackathons ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hackathons</h1>
          <p className="mt-1 text-muted-foreground">
            {items.length} hackathon{items.length !== 1 ? "s" : ""} listed
          </p>
        </div>
        <LumaImportButton />
      </div>
      <HackathonList hackathons={items} />
    </div>
  );
}
