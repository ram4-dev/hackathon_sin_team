"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = {
  scanned: number;
  geocoded: number;
  failed: number;
};

export function GeocodeMissingButton() {
  const { userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!userId) return null;

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResult(null);

    // Loop until there's nothing left to geocode (or an error/no progress).
    let totals: Result = { scanned: 0, geocoded: 0, failed: 0 };
    try {
      while (true) {
        const res = await fetch("/api/hackathons/geocode-missing", {
          method: "POST",
        });
        const data = (await res.json()) as Partial<Result> & { error?: string };

        if (!res.ok) {
          setError(data.error ?? "Failed to geocode");
          break;
        }

        totals = {
          scanned: totals.scanned + (data.scanned ?? 0),
          geocoded: totals.geocoded + (data.geocoded ?? 0),
          failed: totals.failed + (data.failed ?? 0),
        };

        // Stop when a batch did no work or made no progress.
        if (!data.scanned || data.geocoded === 0) break;
      }

      setResult(totals);
      if (totals.geocoded > 0) router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        title="Geocode hackathons that have a city but no coordinates so they appear on the map"
      >
        {loading ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-1.5 h-4 w-4" />
        )}
        {loading ? "Geocoding…" : "Fix map locations"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">
          {result.geocoded} added
          {result.failed > 0 ? `, ${result.failed} failed` : ""}
        </span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
