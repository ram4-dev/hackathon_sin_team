export interface ScrapedHackathon {
  /** Used as dedup key — must be stable */
  source: string;
  source_id: string;

  name: string;
  organizer?: string;
  description?: string;
  start_date?: string;       // ISO "YYYY-MM-DD"
  end_date?: string;
  registration_deadline?: string;
  modality: "remote" | "in-person" | "hybrid";
  location_city?: string;
  location_country?: string;
  category?: string;
  tags: string[];
  prize_pool?: string;
  official_url: string;
  image_url?: string;
  status: "upcoming" | "active" | "past";
}
