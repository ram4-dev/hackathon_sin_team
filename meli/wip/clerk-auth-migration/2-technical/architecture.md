# Clerk Auth Migration - Architecture

## System Diagram (Mermaid)

```mermaid
graph TD
    Browser["Browser"]
    Proxy["proxy.ts\nclerkMiddleware()"]
    Clerk["Clerk\nOAuth + JWT Sessions"]
    Login["/login\n<SignIn> Component"]
    Layout["(main)/layout.tsx\ngetAuthUserId() + profile fetch"]
    Onboarding["/onboarding\n1-step form (username + location)"]
    Pages["Protected Pages\n/saved /lfg /profile /admin"]
    Auth["src/lib/auth.ts\ngetAuthUserId()"]
    ServerClient["supabase/server.ts\nservice-role, DB-only"]
    ClientHooks["Clerk Hooks\nuseAuth() useUser() useClerk()"]
    DB[("Supabase Postgres\nRLS disabled")]

    Browser -->|"request"| Proxy
    Proxy -->|"no JWT → redirect"| Login
    Proxy -->|"JWT valid → allow"| Layout
    Login -->|"OAuth flow"| Clerk
    Clerk -->|"JWT cookie set"| Proxy
    Layout --> Auth
    Auth -->|"auth().userId"| Clerk
    Layout --> ServerClient
    ServerClient --> DB
    Layout -->|"no username"| Onboarding
    Onboarding --> ServerClient
    Layout -->|"has username"| Pages
    Pages --> Auth
    Pages --> ServerClient
    Pages --> ClientHooks
    ClientHooks -->|"useAuth()"| Clerk
```

## Auth Flow Sequence (New User)

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as proxy.ts
    participant C as Clerk
    participant L as layout.tsx
    participant DB as Supabase DB

    B->>P: GET /saved (no JWT)
    P->>B: redirect /login
    B->>C: OAuth (GitHub/Google)
    C->>B: JWT cookie
    B->>P: GET /saved (with JWT)
    P->>L: allow (JWT valid)
    L->>C: auth().userId → "user_2abc"
    L->>DB: SELECT username WHERE id="user_2abc"
    DB-->>L: null (new user)
    L->>B: redirect /onboarding
    B->>L: POST /onboarding (form submit)
    L->>DB: INSERT profiles (id="user_2abc", username=...)
    L->>B: redirect /map
```

## Auth Layer: Before vs After

```
BEFORE (Supabase Auth):

  Browser
    │
    ▼
  proxy.ts ──► updateSession() ──► Supabase Auth (cookie refresh)
    │                                      │
    ▼                                      │ supabase.auth.getUser()
  Next.js Pages                            │
    ├── Server Components ─────────────────┘
    │     └── supabase.auth.getUser()
    │
    └── Client Components
          └── supabase.auth.getUser()
                      │
                      ▼
              Supabase DB (RLS via auth.uid())


AFTER (Clerk):

  Browser
    │
    ▼
  proxy.ts ──► clerkMiddleware() ──► Clerk (JWT validation, local)
    │
    ▼
  Next.js Pages
    ├── Server Components ──► auth() ──► Clerk
    │     └── getAuthUserId()      returns userId (string | null)
    │
    └── Client Components
          └── useAuth() / useUser() / useClerk()
                      │
                      ▼
              Supabase DB (service-role, RLS disabled)
```

## Request Flow (Protected Route)

```
  User Browser
      │  GET /saved (unauthenticated)
      ▼
  proxy.ts (clerkMiddleware)
      │  No valid JWT → protect() → redirect to /login
      ▼
  /login page
      │  <SignIn> component (GitHub / Google)
      ▼
  Clerk OAuth flow (external)
      │  Callback to Clerk's internal URL
      ▼
  proxy.ts (clerkMiddleware)
      │  JWT valid → allow request
      ▼
  (main)/layout.tsx
      │  getAuthUserId() → "user_2abc..."
      │  DB: SELECT username FROM profiles WHERE id = "user_2abc..."
      │  No username? → redirect /onboarding
      │  Has username? → render page with profile
      ▼
  /saved page renders
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App                          │
│                                                             │
│  src/proxy.ts                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ clerkMiddleware                                      │   │
│  │  Public: /login, /map, /builders, /hackathons, /api │   │
│  │  Protected: /saved, /lfg, /profile, /admin          │   │
│  │  Root (/): redirect → /map                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  src/app/layout.tsx                                         │
│  ┌─────────────────┐                                        │
│  │  <ClerkProvider> │                                       │
│  │    <html>        │                                       │
│  │      <body>      │                                       │
│  │        {children}│                                       │
│  │      </body>     │                                       │
│  │    </html>       │                                       │
│  └─────────────────┘                                        │
│                                                             │
│  src/lib/auth.ts                                            │
│  ┌─────────────────────────────────────────┐               │
│  │ getAuthUserId() → auth().userId         │               │
│  │ Used by all 7 server components/routes  │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  src/lib/supabase/server.ts  (DB-only, service-role)       │
│  src/lib/supabase/client.ts  (DB-only, anon key)           │
│  src/lib/supabase/service.ts (unchanged, admin/cron)       │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼──────┐      _______________
              │   Clerk    │     /               \
              │  (OAuth +  │     │  Supabase DB  │
              │  Sessions) │     │  (Postgres)   │
              └────────────┘     │  RLS disabled │
                                 \_______________/
```

## Auth State by Component Type

| Component Type | Auth Source | Pattern |
|---------------|------------|---------|
| Server Component | `@clerk/nextjs/server` | `const userId = await getAuthUserId()` |
| Server API Route | `@clerk/nextjs/server` | `const { userId } = await auth()` |
| Client Component | `@clerk/nextjs` | `const { userId } = useAuth()` |
| Client (user data) | `@clerk/nextjs` | `const { user } = useUser()` |
| Client (sign out) | `@clerk/nextjs` | `const { signOut } = useClerk()` |
