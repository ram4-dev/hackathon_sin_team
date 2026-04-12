import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Hackathon, Profile, LfgPost } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HackathonActions } from "@/components/hackathons/hackathon-actions";
import {
  Calendar,
  MapPin,
  Trophy,
  ExternalLink,
  Clock,
  Users,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

function getStatusColor(status: Hackathon["status"]) {
  switch (status) {
    case "upcoming":
      return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    case "active":
      return "bg-green-500/15 text-green-400 border-green-500/25";
    case "past":
      return "bg-gray-500/15 text-gray-400 border-gray-500/25";
    default:
      return "";
  }
}

function formatLabel(str: string) {
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch hackathon
  const { data: hackathon, error } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !hackathon) {
    notFound();
  }

  const h = hackathon as Hackathon;

  // Fetch interested users with profiles
  const { data: interests } = await supabase
    .from("hackathon_interests")
    .select("*, profiles:user_id(*)")
    .eq("hackathon_id", id);

  const interestedProfiles: Profile[] = (interests ?? [])
    .map((i: { profiles: Profile | null }) => i.profiles)
    .filter(Boolean) as Profile[];

  const interestedCount = interestedProfiles.length;

  // Fetch LFG posts for this hackathon
  const { data: lfgPosts } = await supabase
    .from("lfg_posts")
    .select("*, author:author_id(*)")
    .eq("hackathon_id", id)
    .order("created_at", { ascending: false });

  const posts: LfgPost[] = (lfgPosts ?? []) as LfgPost[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{h.name}</h1>
              {h.is_featured && (
                <Badge variant="default" className="text-xs">
                  Featured
                </Badge>
              )}
            </div>
            {h.organizer && (
              <p className="text-muted-foreground">by {h.organizer}</p>
            )}
          </div>
          <HackathonActions
            hackathonId={h.id}
            interestedCount={interestedCount}
          />
        </div>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge className={getStatusColor(h.status)}>
            {formatLabel(h.status)}
          </Badge>
          <Badge variant="secondary">{formatLabel(h.modality)}</Badge>
          {h.category && <Badge variant="outline">{h.category}</Badge>}
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {(h.start_date || h.end_date) && (
            <p className="flex items-center gap-2">
              <Calendar className="size-4" />
              {formatDate(h.start_date)}
              {h.end_date && ` - ${formatDate(h.end_date)}`}
            </p>
          )}
          {h.registration_deadline && (
            <p className="flex items-center gap-2">
              <Clock className="size-4" />
              Registration deadline: {formatDate(h.registration_deadline)}
            </p>
          )}
          {(h.location_city || h.location_country) && (
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {[h.location_city, h.location_country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {h.prize_pool && (
            <p className="flex items-center gap-2 font-medium text-yellow-400">
              <Trophy className="size-4" />
              {h.prize_pool}
            </p>
          )}
        </div>

        {h.official_url && (
          <div className="mt-4">
            <a
              href={h.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-1.5 size-4" />
                Official Website
              </Button>
            </a>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Description */}
      {h.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {h.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Requirements */}
      {h.requirements && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-muted-foreground">
              {h.requirements}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interested Builders */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Interested Builders ({interestedCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interestedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one has expressed interest yet. Be the first!
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {interestedProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/builders/${profile.id}`}
                  className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
                >
                  <Avatar>
                    {profile.avatar_url && (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.full_name ?? "Builder"}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">
                    {profile.full_name ?? profile.username ?? "Anonymous"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LFG Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            LFG Posts ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No LFG posts for this hackathon yet.
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{post.title}</h3>
                      {post.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {post.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        post.status === "open" ? "default" : "secondary"
                      }
                    >
                      {formatLabel(post.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {formatLabel(post.type)}
                    </Badge>
                    {post.author && (
                      <Link
                        href={`/builders/${post.author.id}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Avatar className="size-4">
                          {post.author.avatar_url && (
                            <AvatarImage
                              src={post.author.avatar_url}
                              alt={post.author.full_name ?? ""}
                            />
                          )}
                          <AvatarFallback className="text-[8px]">
                            {getInitials(post.author.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {post.author.full_name ?? post.author.username}
                      </Link>
                    )}
                    {post.roles_needed.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Looking for: {post.roles_needed.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
