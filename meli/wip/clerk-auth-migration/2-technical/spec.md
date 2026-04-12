# Clerk Auth Migration - Technical Spec

**Status**: approved
**Owner**: rcarnicer
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Based on**: `../1-functional/spec.md`

---

<!-- overrides: meli/builders-hackathons-platform/technical-spec.md#authentication -->

## Executive Summary

Replace Supabase Auth with Clerk in a Next.js 16 (App Router) brownfield project. Supabase is retained as the Postgres database. The migration affects ~15 files across the auth layer: middleware, login page, onboarding, server components, and client components. No new infrastructure is needed — only dependency changes, schema alteration, and code refactoring.

**Stack**: Next.js 16 (App Router, `proxy.ts` convention) + Clerk (`@clerk/nextjs`) + Supabase (DB-only, `@supabase/supabase-js`)

---

## Architecture Overview

```
BEFORE:
  Browser → [proxy.ts] → Next.js App
                │ updateSession()
                ▼
          Supabase Auth (cookie session)
                │ supabase.auth.getUser()
                ▼
          Supabase DB (profiles, lfg_posts, etc.)

AFTER:
  Browser → [proxy.ts] → Next.js App
                │ clerkMiddleware()
                ▼
          Clerk (JWT session, OAuth)
                │
          auth() / useAuth() / useUser()
                │
                ▼
          Supabase DB (service-role client, no RLS)
```

```
┌──────────────────────────────────────────┐
│            Next.js 16 App                │
│                                          │
│  proxy.ts (clerkMiddleware)              │
│     ├── Public: /map, /builders,         │
│     │          /hackathons, /login       │
│     └── Protected: /saved, /lfg,         │
│                    /profile, /admin      │
│                                          │
│  Root Layout                             │
│     └── <ClerkProvider>                  │
│            └── App pages                 │
│                                          │
│  Auth helpers (src/lib/auth.ts)          │
│     └── getAuthUserId() → Clerk auth()   │
│                                          │
│  Supabase clients (DB-only)              │
│     ├── server.ts → service-role key     │
│     └── client.ts → anon key            │
└──────────────┬───────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │  Supabase DB  │
       │  (Postgres)   │
       │  RLS disabled │
       └───────────────┘
```

---

## Design Decisions

### DD-1: Authorization Strategy
**Selected**: App-layer enforcement (disable RLS, use Clerk auth in every server component/API route)
**Alternatives Considered**: Clerk+Supabase JWT integration (preserves RLS)
**Rationale**: MVP project, current codebase already does per-page auth checks, no public mutations possible without custom code

### DD-2: Login UI
**Selected**: Clerk's `<SignIn>` component
**Alternatives Considered**: Custom UI with `useSignIn()` hook
**Rationale**: Faster implementation, built-in accessibility, supports dark theme via `appearance` prop

### DD-3: Profile Primary Key
**Selected**: ALTER `profiles.id` UUID → TEXT (Clerk user IDs: `user_xxx`)
**Alternatives Considered**: Add `clerk_id` column alongside UUID PK
**Rationale**: No real users to migrate, cleaner schema, no dual-ID complexity

### DD-4: Onboarding Detection
**Selected**: Detect in `(main)/layout.tsx` — redirect to `/onboarding` if profile has no username
**Alternatives Considered**: Middleware-level detection (DB call on every request)
**Rationale**: Matches current pattern, avoids DB calls in the hot middleware path

---

## Data Model

### Database Schema Migration

SQL migration to run against Supabase (one-time):

```sql
-- 1. Drop FK constraint to auth.users (Clerk doesn't use this table)
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- 2. Change PK and all FK columns from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE saved_items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE hackathon_interests ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE lfg_posts ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE hackathons ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- 3. Remove Supabase auth trigger (profile creation now via onboarding)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 4. Disable RLS (authorization enforced at app layer)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons DISABLE ROW LEVEL SECURITY;
```

**TypeScript impact**: `Profile.id` is already `string` — no type changes needed.

---

## Dependencies

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@clerk/nextjs` | latest | Clerk SDK for Next.js App Router |

### Removed Dependencies

| Package | Reason |
|---------|--------|
| `@supabase/ssr` | Only used for auth session management, not needed after migration |

### Kept Dependencies

| Package | Reason |
|---------|--------|
| `@supabase/supabase-js` | DB queries (profiles, lfg_posts, etc.) |

---

## Environment Variables

### New Variables (add to `.env.local`)

| Variable | Value Source | Purpose |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard | Client-side SDK init |
| `CLERK_SECRET_KEY` | Clerk dashboard | Server-side SDK init |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` | Redirect config |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/map` | Post-login redirect |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` | Post-signup redirect |

### Removed Variables

| Variable | Reason |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Can be removed from client if all client mutations move to server; keep for now |

### Kept Variables

| Variable | Reason |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | DB connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes (bypasses RLS) |

---

## File Changes

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | `getAuthUserId()` helper wrapping Clerk `auth()` |

