# Clerk Auth Migration - Functional Spec

**Status**: approved
**Owner**: rcarnicer
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

---

<!-- overrides: meli/builders-hackathons-platform/technical-spec.md#authentication -->

## Problem Statement

**Problem**: BuilderMap currently uses Supabase Auth for OAuth login (GitHub + Google). The auth layer is tightly coupled to the Supabase client across ~15 files, with ad-hoc `supabase.auth.getUser()` calls in each component. Migrating to Clerk provides a dedicated auth solution with better DX, built-in UI components, and simpler session management via middleware, decoupling auth from the database layer.

---

## Objectives

1. Replace Supabase Auth with Clerk for all authentication flows (GitHub + Google OAuth)
2. Decouple auth from database — Supabase becomes DB-only
3. Simplify onboarding to a single-step form (username + location)
4. Protect routes via Clerk middleware instead of per-page auth checks

---

## Scope

### In Scope

- Clerk SDK installation and configuration (`@clerk/nextjs`)
- Login page replacement with Clerk's built-in `<SignIn>` component
- Middleware rewrite to use `clerkMiddleware` in `proxy.ts`
- ClerkProvider integration in root layout
- Simplified 1-step onboarding (username + location only)
- All server components migrated from `supabase.auth.getUser()` to Clerk `auth()`
- All client components migrated to Clerk hooks (`useAuth`, `useUser`, `useClerk`)
- Supabase clients refactored to DB-only (remove `@supabase/ssr`)
- Database schema migration: `profiles.id` UUID → TEXT for Clerk user IDs
- RLS disabled, authorization enforced at application layer
- Sign-out flow updated to use Clerk

### Out of Scope

- User data migration (no real users to migrate — hackathon project)
- Clerk+Supabase JWT integration for RLS (future enhancement if needed)
- Moving client-side DB mutations to Server Actions (follow-up improvement)
- Email/password auth (OAuth only, matching current behavior)
- Changes to admin role system (is_admin flag stays on profiles table)

---

## User Stories

### US-1: OAuth Login with Clerk

**As a** builder
**I want** to sign in with GitHub or Google via Clerk's UI
**So that** I can access protected features like LFG posts, saved items, and my profile

**Acceptance Criteria**:
- [ ] AC-1: `/login` renders Clerk's `<SignIn>` component with GitHub and Google providers
- [ ] AC-2: After successful OAuth, returning users are redirected to `/map`
- [ ] AC-3: After successful OAuth, new users (no profile) are redirected to `/onboarding`
- [ ] AC-4: Failed auth shows error within Clerk's UI

**Priority**: High
**Complexity**: M

---

### US-2: Simplified Onboarding

**As a** new user who just signed up
**I want** to quickly set up my profile with just a username and location
**So that** I can appear on the builder map and start exploring

**Acceptance Criteria**:
- [ ] AC-1: Onboarding shows a single form with: username (required), display name (pre-filled from Clerk), and location (with geolocation detection)
- [ ] AC-2: Username uniqueness is validated before submit
- [ ] AC-3: On submit, profile is created in Supabase with Clerk user ID as the primary key
- [ ] AC-4: Avatar URL is auto-populated from Clerk's user profile (OAuth provider avatar)
- [ ] AC-5: After onboarding, user is redirected to `/map`
- [ ] AC-6: Users who already have a profile skip onboarding entirely

**Priority**: High
**Complexity**: M

---

### US-3: Protected Routes via Middleware

**As a** builder
**I want** protected pages to require authentication automatically
**So that** unauthenticated users are redirected to login without page-level checks

**Acceptance Criteria**:
- [ ] AC-1: Public routes (`/map`, `/builders/*`, `/hackathons/*`, `/login`) are accessible without auth
- [ ] AC-2: Protected routes (`/saved`, `/lfg`, `/lfg/new`, `/profile`, `/admin/*`) require auth via middleware
- [ ] AC-3: Unauthenticated access to protected routes redirects to `/login`
- [ ] AC-4: Root path `/` redirects to `/map`
- [ ] AC-5: Admin routes additionally check `is_admin` flag on the profile

**Priority**: High
**Complexity**: S

---

### US-4: Sign Out

**As a** signed-in builder
**I want** to sign out from the navbar
**So that** I can securely end my session

**Acceptance Criteria**:
- [ ] AC-1: Clicking "Sign out" in the navbar ends the Clerk session
- [ ] AC-2: User is redirected to `/login` after sign out
- [ ] AC-3: Protected pages are no longer accessible after sign out

**Priority**: High
**Complexity**: S

---

### US-5: Auth State in Components

**As a** builder browsing the app
**I want** components to show personalized actions when I'm signed in
**So that** I can save builders, show interest in hackathons, and manage my LFG posts

**Acceptance Criteria**:
- [ ] AC-1: NavBar shows user profile info and sign-out when authenticated, login link when not
- [ ] AC-2: Builder/hackathon detail pages show save/interest buttons only for authenticated users
- [ ] AC-3: LFG creation requires auth (enforced by middleware)
- [ ] AC-4: Profile page loads and saves using the Clerk user ID
- [ ] AC-5: All existing builder, hackathon, and LFG functionality works identically after migration

