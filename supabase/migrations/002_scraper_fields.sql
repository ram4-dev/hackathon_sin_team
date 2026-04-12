-- Add scraper metadata to hackathons for deduplication
ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Full unique constraint (required for Supabase upsert onConflict)
ALTER TABLE hackathons
  ADD CONSTRAINT hackathons_source_source_id_key
  UNIQUE (source, source_id);
