"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import type { Hackathon } from "@/types/database";
import { ROLES, STACKS } from "@/types/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewLfgPostPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const supabase = createClient();

  const [type, setType] = useState<"looking_for_team" | "looking_for_members">(
    "looking_for_team"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hackathonId, setHackathonId] = useState<string>("");
  const [hackathonSearch, setHackathonSearch] = useState("");
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([]);
  const [modality, setModality] = useState<string>("remote");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("en");
  const [levelExpected, setLevelExpected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHackathons() {
      const { data } = await supabase
        .from("hackathons")
        .select("*")
        .order("start_date", { ascending: false });
      if (data) setHackathons(data as Hackathon[]);
    }
    fetchHackathons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHackathons = hackathons.filter((h) =>
    h.name.toLowerCase().includes(hackathonSearch.toLowerCase())
  );

  function toggleSkill(skill: string) {
    setSkillsOffered((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function toggleRole(role: string) {
    setRolesNeeded((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("lfg_posts").insert({
      type,
      title,
      description: description || null,
      hackathon_id: hackathonId || null,
      author_id: userId,
      skills_offered: type === "looking_for_team" ? skillsOffered : [],
      roles_needed: type === "looking_for_members" ? rolesNeeded : [],
      modality: modality as "remote" | "in-person" | "both",
      timezone: timezone || null,
      language,
      level_expected:
        type === "looking_for_members" ? levelExpected || null : null,
      status: "open",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/lfg");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link href="/lfg">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create LFG Post
          </h1>
          <p className="text-muted-foreground">
            Find your next hackathon team
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Fill in the details to find teammates or recruit members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType((v ?? "looking_for_team") as "looking_for_team" | "looking_for_members")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="looking_for_team">
                    Looking for Team
                  </SelectItem>
                  <SelectItem value="looking_for_members">
                    Looking for Members
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                placeholder="e.g. Fullstack dev looking for AI hackathon team"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Tell others about yourself or your team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Hackathon</Label>
              <Input
                placeholder="Search hackathons..."
                value={hackathonSearch}
                onChange={(e) => setHackathonSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={hackathonId} onValueChange={(v) => setHackathonId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a hackathon" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHackathons.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === "looking_for_team" && (
              <div className="space-y-2">
                <Label>Skills Offered</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STACKS.map((stack) => (
                    <Badge
                      key={stack}
                      variant={
                        skillsOffered.includes(stack) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleSkill(stack)}
                    >
                      {stack}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {type === "looking_for_members" && (
              <>
                <div className="space-y-2">
                  <Label>Roles Needed</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => (
                      <Badge
                        key={role}
                        variant={
                          rolesNeeded.includes(role) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleRole(role)}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Level Expected</Label>
                  <Input
                    placeholder="e.g. Intermediate, Senior..."
                    value={levelExpected}
                    onChange={(e) => setLevelExpected(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Modality</Label>
                <Select value={modality} onValueChange={(v) => setModality(v ?? "remote")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="in-person">In-person</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  placeholder="e.g. UTC-5"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  placeholder="en"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
