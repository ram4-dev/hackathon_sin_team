import { headers } from "next/headers";
import { getGeoLocation } from "@/lib/geoip";
import { NextResponse } from "next/server";

/** GET /api/debug/geo — test IP geolocation */
export async function GET() {
  const h = await headers();

  const rawHeaders = {
    "x-forwarded-for": h.get("x-forwarded-for"),
    "x-real-ip": h.get("x-real-ip"),
    "x-vercel-ip-latitude": h.get("x-vercel-ip-latitude"),
    "x-vercel-ip-longitude": h.get("x-vercel-ip-longitude"),
    "x-vercel-ip-city": h.get("x-vercel-ip-city"),
    "x-vercel-ip-country": h.get("x-vercel-ip-country"),
    "x-vercel-ip-country-region": h.get("x-vercel-ip-country-region"),
  };

  const geo = await getGeoLocation();

  return NextResponse.json({ geo, rawHeaders });
}
