-- Migration: Clerk Auth Integration
-- Changes profile IDs from UUID (Supabase Auth) to TEXT (Clerk user IDs)
-- Disables RLS (authorization enforced at application layer)

-- Drop RLS policies that reference user ID columns (must happen before ALTER COLUMN)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Hackathons are viewable by everyone" ON hackathons;
DROP POLICY IF EXISTS "Admins can insert hackathons" ON hackathons;
DROP POLICY IF EXISTS "Admins can update hackathons" ON hackathons;
DROP POLICY IF EXISTS "LFG posts are viewable by everyone" ON lfg_posts;
DROP POLICY IF EXISTS "Authenticated users can create LFG posts" ON lfg_posts;
DROP POLICY IF EXISTS "Authors can update own LFG posts" ON lfg_posts;
DROP POLICY IF EXISTS "Authors can delete own LFG posts" ON lfg_posts;
DROP POLICY IF EXISTS "Users can view own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can save items" ON saved_items;
DROP POLICY IF EXISTS "Users can unsave items" ON saved_items;
DROP POLICY IF EXISTS "Interests are viewable by everyone" ON hackathon_interests;
DROP POLICY IF EXISTS "Users can express interest" ON hackathon_interests;
DROP POLICY IF EXISTS "Users can remove interest" ON hackathon_interests;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Drop FK constraints so columns can be retyped
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE hackathons DROP CONSTRAINT IF EXISTS hackathons_created_by_fkey;
ALTER TABLE saved_items DROP CONSTRAINT IF EXISTS saved_items_user_id_fkey;
ALTER TABLE hackathon_interests DROP CONSTRAINT IF EXISTS hackathon_interests_user_id_fkey;
ALTER TABLE lfg_posts DROP CONSTRAINT IF EXISTS lfg_posts_author_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Change ID columns from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE saved_items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE hackathon_interests ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE lfg_posts ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE hackathons ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Re-add FK constraints (now TEXT → TEXT)
ALTER TABLE saved_items ADD CONSTRAINT saved_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE hackathon_interests ADD CONSTRAINT hackathon_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE lfg_posts ADD CONSTRAINT lfg_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE hackathons ADD CONSTRAINT hackathons_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);

-- Drop auto-profile trigger (Clerk doesn't use auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Disable RLS on all tables (auth enforced at app layer via Clerk)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons DISABLE ROW LEVEL SECURITY;