### Files to Rewrite

| File | Change |
|------|--------|
| `src/proxy.ts` | Replace `updateSession` with `clerkMiddleware` |
| `src/app/layout.tsx` | Add `<ClerkProvider>` wrapper |
| `src/app/(auth)/login/page.tsx` | Replace custom buttons with `<SignIn>` |
| `src/app/(auth)/onboarding/page.tsx` | Simplify to 1 step (username + location), use `useUser()` |
| `src/lib/supabase/server.ts` | Remove `@supabase/ssr`, use plain `createClient` with service-role key |
| `src/lib/supabase/client.ts` | Remove `@supabase/ssr`, use plain `createClient` with anon key |
| `src/lib/supabase/proxy.ts` | **Delete** — session refresh logic no longer needed |
| `src/app/api/auth/callback/route.ts` | **Delete** — Clerk handles OAuth callbacks internally |

### Files to Update (auth pattern swap)

**Server components** — replace `supabase.auth.getUser()` with `getAuthUserId()`:

| File | Change |
|------|--------|
| `src/app/page.tsx` | Auth check + redirect |
| `src/app/(main)/layout.tsx` | Auth call + profile/notification fetch |
| `src/app/(main)/saved/page.tsx` | Auth guard |
| `src/app/(main)/lfg/page.tsx` | Auth guard |
| `src/app/(main)/admin/page.tsx` | Auth guard + is_admin check |
| `src/app/(main)/admin/hackathons/page.tsx` | Auth guard + is_admin check |
| `src/app/api/lfg/route.ts` | POST auth check |

**Client components** — replace `supabase.auth.getUser()` with Clerk hooks:

| File | Hook | Change |
|------|------|--------|
| `src/components/nav-bar.tsx` | `useClerk()` | Replace `signOut()` call |
| `src/app/(main)/profile/page.tsx` | `useUser()` | Replace auth calls |
| `src/app/(main)/lfg/new/page.tsx` | `useAuth()` | Replace `user.id` fetch |
| `src/components/hackathons/hackathon-actions.tsx` | `useAuth()` | Replace 3 auth calls |
| `src/components/builders/builder-actions.tsx` | `useAuth()` | Replace 2 auth calls |

---

## Implementation Details

### 1. `src/proxy.ts` — Clerk Middleware

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/map(.*)',
  '/builders(.*)',
  '/hackathons(.*)',
  '/api/builders(.*)',
  '/api/hackathons(.*)',
  '/api/cron/(.*)',
  '/api$',
])

