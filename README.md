# BuilderMap

**Find hackathons, connect with builders, form teams.**

A discovery platform for builders who want to participate in hackathons, find compatible teammates, and form teams quickly.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + OAuth)
- **Map**: Mapbox GL JS
- **UI**: shadcn/ui + Tailwind CSS v4
- **Deployment**: Vercel

## Setup

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Authentication > Providers** and enable:
   - Google (add Client ID + Secret from Google Cloud Console)
   - GitHub (add Client ID + Secret from GitHub OAuth Apps)
3. Set the redirect URL to: `http://localhost:3000/api/auth/callback`

### 3. Run database migrations

In the Supabase dashboard, go to **SQL Editor** and run the contents of:
`supabase/migrations/001_initial.sql`

### 4. (Optional) Load seed data

Run `supabase/seed.sql` in the SQL Editor to populate 10 sample hackathons.

### 5. Get a Mapbox token

1. Create account at [mapbox.com](https://mapbox.com)
2. Create a new access token (public token, free tier: 50k loads/month)

### 6. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ii...
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

| Module | Route | Description |
|--------|-------|-------------|
| Map | `/map` | Interactive map with builders + hackathons |
| Builders | `/builders` | Explorer list with filters |
| Builder Profile | `/builders/[id]` | Public profile page |
| Hackathons | `/hackathons` | Hackathon list with filters |
| Hackathon Detail | `/hackathons/[id]` | Full info + interested builders + LFG posts |
| LFG | `/lfg` | Looking-for-group listings |
| Create LFG | `/lfg/new` | Create a team post |
| Saved | `/saved` | Saved hackathons, builders, own posts |
| Profile | `/profile` | Edit your profile |
| Admin | `/admin` | Admin dashboard (admin users only) |

## Auth Flow

1. User visits `/login` → clicks "Continue with GitHub/Google"
2. Supabase OAuth → redirects to `/api/auth/callback`
3. New user → `/onboarding` (4-step wizard)
4. Existing user → `/map`

## Database Schema

6 tables: `profiles`, `hackathons`, `lfg_posts`, `saved_items`, `hackathon_interests`, `notifications`

Full schema in `supabase/migrations/001_initial.sql`

## Deployment to Vercel

```bash
npm i -g vercel
vercel
```

Set these env vars in Vercel dashboard or CLI:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

After deploying, add your Vercel domain to Supabase Auth redirect URLs.
