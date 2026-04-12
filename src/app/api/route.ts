import { NextResponse } from "next/server";

/** GET /api — API index / health check */
export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    endpoints: {
      builders: {
        list:   "GET  /api/builders?status=&modality=&role=&stack=&city=&country=&lat=&lng=&radius_km=&limit=&offset=",
        get:    "GET  /api/builders/:id",
      },
      hackathons: {
        list:   "GET  /api/hackathons?status=&modality=&category=&city=&country=&tag=&featured=&lat=&lng=&radius_km=&limit=&offset=",
        get:    "GET  /api/hackathons/:id",
      },
      lfg: {
        list:   "GET  /api/lfg?type=&status=&hackathon_id=&modality=&skill=&role_needed=&limit=&offset=",
        create: "POST /api/lfg  (auth required) { type, title, language, ...optional }",
      },
      cron: {
        scrape: "GET  /api/cron/scrape  (requires Authorization: Bearer $CRON_SECRET) — scrapes Devpost, MLH, Luma, Reddit, hackathones.com, Twitter/X",
      },
    },
  });
}
