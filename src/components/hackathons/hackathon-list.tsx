"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Hackathon } from "@/types/database";
import { HACKATHON_CATEGORIES } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, MapPin, Trophy, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

const MODALITIES = ["remote", "in-person", "hybrid"] as const;
const STATUSES = ["upcoming", "active", "past"] as const;

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

export function HackathonList({ hackathons }: { hackathons: Hackathon[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [modalityFilter, setModalityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const h of hackathons) {
      if (h.location_country) set.add(h.location_country);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [hackathons]);

  // Cities narrow to the selected country when one is chosen.
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const h of hackathons) {
      if (!h.location_city) continue;
      if (countryFilter && h.location_country !== countryFilter) continue;
      set.add(h.location_city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [hackathons, countryFilter]);

  const filtered = hackathons.filter((h) => {
    const matchesSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.organizer ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !categoryFilter || h.category === categoryFilter;

    const matchesModality =
      !modalityFilter || h.modality === modalityFilter;

    const matchesStatus =
      !statusFilter || h.status === statusFilter;

    const matchesCountry =
      !countryFilter || h.location_country === countryFilter;

    const matchesCity = !cityFilter || h.location_city === cityFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesModality &&
      matchesStatus &&
      matchesCountry &&
      matchesCity
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hackathons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter ?? ""}
          onValueChange={(val) => setCategoryFilter(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {HACKATHON_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
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
                {formatLabel(m)}
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
                {formatLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={countryFilter ?? ""}
          onValueChange={(val) => {
            setCountryFilter(val || null);
            // Reset city when country changes so stale selections don't hide everything.
            setCityFilter(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={cityFilter ?? ""}
          onValueChange={(val) => setCityFilter(val || null)}
          disabled={cities.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {hackathons.length} hackathons
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hackathons match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hackathon) => (
            <Link
              key={hackathon.id}
              href={`/hackathons/${hackathon.id}`}
              className="group"
            >
              <Card
                className={`h-full transition-colors hover:bg-muted/50 ${
                  hackathon.is_featured ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">
                      {hackathon.name}
                    </CardTitle>
                    <Badge className={getStatusColor(hackathon.status)}>
                      {formatLabel(hackathon.status)}
                    </Badge>
                  </div>
                  {hackathon.organizer && (
                    <p className="text-xs text-muted-foreground">
                      by {hackathon.organizer}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {/* Dates */}
                  {(hackathon.start_date || hackathon.end_date) && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {formatDate(hackathon.start_date)}
                      {hackathon.end_date &&
                        ` - ${formatDate(hackathon.end_date)}`}
                    </p>
                  )}

                  {/* Location */}
                  {(hackathon.location_city || hackathon.location_country) && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {[hackathon.location_city, hackathon.location_country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  {/* Prize pool */}
                  {hackathon.prize_pool && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-yellow-400">
                      <Trophy className="size-3.5" />
                      {hackathon.prize_pool}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="secondary">
                      {formatLabel(hackathon.modality)}
                    </Badge>
                    {hackathon.category && (
                      <Badge variant="outline">{hackathon.category}</Badge>
                    )}
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