export const proxy = clerkMiddleware(async (auth, request) => {
  // Redirect root to /map
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/map', request.url))
  }
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

> **Risk**: Clerk's `clerkMiddleware` returns a handler function. Assigning to `proxy` (instead of the standard `middleware`) is the Next.js 16 convention. If Clerk checks function name internally, wrap: `export async function proxy(req, evt) { return clerkMiddleware(...)(req, evt) }`.

### 2. `src/lib/supabase/server.ts` — DB-Only Server Client

```typescript
import { createClient } from '@supabase/supabase-js'

// Service-role client for server-side operations (bypasses RLS)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

### 3. `src/lib/supabase/client.ts` — DB-Only Browser Client

```typescript
import { createClient } from '@supabase/supabase-js'

export function createClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 4. `src/lib/auth.ts` — Auth Helper

```typescript
import { auth } from '@clerk/nextjs/server'

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
```

### 5. `src/app/layout.tsx` — ClerkProvider

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <TooltipProvider>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 6. `src/app/(auth)/login/page.tsx` — Clerk SignIn

```typescript
import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        appearance={{
          variables: { colorBackground: '#09090b', colorText: '#fafafa' },
        }}
        routing="hash"
      />
    </div>
  )
}
```

### 7. `src/app/(auth)/onboarding/page.tsx` — Simplified 1-Step

```typescript
"use client"
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
// Form: username (required) + location (optional with geolocation)
// On submit: upsert profiles row with id = user.id (Clerk ID)
// Avatar: user.imageUrl, full_name: user.fullName
```

### 8. Server component pattern (all 7 files)

```typescript
// BEFORE
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

// AFTER
import { getAuthUserId } from '@/lib/auth'
const userId = await getAuthUserId()
if (!userId) redirect('/login')
const supabase = createServerClient() // DB-only, no await
```

### 9. Client component pattern (all 5 files)

```typescript
// BEFORE
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// AFTER
import { useAuth } from '@clerk/nextjs'
const { userId } = useAuth()
// Use userId directly (string | null)

// Sign out (nav-bar.tsx)
import { useClerk } from '@clerk/nextjs'
const { signOut } = useClerk()
signOut({ redirectUrl: '/login' })
```

---

## Onboarding Flow (Simplified)

**New user detection** — in `src/app/(main)/layout.tsx`:

```typescript
const userId = await getAuthUserId()
const supabase = createServerClient()
const { data: profile } = userId
  ? await supabase.from('profiles').select('username').eq('id', userId).single()
  : { data: null }

// Redirect new users to onboarding
if (userId && (!profile || !profile.username)) {
  const pathname = headers().get('x-pathname') || ''
  if (!pathname.startsWith('/onboarding')) {
    redirect('/onboarding')
  }
}
```

**Onboarding form fields** (1 step):
- `username` (required, unique check via Supabase)
- `location_city` + `location_country` (optional, geolocation detection)
- `full_name` (pre-filled from `user.fullName`)
- `avatar_url` (auto-set from `user.imageUrl`)

---

## Security

### Authentication
- Provider: Clerk (OAuth 2.0 — GitHub + Google)
- Session: Clerk JWT cookies (httpOnly, secure)
- Server validation: `auth()` from `@clerk/nextjs/server` — validates JWT locally (no network call)

### Authorization
- App-layer enforcement: every server component and API route calls `getAuthUserId()`
- Admin routes: additionally check `profile.is_admin === true`
- DB access: service-role key server-side (bypasses RLS); anon key client-side (RLS disabled)

### Secrets Management
- `CLERK_SECRET_KEY`: server-only (no `NEXT_PUBLIC_` prefix) — never exposed to browser
- `SUPABASE_SERVICE_ROLE_KEY`: server-only — never exposed to browser
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: safe for client (designed to be public)

---

## Testing Strategy

### Unit Tests
- `src/lib/auth.ts` — `getAuthUserId()` returns `null` when no session, returns string when authenticated
- `src/lib/supabase/server.ts` — client creates correctly with service-role key
- `src/lib/supabase/client.ts` — client creates correctly with anon key

### Integration Tests
- `src/proxy.ts` middleware — public routes pass through, protected routes redirect unauthenticated users to `/login`
- `POST /api/lfg` — returns 401 without auth, accepts with valid Clerk session

### E2E Tests
> LTP disabled for MVP. Manual smoke tests serve as E2E validation.

### Manual Smoke Tests (post-implementation)

1. `npm run build` — zero TypeScript/lint errors
2. Sign in with GitHub → new user → onboarding → `/map`
3. Sign in with Google → returning user → `/map`
4. Access `/saved` without auth → redirect to `/login`
5. Access `/admin` as non-admin → redirect to `/map`
6. Sign out → session cleared → protected routes blocked
7. Save a builder, show interest in hackathon, create LFG post
8. Edit profile at `/profile`

### Code Verification

```bash
# Ensure no remaining Supabase auth calls
grep -r "supabase\.auth\." app/src --include="*.ts" --include="*.tsx"
# Should return 0 results after migration
```

---

## Fury Platform Compliance

> Not applicable — this is a Next.js/Vercel project, not a Fury platform service.

| Requirement | Status | Notes |
|-------------|--------|-------|
| Dockerfile | N/A | Deployed via Vercel, no Docker required |
| Dockerfile.runtime (hub.furycloud.io/mercadolibre/distroless-*) | N/A | Vercel deployment, not Fury platform |
| /ping health check endpoint (returns "pong") | N/A | Vercel handles health checks natively |
| Technology stack | Next.js 16 + TypeScript + Clerk + Supabase Postgres | |

---

## REST API Contracts

No new API endpoints are added by this migration. The existing API routes are updated internally:

| Route | Change |
|-------|--------|
| `POST /api/lfg` | Auth check: `supabase.auth.getUser()` → `auth()` from Clerk |
| `DELETE /api/auth/callback` | Route removed — Clerk handles OAuth callbacks at its own URL |

All other API routes (`/api/builders`, `/api/hackathons`, `/api/cron/scrape`) require no auth changes.

---

## Performance

- Clerk middleware validates JWT locally (no network call per request) — equivalent latency to current Supabase session refresh
- Target: middleware overhead < 5ms (baseline with Supabase: ~10ms for cookie parsing)
- No new DB queries added — profile fetch for new-user detection already exists in `(main)/layout.tsx`

---

## Deployment Strategy

1. Create Clerk app at clerk.com — enable GitHub + Google OAuth
2. Run SQL migration against Supabase
3. Add Clerk env vars to Vercel (`vercel env add`)
4. Deploy — Clerk middleware activates automatically
5. Run smoke tests

**Rollback**: Revert to Supabase Auth by reverting `proxy.ts`, `layout.tsx`, auth helpers, and re-enabling RLS. Schema change (UUID→TEXT) is the only non-reversible step without data loss.

---

## Deployment

1. Create Clerk app at clerk.com — enable GitHub + Google OAuth
2. Run SQL migration against Supabase
3. Add Clerk env vars to Vercel (`vercel env add`)
4. Deploy — Clerk middleware activates automatically
5. Run smoke tests

**Rollback**: Revert to Supabase Auth by reverting `proxy.ts`, `layout.tsx`, auth helpers, and re-enabling RLS. Schema change (UUID→TEXT) is the only non-reversible step without data loss.
