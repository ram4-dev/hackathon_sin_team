"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Filter, Layers, MapPin, Trophy, Users, X, Calendar, ExternalLink,
} from "lucide-react";
import { ROLES, STACKS, HACKATHON_CATEGORIES } from "@/types/database";
import type { Profile, Hackathon } from "@/types/database";
import { fuzzCoords, fuzzCoordsSeeded } from "@/lib/fuzz-coords";

type MapBuilder = Pick<
  Profile,
  "id" | "full_name" | "username" | "avatar_url" | "location_city" | "location_country" | "location_lat" | "location_lng" | "stack" | "roles" | "modality" | "status"
>;

type MapHackathon = Pick<
  Hackathon,
  "id" | "name" | "organizer" | "start_date" | "end_date" | "modality" | "location_city" | "location_country" | "location_lat" | "location_lng" | "category" | "tags" | "prize_pool" | "status" | "is_featured"
>;

type RemoteHackathon = {
  id: string;
  name: string;
  organizer?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  category?: string | null;
  tags?: string[] | null;
  prize_pool?: string | null;
  status: string;
  official_url?: string | null;
  image_url?: string | null;
};

interface MapViewProps {
  builders: MapBuilder[];
  hackathons: MapHackathon[];
  remoteHackathons?: RemoteHackathon[];
  initialCenter?: { lat: number; lng: number };
}

type Layer = "builders" | "hackathons" | "both";

type TooltipState = {
  x: number;
  y: number;
  type: "builder" | "hackathon";
  data: MapBuilder | MapHackathon;
} | null;

type CardState = {
  type: "builder" | "hackathon";
  data: MapBuilder | MapHackathon;
} | null;

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  looking_for_team: "#eab308",
  networking: "#6b7280",
};

const HACKATHON_COLORS: Record<string, string> = {
  upcoming: "#3b82f6",
  active: "#22c55e",
  past: "#6b7280",
};

const ZOOM_THRESHOLD = 13;

