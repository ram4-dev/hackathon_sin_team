# Spec: REST API

## Overview
API pública consumible por agentes externos, integraciones y la propia UI. Todos los endpoints son de solo lectura excepto `POST /api/lfg`.

## Endpoints

### Builders
```
GET /api/builders
  ?status=available|looking_for_team|networking
  ?modality=remote|in-person|both
  ?role=frontend|backend|...
  ?stack=react|python|...
  ?city=Buenos+Aires
  ?country=Argentina
  ?lat=&lng=&radius_km=   (proximidad geográfica)
  ?limit=20&offset=0

GET /api/builders/:id
```

### Hackathons
```
GET /api/hackathons
  ?status=upcoming|active|past
  ?modality=remote|in-person|hybrid
  ?category=AI|Fintech|...
  ?city=&country=
  ?tag=climate
  ?featured=true
  ?lat=&lng=&radius_km=
  ?limit=20&offset=0

GET /api/hackathons/:id
```

### LFG (Looking For Group)
```
GET /api/lfg
  ?type=looking_for_team|looking_for_members
  ?status=open|in_conversation|closed   (default: open)
  ?hackathon_id=
  ?modality=
  ?skill=react
  ?role_needed=designer
  ?limit=20&offset=0

POST /api/lfg   (requiere auth)
Body: {
  type,           // required
  title,          // required
  language,       // required
  hackathon_id?,
  description?,
  skills_offered?,
  roles_needed?,
  modality?,
  timezone?,
  level_expected?
}
```

### Cron / Admin
```
GET /api/cron/scrape
  Authorization: Bearer $CRON_SECRET
  → Corre todos los scrapers, geocodifica y upserta hackathons
```

### Debug (solo dev)
```
GET /api/debug/geo      → test IP geolocation
GET /api/debug/geocode  → test Nominatim + Supabase update pipeline
```

## Notas de implementación
- Todos los Route Handlers usan `createClient()` del server Supabase (respeta RLS)
- El cron usa `createServiceClient()` (bypassa RLS, requiere service role key)
- Respuestas paginadas: `{ data: [...], count: N, limit: N, offset: N }`
- Proximidad geográfica: filtro por bounding box (`location_lat BETWEEN` / `location_lng BETWEEN`)
- Autenticación LFG POST: `supabase.auth.getUser()` → 401 si no hay sesión
