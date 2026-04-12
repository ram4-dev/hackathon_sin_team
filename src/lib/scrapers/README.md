# Hackathon Scrapers

Sistema de scraping que recolecta hackathons de múltiples fuentes y los guarda en la tabla `hackathons` de Supabase.

## Flujo general

```
GET /api/cron/scrape
       │
       ▼
runAllScrapers()  ←── src/lib/scrapers/index.ts
       │
       ├── scrapeDevpost()      → JSON API de Devpost
       ├── scrapeMLH()          → HTML de mlh.io
       ├── scrapeLuma()         → __NEXT_DATA__ de lu.ma
       ├── scrapeReddit()       → JSON API pública de Reddit
       ├── scrapeHackathones()  → HTML de hackathones.com
       └── scrapeTwitter()      → Twitter/X API v2 (opcional)
              │
              ▼
       geocode() por cada item con ciudad/país (Nominatim, 1 req/s)
              │
              ▼
       supabase.upsert() con onConflict: "source,source_id"
```

## Fuentes

| Fuente | Archivo | Método | Requiere |
|--------|---------|--------|----------|
| Devpost | `devpost.ts` | JSON API — 3 páginas (~150 hackathons) | — |
| MLH | `mlh.ts` | Scraping HTML con regex | — |
| Luma | `luma.ts` | Parseo de `__NEXT_DATA__` (Next.js) | — |
| Reddit | `reddit.ts` | JSON API pública (r/hackathon, r/learnprogramming) | — |
| hackathones.com | `hackathones.ts` | Scraping HTML con regex | — |
| Twitter/X | `twitter.ts` | API v2 — búsqueda reciente | `X_BEARER_TOKEN` |

## Variables de entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `CRON_SECRET` | Protege el endpoint `/api/cron/scrape` | No (recomendada en prod) |
| `X_BEARER_TOKEN` | Bearer token de Twitter/X API v2 | No (sin token, se saltea) |

## Deduplicación

Cada hackathon tiene `source` (nombre de la fuente) + `source_id` (ID externo). La combinación es UNIQUE en la base de datos, por lo que un re-scrape actualiza el registro existente en vez de duplicarlo.

## Geocodificación

Cuando una fuente provee ciudad/país pero no coordenadas, se llama a Nominatim (OpenStreetMap) para obtener lat/lng. Se respeta el límite de 1 request/segundo.

## Ejecución

**Automática:** cron diario a las 06:00 UTC (configurado en `vercel.json`).

**Manual:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio.com/api/cron/scrape
```

**Local (sin secret):**
```
GET http://localhost:3000/api/cron/scrape
```

## Respuesta del endpoint

```json
{
  "ok": true,
  "elapsed_ms": 12400,
  "total": { "fetched": 230, "upserted": 18, "errors": 0 },
  "results": [
    { "source": "devpost",     "fetched": 150, "upserted": 12, "errors": 0 },
    { "source": "mlh",         "fetched": 40,  "upserted": 3,  "errors": 0 },
    { "source": "luma",        "fetched": 20,  "upserted": 2,  "errors": 0 },
    { "source": "reddit",      "fetched": 20,  "upserted": 1,  "errors": 0 },
    { "source": "hackathones", "fetched": 0,   "upserted": 0,  "errors": 0 },
    { "source": "twitter",     "fetched": 0,   "upserted": 0,  "errors": 0 }
  ]
}
```

## Migración

Los campos `source` y `source_id` se agregaron con `supabase/migrations/002_scraper_fields.sql`.
