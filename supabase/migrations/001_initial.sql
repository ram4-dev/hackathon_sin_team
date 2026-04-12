-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location_city TEXT,
  location_country TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  stack TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',
  modality TEXT CHECK (modality IN ('remote', 'in-person', 'both')) DEFAULT 'both',
  status TEXT CHECK (status IN ('available', 'looking_for_team', 'networking')) DEFAULT 'available',
  github_url TEXT,
  x_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  telegram_url TEXT,
  discord_url TEXT,
  email_contact TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Hackathons
CREATE TABLE hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organizer TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  registration_deadline DATE,
  modality TEXT CHECK (modality IN ('remote', 'in-person', 'hybrid')) DEFAULT 'remote',
  location_city TEXT,
  location_country TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  prize_pool TEXT,
  official_url TEXT,
  requirements TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('upcoming', 'active', 'past')) DEFAULT 'upcoming',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LFG Posts
CREATE TABLE lfg_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('looking_for_team', 'looking_for_members')) NOT NULL,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skills_offered TEXT[] DEFAULT '{}',
  roles_needed TEXT[] DEFAULT '{}',
  modality TEXT CHECK (modality IN ('remote', 'in-person', 'both')),
  timezone TEXT,
  language TEXT DEFAULT 'en',
  level_expected TEXT,
  status TEXT CHECK (status IN ('open', 'in_conversation', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Items
CREATE TABLE saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT CHECK (item_type IN ('hackathon', 'builder')) NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Hackathon Interests
CREATE TABLE hackathon_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hackathon_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('new_hackathon', 'team_match', 'interest', 'deadline')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_location ON profiles(location_lat, location_lng) WHERE location_lat IS NOT NULL;
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_roles ON profiles USING GIN(roles);
CREATE INDEX idx_profiles_stack ON profiles USING GIN(stack);
CREATE INDEX idx_hackathons_status ON hackathons(status);
CREATE INDEX idx_hackathons_dates ON hackathons(start_date, end_date);
CREATE INDEX idx_hackathons_location ON hackathons(location_lat, location_lng) WHERE location_lat IS NOT NULL;
CREATE INDEX idx_lfg_posts_status ON lfg_posts(status);
CREATE INDEX idx_lfg_posts_hackathon ON lfg_posts(hackathon_id);
CREATE INDEX idx_lfg_posts_author ON lfg_posts(author_id);
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: readable by all, writable by owner
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Hackathons: readable by all, writable by admins
CREATE POLICY "Hackathons are viewable by everyone" ON hackathons FOR SELECT USING (true);
CREATE POLICY "Admins can insert hackathons" ON hackathons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update hackathons" ON hackathons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- LFG Posts: readable by all, writable by author
CREATE POLICY "LFG posts are viewable by everyone" ON lfg_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create LFG posts" ON lfg_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own LFG posts" ON lfg_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own LFG posts" ON lfg_posts FOR DELETE USING (auth.uid() = author_id);

-- Saved Items: owner only
CREATE POLICY "Users can view own saved items" ON saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save items" ON saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave items" ON saved_items FOR DELETE USING (auth.uid() = user_id);

-- Hackathon Interests: readable by all, writable by owner
CREATE POLICY "Interests are viewable by everyone" ON hackathon_interests FOR SELECT USING (true);
CREATE POLICY "Users can express interest" ON hackathon_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove interest" ON hackathon_interests FOR DELETE USING (auth.uid() = user_id);

-- Notifications: owner only
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
