"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Hackathon, Profile, LfgPost } from "@/types/database";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

interface SavedDashboardProps {
  hackathons: Hackathon[];
  builders: Profile[];
  myPosts: LfgPost[];
}

export default function SavedDashboard({
  hackathons,
  builders,
  myPosts: initialPosts,
}: SavedDashboardProps) {
  const supabase = createClient();
  const [myPosts, setMyPosts] = useState(initialPosts);

  async function updatePostStatus(
    postId: string,
    status: "open" | "in_conversation" | "closed"
  ) {
    const { error } = await supabase
      .from("lfg_posts")
      .update({ status })
      .eq("id", postId);

    if (!error) {
      setMyPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status } : p))
      );
    }
  }

  return (
    <Tabs defaultValue="hackathons">
      <TabsList>
        <TabsTrigger value="hackathons">
          Hackathons ({hackathons.length})
        </TabsTrigger>
        <TabsTrigger value="builders">
          Builders ({builders.length})
        </TabsTrigger>
        <TabsTrigger value="my_posts">
          My Posts ({myPosts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hackathons">
        {hackathons.length === 0 ? (
          <EmptyState message="No saved hackathons yet. Browse hackathons and save ones you're interested in." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {hackathons.map((h) => (
              <Link key={h.id} href={`/hackathons/${h.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1">{h.name}</CardTitle>
                      <Badge
                        variant={
                          h.status === "active"
                            ? "default"
                            : h.status === "upcoming"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {h.status}
                      </Badge>
                    </div>
                    {h.organizer && (
                      <CardDescription>{h.organizer}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(h.start_date || h.end_date) && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {h.start_date &&
                            new Date(h.start_date).toLocaleDateString()}
                          {h.end_date &&
                            ` - ${new Date(h.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                    {(h.location_city || h.location_country) && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {[h.location_city, h.location_country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="builders">
        {builders.length === 0 ? (
          <EmptyState message="No saved builders yet. Explore the map and save builders you'd like to connect with." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {builders.map((b) => (
              <Link key={b.id} href={`/builders/${b.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 pt-4">
                    <Avatar size="lg">
                      {b.avatar_url && <AvatarImage src={b.avatar_url} />}
                      <AvatarFallback>
                        {b.full_name?.charAt(0) ??
                          b.username?.charAt(0) ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {b.full_name ?? b.username ?? "Anonymous"}
                      </p>
                      {(b.location_city || b.location_country) && (
                        <p className="truncate text-sm text-muted-foreground">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {[b.location_city, b.location_country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="my_posts">
        {myPosts.length === 0 ? (
          <EmptyState message="You haven't created any LFG posts yet. Create one to find teammates!" />
        ) : (
          <div className="grid gap-4">
            {myPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-1">
                        {post.title}
                      </CardTitle>
                      <CardDescription>
                        {post.type === "looking_for_team"
                          ? "Looking for Team"
                          : "Looking for Members"}
                        {post.hackathon && ` - ${post.hackathon.name}`}
                      </CardDescription>
                    </div>
                    <Select
                      value={post.status}
                      onValueChange={(v) =>
                        updatePostStatus(
                          post.id,
                          v as "open" | "in_conversation" | "closed"
                        )
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_conversation">
                          In Conversation
                        </SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {post.skills_offered.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                    {post.roles_needed.map((r) => (
                      <Badge key={r} variant="secondary">
                        {r}
                      </Badge>
                    ))}
                    {post.modality && (
                      <Badge variant="outline">{post.modality}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <p className="max-w-sm text-muted-foreground">{message}</p>
    </div>
  );
}
