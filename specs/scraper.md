# Spec: Hackathon Scraper Pipeline

## Overview
Sistema de scraping que recolecta hackathons de múltiples fuentes, los geocodifica y los upserta en Supabase. Corre diariamente vía Vercel Cron y también es callable manualmente.

## Endpoint
```
GET /api/cron/scrape
Authorization: Bearer $CRON_SECRET   (requerido si CRON_SECRET está seteado)
```
Respuesta:
```json
{
  "ok": true,
  "elapsed_ms": 72000,
  "total": { "fetched": 85, "upserted": 85, "errors": 0 },
  "results": [{ "source": "mlh", "fetched": 47, "upserted": 47, "errors": 0 }]
}
```

## Fuentes

| Fuente | Método | Resultados típicos |
|--------|--------|-------------------|
| **Devpost** | JSON API — `GET /api/hackathons?status=open` (5 páginas) | ~50-250 |
| **MLH** | Inertia.js `data-page` JSON en `www.mlh.com/seasons/{year}/events` | ~47/temporada |
| **Luma** | `__NEXT_DATA__` en `luma.com/discover` — path: `initialData.featured_place.events` | ~5-30 |
| **Reddit** | JSON API pública — solo r/hackathon y r/hackathons, filtro semántico | ~5-20 |
| **Twitter/X** | API v2 (requiere `X_BEARER_TOKEN`) | 0 si no hay token |

### Reddit — filtro semántico
Solo se mantienen posts que:
- Tienen URL externa (link post a plataforma de hackathon), **o**
- Contienen señales de evento: `register`, `deadline`, `prize`, `devpost`, fechas ISO, etc.

Se descartan posts con señales de discusión: `survived`, `tips`, `advice`, `experience`, etc.

## Flujo de ejecución
```
1. Todos los scrapers corren en PARALELO (Promise.allSettled)
2. Por cada scraper, upsertBatch() corre secuencialmente:
   a. FASE 1: upsert todos los items SIN coords (datos guardados inmediatamente)
   b. FASE 2: geocodificar items con city/country
              - Cache en memoria por key "city,country" (evita duplicados)
              - 1.1s delay entre calls (Nominatim rate limit)
              - update() individual por item geocodificado
```

## Geocodificación
- **API**: Nominatim (OpenStreetMap) — gratuita, sin key
- **User-Agent**: `"Mozilla/5.0 HackathonMap/1.0"` (requerido; no usar UAs con email — Nominatim los banea)
- **Cache Next.js**: usar `cache: "no-store"` (no usar `next: { revalidate }` — cachea respuestas fallidas en disco)
- **Fallback**: si Nominatim retorna null, el hackathon se guarda sin coords (no aparece en el mapa pero sí en el sidebar de remotos)

## Deduplicación
Unique constraint: `UNIQUE (source, source_id)` en tabla `hackathons`. El upsert con `onConflict: "source,source_id"` actualiza registros existentes.

## Variables de entorno
| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypassa RLS para inserts | Sí |
| `CRON_SECRET` | Protege el endpoint | Recomendada en prod |
| `X_BEARER_TOKEN` | Twitter/X API v2 | No |

## Archivos
```
src/lib/scrapers/
├── types.ts        — ScrapedHackathon interface
├── geocode.ts      — Nominatim wrapper
├── devpost.ts      — Devpost JSON API
├── mlh.ts          — MLH Inertia.js parser
├── luma.ts         — Luma __NEXT_DATA__ parser
├── reddit.ts       — Reddit JSON API + filtro semántico
├── twitter.ts      — Twitter/X API v2
├── index.ts        — orquestador: paralelo + two-phase geocoding
└── README.md       — documentación

src/app/api/cron/scrape/route.ts  — endpoint HTTP
src/lib/supabase/service.ts       — service role client
vercel.json                       — cron schedule (06:00 UTC diario)
supabase/migrations/002_scraper_fields.sql — source/source_id columns
```
