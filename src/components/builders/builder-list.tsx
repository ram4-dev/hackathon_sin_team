"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { ROLES, STACKS } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";

const MODALITIES = ["remote", "in-person", "both"] as const;
const STATUSES = ["available", "looking_for_team", "networking"] as const;

function getStatusColor(status: Profile["status"]) {
  switch (status) {
    case "available":
      return "bg-green-500/15 text-green-400 border-green-500/25";
    case "looking_for_team":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/25";
    case "networking":
      return "bg-gray-500/15 text-gray-400 border-gray-500/25";
    default:
      return "";
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

export function BuilderList({ builders }: { builders: Profile[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [stackFilter, setStackFilter] = useState<string | null>(null);
  const [modalityFilter, setModalityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = builders.filter((b) => {
    const matchesSearch =
      !search ||
      (b.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.username ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      !roleFilter || b.roles.includes(roleFilter);

    const matchesStack =
      !stackFilter || b.stack.includes(stackFilter);

    const matchesModality =
      !modalityFilter || b.modality === modalityFilter;

    const matchesStatus =
      !statusFilter || b.status === statusFilter;

    return (
      matchesSearch &&
      matchesRole &&
      matchesStack &&
      matchesModality &&
      matchesStatus
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search builders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={roleFilter ?? ""}
          onValueChange={(val) => setRoleFilter(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stackFilter ?? ""}
          onValueChange={(val) => setStackFilter(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Stack" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Stacks</SelectItem>
            {STACKS.map((stack) => (
              <SelectItem key={stack} value={stack}>
                {stack}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={modalityFilter ?? ""}
          onValueChange={(val) => setModalityFilter(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Modality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Modalities</SelectItem>
            {MODALITIES.map((m) => (
              <SelectItem key={m} value={m}>
                {formatStatus(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter ?? ""}
          onValueChange={(val) => setStatusFilter(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {builders.length} builders
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No builders match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((builder) => (
            <Link
              key={builder.id}
              href={`/builders/${builder.id}`}
              className="group"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={builder.avatar_url ?? ""}
                        alt={builder.full_name ?? "Builder"}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(builder.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {builder.full_name ?? builder.username ?? "Anonymous"}
                      </p>
                      {(builder.location_city || builder.location_country) && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {[builder.location_city, builder.location_country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stack badges */}
                  {builder.stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {builder.stack.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                      {builder.stack.length > 3 && (
                        <Badge variant="outline">
                          +{builder.stack.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Role and status badges */}
                  <div className="flex flex-wrap items-center gap-1">
                    {builder.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                    <Badge className={getStatusColor(builder.status)}>
                      {formatStatus(builder.status)}
                    </Badge>
                    <Badge variant="secondary">
                      {formatStatus(builder.modality)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
