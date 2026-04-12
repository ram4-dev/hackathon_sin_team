import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, Trophy, MessageSquare, Settings } from "lucide-react";

export default async function AdminPage() {
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

  const [buildersResult, hackathonsResult, lfgResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("hackathons").select("id", { count: "exact", head: true }),
    supabase.from("lfg_posts").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Total Builders",
      count: buildersResult.count ?? 0,
      icon: Users,
    },
    {
      label: "Total Hackathons",
      count: hackathonsResult.count ?? 0,
      icon: Trophy,
    },
    {
      label: "Total LFG Posts",
      count: lfgResult.count ?? 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <Badge>Admin</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{stat.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/admin/hackathons"
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Manage Hackathons</p>
              <p className="text-sm text-muted-foreground">
                Create, edit, feature, or delete hackathons
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
