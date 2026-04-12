# Spec: Map View

## Overview
Mapa interactivo que muestra builders y hackathons geolocalizados. Permite filtrar, hacer hover para preview y click para detalle. El panel lateral lista los hackathons remotos (sin ubicación física).

## Componentes
- **Page** (`src/app/(main)/map/page.tsx`) — Server Component. Carga builders, hackathons con coords, hackathons remotos e IP geolocation en paralelo.
- **MapView** (`src/components/map/map-view.tsx`) — Client Component. Maneja el mapa Mapbox GL, markers, filtros, tooltip y cards.

## Geolocalización del usuario
1. **Prod (Vercel)**: headers `x-vercel-ip-latitude` / `x-vercel-ip-longitude` → sin prompt, latencia 0
2. **Staging / IP real**: `ipapi.co/{ip}/json/` con cache 1h
3. **Local dev (127.0.0.1 / ::1)**: `navigator.geolocation` → prompt del browser → `flyTo` con zoom 9
4. **Sin ubicación**: vista global (centro `[0, 20]`, zoom 2)

## Markers
| Tipo | Forma | Color |
|------|-------|-------|
| Builder available | Círculo | Verde `#22c55e` |
| Builder looking_for_team | Círculo | Amarillo `#eab308` |
| Builder networking | Círculo | Gris `#6b7280` |
| Hackathon upcoming | Cuadrado redondeado | Azul `#3b82f6` |
| Hackathon active | Cuadrado redondeado | Verde `#22c55e` |
| Hackathon past | Cuadrado redondeado | Gris `#6b7280` |

**Patrón inner/outer**: Mapbox GL controla `element.style.transform` del outer div para posicionamiento. La animación de hover (scale) se aplica al inner div para no interferir.

## Interacciones
- **Hover** → tooltip con nombre, ciudad, badges. `pointer-events: none` explícito en todos los hijos.
- **Click** → siempre abre floating detail card + hace `flyTo` si zoom < 13
- **Click en mapa vacío** → cierra la card (detectado con `markerClickedRef` flag para evitar que el click del marker cierre la card inmediatamente)

## Filtros
- Layer: Both / Builders / Hackathons
- City (texto libre)
- Role / Stack (builders)
- Category / Modality (hackathons)

Los arrays filtrados usan `useMemo` para estabilizar referencias y evitar que los markers se recreen en cada render.

## Panel de remotos (sidebar)
Lista scrolleable de hackathons con `modality = remote`, ordenados por `start_date`. Muestra: nombre, status badge, categoría, prize pool, fechas. Link externo al `official_url`.

## Props
```typescript
interface MapViewProps {
  builders: MapBuilder[];
  hackathons: MapHackathon[];           // solo los que tienen lat/lng
  remoteHackathons?: RemoteHackathon[]; // sin coords, van al sidebar
  initialCenter?: { lat: number; lng: number };
}
```
