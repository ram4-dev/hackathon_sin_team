"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { LfgPost } from "@/types/database";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ROLES } from "@/types/database";
import { Plus, Search, Users, User } from "lucide-react";

const MODALITY_LABELS: Record<string, string> = {
  remote: "Remote",
  "in-person": "In-person",
  both: "Both",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_conversation: "In Conversation",
  closed: "Closed",
};

const ROLE_FILTER_LABELS: Record<string, string> = {
  all: "All roles",
};

const MODALITY_FILTER_LABELS: Record<string, string> = {
  all: "All modalities",
  remote: "Remote",
  "in-person": "In-person",
  both: "Both",
};

interface LfgListProps {
  posts: LfgPost[];
}

export default function LfgList({ posts }: LfgListProps) {
  const [hackathonSearch, setHackathonSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (
        hackathonSearch &&
        post.hackathon?.name &&
        !post.hackathon.name.toLowerCase().includes(hackathonSearch.toLowerCase())
      ) {
        return false;
      }
      if (roleFilter !== "all") {
        const hasRole =
          post.roles_needed.includes(roleFilter) ||
          post.skills_offered.includes(roleFilter);
        if (!hasRole) return false;
      }
      if (modalityFilter !== "all" && post.modality !== modalityFilter) {
        return false;
      }
      return true;
    });
  }, [posts, hackathonSearch, roleFilter, modalityFilter]);

  const teamPosts = filteredPosts.filter((p) => p.type === "looking_for_team");
  const memberPosts = filteredPosts.filter((p) => p.type === "looking_for_members");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search hackathon..."
              value={hackathonSearch}
              onChange={(e) => setHackathonSearch(e.target.value)}
              className="pl-8 w-48"
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="w-36">
              <span className="flex flex-1 text-left text-sm">
                {ROLE_FILTER_LABELS[roleFilter] ?? roleFilter}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modalityFilter} onValueChange={(v) => setModalityFilter(v ?? "all")}>
            <SelectTrigger className="w-36">
              <span className="flex flex-1 text-left text-sm">
                {MODALITY_FILTER_LABELS[modalityFilter] ?? modalityFilter}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modalities</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="in-person">In-person</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link href="/lfg/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="looking_for_team">
        <TabsList>
          <TabsTrigger value="looking_for_team">
            <User className="mr-1 h-4 w-4" />
            Looking for Team ({teamPosts.length})
          </TabsTrigger>
          <TabsTrigger value="looking_for_members">
            <Users className="mr-1 h-4 w-4" />
            Looking for Members ({memberPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="looking_for_team">
          {teamPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No posts found. Be the first to look for a team!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teamPosts.map((post) => (
                <LfgCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="looking_for_members">
          {memberPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No posts found. Be the first to recruit members!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {memberPosts.map((post) => (
                <LfgCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LfgCard({ post }: { post: LfgPost }) {
  const authorInitial =
    post.author?.full_name?.charAt(0) ??
    post.author?.username?.charAt(0) ??
    "?";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
          <Badge variant="outline">
            {post.type === "looking_for_team" ? "LF Team" : "LF Members"}
          </Badge>
        </div>
        {post.hackathon && (
          <CardDescription>
            <Link href={`/hackathons/${post.hackathon.id}`} className="hover:underline">
              {post.hackathon.name}
            </Link>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} />}
            <AvatarFallback>{authorInitial}</AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {post.author?.full_name ?? post.author?.username ?? "Anonymous"}
          </span>
        </div>

        {post.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {post.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {post.skills_offered.map((skill) => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
          {post.roles_needed.map((role) => (
            <Badge key={role} variant="secondary">{role}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.modality && (
            <Badge variant="outline">{MODALITY_LABELS[post.modality] ?? post.modality}</Badge>
          )}
          {post.language && (
            <Badge variant="outline">{post.language.toUpperCase()}</Badge>
          )}
          <Badge variant={post.status === "open" ? "default" : "secondary"}>
            {STATUS_LABELS[post.status] ?? post.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
