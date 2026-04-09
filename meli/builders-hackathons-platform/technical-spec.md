# Technical Spec: Builders & Hackathons Platform

## Architecture

```
Next.js 16 App Router (Vercel deploy)
├── Server Components (default) — data fetching, SEO
├── Client Components — map, filters, interactive UI
├── Route Handlers — API endpoints
└── Server Actions — mutations

Supabase
├── Auth (Google + GitHub OAuth)
├── PostgreSQL (data + RLS)
├── Realtime (optional: live notifications)
└── Storage (avatars, hackathon images)

Mapbox GL JS — interactive map
shadcn/ui — component library
Tailwind CSS v4 — styling
```

## Database Schema

### profiles
```sql
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
```

### hackathons
```sql
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
```

### lfg_posts
```sql
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
```

### saved_items
```sql
CREATE TABLE saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT CHECK (item_type IN ('hackathon', 'builder')) NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);
```

### hackathon_interests
```sql
CREATE TABLE hackathon_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hackathon_id)
);
```

### notifications
```sql
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
```

## RLS Policies
- profiles: read by all, update by owner
- hackathons: read by all, create/update by admins
- lfg_posts: read by all, create by authenticated, update/delete by author
- saved_items: CRUD by owner only
- hackathon_interests: read by all, create/delete by owner
- notifications: read/update by owner only

## Route Structure

```
src/app/
├── layout.tsx                    — Root layout + providers
├── page.tsx                      — Landing/redirect
├── (auth)/
│   ├── login/page.tsx            — Login with Google/GitHub
│   └── onboarding/page.tsx       — Profile setup wizard
├── (main)/
│   ├── layout.tsx                — App shell (nav, sidebar)
│   ├── map/page.tsx              — Interactive map (home)
│   ├── builders/
│   │   ├── page.tsx              — Builder explorer list
│   │   └── [id]/page.tsx         — Builder profile
│   ├── hackathons/
│   │   ├── page.tsx              — Hackathon explorer list
│   │   └── [id]/page.tsx         — Hackathon detail
│   ├── lfg/
│   │   ├── page.tsx              — LFG listings
│   │   └── new/page.tsx          — Create LFG post
│   ├── saved/page.tsx            — Saved items dashboard
│   ├── profile/page.tsx          — Edit own profile
│   └── admin/
│       ├── page.tsx              — Admin dashboard
│       └── hackathons/page.tsx   — Manage hackathons
└── api/
    └── auth/callback/route.ts    — Supabase OAuth callback
```

## Auth Flow
1. User clicks "Login with Google/GitHub"
2. Supabase Auth redirects to provider
3. Callback at `/api/auth/callback` exchanges code for session
4. If new user → redirect to `/onboarding`
5. If existing user → redirect to `/map`
6. Middleware protects authenticated routes

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Key Technical Decisions
- Server Components by default, Client Components only for interactivity (map, filters, forms)
- Supabase RLS for authorization (no custom middleware needed)
- Mapbox GL JS for map (free tier: 50k loads/month)
- shadcn/ui for consistent, accessible UI
- No internal chat — external handoff only
- Image storage via Supabase Storage
- Approximate locations only (city-level, not exact)
