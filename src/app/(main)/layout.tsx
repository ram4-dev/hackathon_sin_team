import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import type { Profile } from "@/types/database";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getAuthUserId();
  const supabase = createClient();

  const { data: profile } = userId
    ? await supabase.from("profiles").select("*").eq("id", userId).single()
    : { data: null };

  // Redirect to onboarding if user is authenticated but has no username
  if (userId && (!profile || !profile.username)) {
    redirect("/onboarding");
  }

  const { count: unreadCount } = userId
    ? await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
    : { count: 0 };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar profile={profile as Profile | null} unreadCount={unreadCount ?? 0} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
