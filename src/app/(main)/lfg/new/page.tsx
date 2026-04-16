"use client";

import { useState, useEffect, useRef } from "react";
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
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const POST_TYPE_LABELS: Record<string, string> = {
  looking_for_team: "Looking for Team",
  looking_for_members: "Looking for Members",
};

const MODALITY_LABELS: Record<string, string> = {
  remote: "Remote",
  "in-person": "In-person",
  both: "Both",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文" },
];

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
  const [hackathonDropdownOpen, setHackathonDropdownOpen] = useState(false);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([]);
  const [modality, setModality] = useState<string>("remote");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("en");
  const [levelExpected, setLevelExpected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hackathonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchHackathons() {
      const { data } = await supabase
        .from("hackathons")
        .select("id, name, start_date, status")
        .order("start_date", { ascending: false });
      if (data) setHackathons(data as Hackathon[]);
    }
    fetchHackathons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (hackathonRef.current && !hackathonRef.current.contains(e.target as Node)) {
        setHackathonDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredHackathons = hackathons
    .filter((h) =>
      hackathonSearch.length === 0 ||
      h.name.toLowerCase().includes(hackathonSearch.toLowerCase())
    )
    .slice(0, 8);

  function selectHackathon(h: Hackathon) {
    setHackathonId(h.id);
    setHackathonSearch(h.name);
    setHackathonDropdownOpen(false);
  }

  function clearHackathon() {
    setHackathonId("");
    setHackathonSearch("");
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Create Team Post</h1>
          <p className="text-muted-foreground">Find your next hackathon team</p>
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

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType((v ?? "looking_for_team") as typeof type)
                }
              >
                <SelectTrigger className="w-full">
                  <span className="flex flex-1 text-left text-sm">
                    {POST_TYPE_LABELS[type]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="looking_for_team">Looking for Team</SelectItem>
                  <SelectItem value="looking_for_members">Looking for Members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                placeholder="e.g. Fullstack dev looking for AI hackathon team"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Tell others about yourself or your team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Hackathon combobox */}
            <div className="space-y-2">
              <Label>Hackathon <span className="text-muted-foreground">(optional)</span></Label>
              <div className="relative" ref={hackathonRef}>
                <div className="relative">
                  <Input
                    placeholder="Search hackathons by name..."
                    value={hackathonSearch}
                    onChange={(e) => {
                      setHackathonSearch(e.target.value);
                      setHackathonId("");
                      setHackathonDropdownOpen(true);
                    }}
                    onFocus={() => setHackathonDropdownOpen(true)}
                    className={cn(hackathonId && "pr-8")}
                  />
                  {hackathonId && (
                    <button
                      type="button"
                      onClick={clearHackathon}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {hackathonDropdownOpen && filteredHackathons.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md overflow-hidden">
                    {filteredHackathons.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectHackathon(h)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                          h.id === hackathonId && "bg-accent"
                        )}
                      >
                        <span className="font-medium">{h.name}</span>
                        {h.start_date && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(h.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Skills offered (looking for team) */}
            {type === "looking_for_team" && (
              <div className="space-y-2">
                <Label>Skills Offered</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STACKS.map((stack) => (
                    <Badge
                      key={stack}
                      variant={skillsOffered.includes(stack) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(stack)}
                    >
                      {stack}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Roles needed (looking for members) */}
            {type === "looking_for_members" && (
              <>
                <div className="space-y-2">
                  <Label>Roles Needed</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => (
                      <Badge
                        key={role}
                        variant={rolesNeeded.includes(role) ? "default" : "outline"}
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

            {/* Modality / Timezone / Language */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Modality</Label>
                <Select value={modality} onValueChange={(v) => setModality(v ?? "remote")}>
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 text-left text-sm">
                      {MODALITY_LABELS[modality] ?? modality}
                    </span>
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
                <Select value={language} onValueChange={(v) => setLanguage(v ?? "en")}>
                  <SelectTrigger className="w-full">
                    <span className="flex flex-1 text-left text-sm">
                      {LANGUAGE_OPTIONS.find((l) => l.value === language)?.label ?? language}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !title}>
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