**Priority**: High
**Complexity**: L

---

## Business Rules

### Core Rules

| Rule ID | Rule | Example |
|---------|------|---------|
| BR-1 | Clerk user ID is the primary key for profiles | `user_2abc123` stored as `profiles.id` (TEXT) |
| BR-2 | New user detection: user has Clerk session but no profile row | First login → redirect to onboarding |
| BR-3 | Admin access requires both auth AND `is_admin = true` on profile | Clerk auth alone is not sufficient for admin |
| BR-4 | All DB queries use service-role client (no RLS) | Authorization enforced at app layer |

---

## Data Model

### Profile ID Change

| Field | Before | After |
|-------|--------|-------|
| `profiles.id` | UUID (FK to `auth.users`) | TEXT (Clerk user ID, e.g., `user_2abc...`) |
| `saved_items.user_id` | UUID | TEXT |
| `hackathon_interests.user_id` | UUID | TEXT |
| `lfg_posts.author_id` | UUID | TEXT |
| `notifications.user_id` | UUID | TEXT |
| `hackathons.created_by` | UUID | TEXT |

### Removed

- `handle_new_user()` Postgres trigger (profile creation now happens in onboarding)
- FK constraint `profiles.id → auth.users(id)` (Clerk doesn't use Supabase auth)

---

## User Experience

### User Journey: New User

1. User visits any protected route → redirected to `/login`
2. Clerk `<SignIn>` component shows GitHub/Google options
3. User authenticates with provider
4. Clerk redirects back → middleware detects no profile → redirect to `/onboarding`
5. Onboarding form: username (required) + location (optional, with geolocation)
6. Submit → profile created → redirect to `/map`

### User Journey: Returning User

1. User visits any route → Clerk session already active (cookie)
2. Middleware validates session, allows access
3. User sees personalized content (navbar, save buttons, etc.)

### User Journey: Sign Out

1. User clicks "Sign out" in navbar
2. Clerk clears session → redirect to `/login`

---

## Non-Functional Requirements

### Security
- Authentication: Clerk OAuth (GitHub + Google)
- Authorization: App-layer checks using Clerk `auth()` / `useAuth()` + profile `is_admin`
- Session management: Clerk JWT cookies (httpOnly, secure)
- DB access: Service-role key server-side, anon key client-side (RLS disabled)

### Performance
- Clerk middleware JWT verification is local (no network call per request)
- No degradation expected vs current Supabase session refresh

---

## Critical E2E Test Scenarios

> LTP disabled for this feature (MVP project). Manual testing checklist:

### E2E-1: New User Login and Onboarding

**Priority**: Critical
**Related User Story**: US-1, US-2
**Steps**:
1. Visit `/saved` (protected route) while unauthenticated
2. Get redirected to `/login`
3. Sign in with GitHub via Clerk
4. Get redirected to `/onboarding` (no profile exists)
5. Fill username + location, submit
6. Get redirected to `/map` with profile created

**Expected Result**: Profile exists in DB with Clerk user ID, user sees the map

---

### E2E-2: Returning User Session

**Priority**: Critical
**Related User Story**: US-3, US-5
**Steps**:
1. Sign in (already has profile)
2. Visit `/map`, `/builders`, `/saved`, `/profile`
3. Verify personalized content (navbar, save buttons)
4. Sign out from navbar
5. Verify redirect to `/login` and protected routes blocked

**Expected Result**: Full session lifecycle works end-to-end

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| All auth flows working | 100% of E2E scenarios pass | Manual testing |
| No Supabase auth references | 0 remaining `supabase.auth.*` calls | Code grep |
| Build passes | Zero TypeScript errors | `npm run build` |
| Feature parity | All existing features work identically | Manual smoke test |

---

## Dependencies

- **Clerk**: External SaaS — requires account setup, API keys, GitHub/Google OAuth configured in Clerk dashboard
- **Supabase**: Continues as database — schema migration required (UUID → TEXT)
- **@clerk/nextjs**: NPM package for Next.js App Router integration

---

## Risks

| Risk ID | Description | Impact | Probability | Mitigation |
|---------|-------------|--------|-------------|------------|
| RISK-1 | Clerk's `clerkMiddleware` may not work with Next.js 16 `proxy.ts` export convention | High | Medium | Wrap in adapter function; test early |
| RISK-2 | Disabling RLS exposes DB to client-side mutations with anon key | Medium | Low | Acceptable for MVP; move mutations to Server Actions later |
| RISK-3 | Clerk's `<SignIn>` component styling may not match dark theme | Low | Medium | Use Clerk's `appearance` prop to customize theme |

---

## Assumptions

1. No real users exist that need to be migrated from Supabase Auth to Clerk
2. Clerk free tier is sufficient for this hackathon project
3. GitHub and Google OAuth can be configured in Clerk dashboard before implementation
4. `@clerk/nextjs` supports Next.js 16 App Router with `proxy.ts` convention