function formatLabel(str: string) {
  return str.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Hover tooltip (minimal) ────────────────────────────────────────────────
function BuilderTooltip({ data }: { data: MapBuilder }) {
  return (
    <div className="min-w-[150px]">
      <p className="font-semibold text-xs text-foreground leading-tight">{data.full_name ?? data.username ?? "Builder"}</p>
      {data.location_city && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{data.location_city}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-1.5">
        <Badge className={
          data.status === "available" ? "bg-green-500/15 text-green-400 border-green-500/25 text-[10px] px-1.5 py-0" :
          data.status === "looking_for_team" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[10px] px-1.5 py-0" :
          "bg-gray-500/15 text-gray-400 border-gray-500/25 text-[10px] px-1.5 py-0"
        }>
          {formatLabel(data.status)}
        </Badge>
        {data.roles.slice(0, 2).map((r) => (
          <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
        ))}
      </div>
    </div>
  );
}

function HackathonTooltip({ data }: { data: MapHackathon }) {
  return (
    <div className="min-w-[150px]">
      <p className="font-semibold text-xs text-foreground leading-tight">{data.name}</p>
      {data.organizer && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{data.organizer}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {data.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{data.category}</Badge>}
        {data.prize_pool && <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[10px] px-1.5 py-0">{data.prize_pool}</Badge>}
      </div>
    </div>
  );
}

// ── Floating detail card (click at max zoom) ──────────────────────────────
function BuilderCard({ data, onClose }: { data: MapBuilder; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-10 w-10 shrink-0">
            {data.avatar_url && <AvatarImage src={data.avatar_url} alt={data.full_name ?? ""} />}
            <AvatarFallback className="text-xs">{getInitials(data.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm leading-tight">{data.full_name ?? data.username ?? "Builder"}</p>
            {data.username && <p className="text-xs text-muted-foreground">@{data.username}</p>}
            {data.location_city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{data.location_city}
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge className={
          data.status === "available" ? "bg-green-500/15 text-green-400 border-green-500/25" :
          data.status === "looking_for_team" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" :
          "bg-gray-500/15 text-gray-400 border-gray-500/25"
        }>
          {formatLabel(data.status)}
        </Badge>
        <Badge variant="secondary">{formatLabel(data.modality)}</Badge>
      </div>

      {data.roles.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Roles</p>
          <div className="flex flex-wrap gap-1">
            {data.roles.map((r) => (
              <Badge key={r} variant="outline" className="text-xs">{formatLabel(r)}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.stack.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Stack</p>
          <div className="flex flex-wrap gap-1">
            {data.stack.slice(0, 6).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {data.stack.length > 6 && (
              <Badge variant="secondary" className="text-xs">+{data.stack.length - 6}</Badge>
            )}
          </div>
        </div>
      )}

      <Link href={`/builders/${data.id}`} className="w-full">
        <Button size="sm" className="w-full gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />
          View Profile
        </Button>
      </Link>
    </div>
  );
}

function HackathonCard({ data, onClose }: { data: MapHackathon; onClose: () => void }) {
  const dateStr = data.start_date
    ? `${new Date(data.start_date).toLocaleDateString()} – ${data.end_date ? new Date(data.end_date).toLocaleDateString() : "?"}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm leading-tight">{data.name}</p>
          {data.organizer && <p className="text-xs text-muted-foreground mt-0.5">{data.organizer}</p>}
          {data.location_city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />{data.location_city}, {data.location_country}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge className={
          data.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/25" :
          data.status === "upcoming" ? "bg-blue-500/15 text-blue-400 border-blue-500/25" :
          "bg-gray-500/15 text-gray-400 border-gray-500/25"
        }>
          {formatLabel(data.status)}
        </Badge>
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
        <Badge variant="outline">{formatLabel(data.modality)}</Badge>
      </div>

      {dateStr && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />{dateStr}
        </p>
      )}

      {data.prize_pool && (
        <p className="text-sm font-medium text-green-400">Prize: {data.prize_pool}</p>
      )}

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.tags.slice(0, 5).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}

      <Link href={`/hackathons/${data.id}`} className="w-full">
        <Button size="sm" className="w-full gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />
          View Hackathon
        </Button>
      </Link>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function MapView({ builders, hackathons, remoteHackathons = [], initialCenter }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerClickedRef = useRef(false);

  const [layer, setLayer] = useState<Layer>("both");
  const [cityFilter, setCityFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stackFilter, setStackFilter] = useState("all");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [selectedCard, setSelectedCard] = useState<CardState>(null);

  const filteredBuilders = useMemo(() => builders.filter((b) => {
    if (cityFilter && !b.location_city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (roleFilter !== "all" && !b.roles.includes(roleFilter)) return false;
    if (stackFilter !== "all" && !b.stack.includes(stackFilter)) return false;
    if (modalityFilter !== "all" && b.modality !== modalityFilter) return false;
    return true;
  }), [builders, cityFilter, roleFilter, stackFilter, modalityFilter]);

  const filteredHackathons = useMemo(() => hackathons.filter((h) => {
    if (cityFilter && !h.location_city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
    if (modalityFilter !== "all" && h.modality !== modalityFilter) return false;
    return true;
  }), [hackathons, cityFilter, categoryFilter, modalityFilter]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter ? [initialCenter.lng, initialCenter.lat] : [0, 20],
      zoom: initialCenter ? 9 : 2,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Browser geolocation — always try (more accurate than IP geo).
    // Fuzz within ~3km for privacy; if denied, we keep the IP-geo initial view.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      map.current.on("load", () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { lat, lng } = fuzzCoords(pos.coords.latitude, pos.coords.longitude);
            map.current?.flyTo({
              center: [lng, lat],
              zoom: 9,
              duration: 1200,
              essential: true,
            });
          },
          () => { /* denied or unavailable — keep initial view */ }
        );
      });
    }

    // Clear tooltip on map move; close card on map click (but not when a marker was clicked)
    map.current.on("movestart", () => setTooltip(null));
    map.current.on("click", () => {
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }
      setSelectedCard(null);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const addMarker = (
      lng: number,
      lat: number,
      color: string,
      itemType: "builder" | "hackathon",
      itemData: MapBuilder | MapHackathon,
      isHackathon = false
    ) => {
      const size = isHackathon ? "28px" : "20px";

      // Outer: Mapbox owns this transform for screen positioning
      const el = document.createElement("div");
      el.style.cssText = `width:${size};height:${size};cursor:pointer;`;

      // Inner: our animations live here
      const inner = document.createElement("div");
      inner.style.cssText = `
        width:100%;height:100%;
        background:${color};
        border-radius:${isHackathon ? "6px" : "50%"};
        border:2px solid rgba(255,255,255,0.8);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        transition:transform 0.15s ease,box-shadow 0.15s ease;
        transform-origin:center center;
      `;
      el.appendChild(inner);

      el.addEventListener("mouseenter", () => {
        inner.style.transform = "scale(1.35)";
        inner.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
        if (!map.current) return;
        const pt = map.current.project([lng, lat]);
        setTooltip({ x: pt.x, y: pt.y, type: itemType, data: itemData });
      });

      el.addEventListener("mouseleave", () => {
        inner.style.transform = "scale(1)";
        inner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
        setTooltip(null);
      });

      el.addEventListener("click", () => {
        markerClickedRef.current = true; // tell map click handler to skip
        if (!map.current) return;
        setSelectedCard({ type: itemType, data: itemData });
        const currentZoom = map.current.getZoom();
        if (currentZoom < ZOOM_THRESHOLD) {
          const targetZoom = Math.max(currentZoom + 2, ZOOM_THRESHOLD);
          map.current.flyTo({ center: [lng, lat], zoom: targetZoom, duration: 600, essential: true });
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    };

    if (layer === "builders" || layer === "both") {
      filteredBuilders.forEach((b) => {
        if (!b.location_lng || !b.location_lat) return;
        // Seeded by profile id → stable per-user offset, never reveals the true coord.
        const { lat, lng } = fuzzCoordsSeeded(b.location_lat, b.location_lng, b.id);
        addMarker(lng, lat, STATUS_COLORS[b.status] ?? "#6b7280", "builder", b);
      });
    }

    if (layer === "hackathons" || layer === "both") {
      filteredHackathons.forEach((h) => {
        if (!h.location_lng || !h.location_lat) return;
        addMarker(h.location_lng, h.location_lat, HACKATHON_COLORS[h.status] ?? "#3b82f6", "hackathon", h, true);
      });
    }
  }, [layer, filteredBuilders, filteredHackathons]);

  const clearFilters = useCallback(() => {
    setCityFilter(""); setRoleFilter("all"); setStackFilter("all");
    setModalityFilter("all"); setCategoryFilter("all");
  }, []);

  const FiltersContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">City</p>
        <Input placeholder="Filter by city..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="h-8 text-sm" />
      </div>
      {(layer === "builders" || layer === "both") && (
        <>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Role</p>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Stack</p>
            <Select value={stackFilter} onValueChange={(v) => setStackFilter(v ?? "all")}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stacks</SelectItem>
                {STACKS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {(layer === "hackathons" || layer === "both") && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Category</p>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {HACKATHON_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Modality</p>
        <Select value={modalityFilter} onValueChange={(v) => setModalityFilter(v ?? "all")}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="in-person">In-person</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Available</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Looking for team</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Hackathon (upcoming)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Hackathon (active)</div>
      </div>
    </div>
  );

  return (
    <div className="relative flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* Desktop filter sidebar */}
      <div className="hidden md:flex w-72 border-r border-border bg-background p-4 flex-col gap-4 overflow-y-auto">
        <FiltersContent />

        {remoteHackathons.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 pt-2 border-t">
              <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Remote ({remoteHackathons.length})
              </p>
            </div>
            {remoteHackathons.map((h) => (
              <a
                key={h.id}
                href={h.official_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors p-2.5 text-xs group"
              >
                <p className="font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {h.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {h.status === "active" && (
                    <span className="bg-green-500/15 text-green-400 border border-green-500/25 rounded-full px-1.5 py-0 text-[10px]">
                      Active
                    </span>
                  )}
                  {h.category && (
                    <span className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0 text-[10px]">
                      {h.category}
                    </span>
                  )}
                  {h.prize_pool && (
                    <span className="bg-green-500/10 text-green-400 rounded-full px-1.5 py-0 text-[10px]">
                      {h.prize_pool}
                    </span>
                  )}
                </div>
                {(h.start_date || h.end_date) && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {h.start_date ? new Date(h.start_date).toLocaleDateString("en", { month: "short", day: "numeric" }) : ""}
                    {h.end_date ? ` – ${new Date(h.end_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Hover tooltip — fully non-interactive so clicks pass through to markers below */}
        {tooltip && (
          <div
            className="absolute z-40 select-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 14px))",
              pointerEvents: "none",
            }}
          >
            <div
              className="bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl p-2.5 text-sm animate-in fade-in-0 zoom-in-95 duration-100"
              style={{ pointerEvents: "none" }}
            >
              {tooltip.type === "builder"
                ? <BuilderTooltip data={tooltip.data as MapBuilder} />
                : <HackathonTooltip data={tooltip.data as MapHackathon} />
              }
            </div>
            {/* Arrow */}
            <div
              className="w-2.5 h-2.5 bg-background border-r border-b border-border rotate-45 mx-auto -mt-1.5"
              style={{ pointerEvents: "none" }}
            />
          </div>
        )}

        {/* Floating detail card (click at max zoom) */}
        {selectedCard && (
          <div className="absolute bottom-4 right-4 z-50 w-72 animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
            <div className="bg-background/95 backdrop-blur border border-border rounded-xl shadow-2xl p-4">
              {selectedCard.type === "builder"
                ? <BuilderCard data={selectedCard.data as MapBuilder} onClose={() => setSelectedCard(null)} />
                : <HackathonCard data={selectedCard.data as MapHackathon} onClose={() => setSelectedCard(null)} />
              }
            </div>
          </div>
        )}

        {/* Layer toggle */}
        <div className="absolute top-4 left-4 flex gap-1 bg-background/90 backdrop-blur rounded-lg p-1 border border-border">
          {(["both", "builders", "hackathons"] as Layer[]).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={layer === l ? "default" : "ghost"}
              className="h-7 text-xs gap-1 capitalize"
              onClick={() => setLayer(l)}
            >
              {l === "builders" && <Users className="h-3 w-3" />}
              {l === "hackathons" && <Trophy className="h-3 w-3" />}
              {l === "both" && <Layers className="h-3 w-3" />}
              {l === "both" ? "Both" : l === "builders" ? `Builders (${filteredBuilders.length})` : `Hackathons (${filteredHackathons.length})`}
            </Button>
          ))}
        </div>

        {/* Mobile filter button */}
        <div className="absolute bottom-4 right-4 md:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-full h-12 w-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Filter className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <FiltersContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* No token warning */}
      </div>
    </div>
  );
}
