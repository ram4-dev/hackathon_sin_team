"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: user?.fullName ?? "",
    location_city: "",
    location_country: "",
    location_lat: null as number | null,
    location_lng: null as number | null,
  });

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setForm((f) => ({
            ...f,
            location_city: data.address?.city || data.address?.town || "",
            location_country: data.address?.country || "",
            location_lat: latitude,
            location_lng: longitude,
          }));
        } catch {
          setForm((f) => ({ ...f, location_lat: latitude, location_lng: longitude }));
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: form.username,
      full_name: form.full_name || user.fullName || null,
      avatar_url: user.imageUrl || null,
      location_city: form.location_city || null,
      location_country: form.location_country || null,
      location_lat: form.location_lat,
      location_lng: form.location_lng,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving profile:", error);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/map");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to BuilderMap</CardTitle>
            <CardDescription>Set up your profile to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="yourhandle"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Display Name</Label>
              <Input
                id="full_name"
                placeholder="Your Name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {locating ? "Detecting..." : "Detect my location"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Buenos Aires"
                    value={form.location_city}
                    onChange={(e) => setForm((f) => ({ ...f, location_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Argentina"
                    value={form.location_country}
                    onChange={(e) => setForm((f) => ({ ...f, location_country: e.target.value }))}
                  />
                </div>
              </div>
              {form.location_lat && (
                <p className="text-xs text-muted-foreground">
                  Coordinates saved: {form.location_lat.toFixed(2)}, {form.location_lng?.toFixed(2)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} className="w-full" disabled={loading || !form.username || !isLoaded}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Saving..." : "Get Started"}
        </Button>
      </div>
    </div>
  );
}
