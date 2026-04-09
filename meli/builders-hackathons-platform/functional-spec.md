# Functional Spec: Builders & Hackathons Platform

## Problem
Builders lack a single platform to discover hackathons, find compatible teammates, and form teams. Information is scattered across directories, communities, and manual searches.

## Users
- Developers seeking hackathon teams
- Designers/product builders looking for teammates
- Indie builders wanting to connect with similar interests
- Technical founders seeking collaborators in their region

## Core Modules

### M1: Interactive Map (Home)
- Map showing builders (approximate location) and hackathons
- Toggle layers: builders only, hackathons only, both
- Filters: city, stack, role, modality, category, date
- Click markers to see preview cards

### M2: Builder Profile
- Name, avatar, bio, approximate location
- Stack, roles (backend, frontend, AI, design, product, growth)
- Preferred modality (remote/in-person/both)
- Status: available, looking for team, networking only
- External links: GitHub, X, LinkedIn, website
- Simple history: hackathons participated, wins, featured projects

### M3: Hackathon Page
- Name, organizer, dates, registration deadline
- Modality, location, category, tags
- Prize pool, official link, description, requirements
- List of interested builders
- LFG posts for this hackathon

### M4: LFG / Team-up
- Post types:
  - A) "Looking for team": builder offers skills, availability, language, modality
  - B) "Looking for members": team lists hackathon, what they're building, roles needed, timezone, level
- Filter by role, location, modality, language
- Status: open, in conversation, closed

### M5: Contact & External Handoff
- Contact button on profiles and LFG posts
- Links to X, LinkedIn, GitHub, Telegram, Discord, email
- "Express interest" action (no internal chat in MVP)

### M6: Explorer (List Views)
- Builder list with filters (city, stack, role, modality, status)
- Hackathon list with filters (date, modality, category, location, registration status)

### M7: Onboarding
- Login with Google or GitHub
- Quick profile setup: location, stack, roles, modality, links, status
- CTA: explore hackathons, appear on map, post LFG

### M8: Notifications (Basic)
- New hackathon matching interests/zone
- Team looking for compatible role
- Someone expressed interest
- Deadline approaching for saved hackathons
- Channels: in-app only (email out of MVP scope)

### M9: Saved Items
- Save hackathons, save builders
- Mark events as "interested"
- Simple dashboard: saved hackathons, saved builders, own posts

### M10: Admin Panel (Minimal)
- Create/edit/approve hackathons
- Moderate reported profiles
- Close stale LFG posts
- Feature events or posts manually

## User Flows

### Flow A: Builder seeking hackathon
1. Enter platform → 2. Filter hackathons → 3. Open hackathon → 4. See interested/teams → 5. Contact or post LFG

### Flow B: Builder seeking people
1. Open map/explorer → 2. Filter by city/stack/role → 3. Review profiles → 4. Save or contact → 5. Propose team

### Flow C: Team needs a role
1. Create LFG post → 2. Define hackathon + missing role → 3. Receive interest → 4. External conversation

## Out of Scope
- Social feed, internal chat, AI matching, mobile app, submissions, voting, judging
- Sponsors, hiring marketplace, gamification, complex analytics
- Push notifications, semantic search, advanced reputation

## Success Criteria
- Users complete profiles
- Users save hackathons
- LFG posts created
- Contacts initiated
- Teams formed
- Return visits from alerts/new events
