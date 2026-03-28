# FleteYa — Arquitectura Técnica

## Visión General

FleteYa es un monorepo que contiene tres proyectos:

1. **Web (`apps/web`)**: Next.js 14 con App Router. Sirve dos propósitos:
   - **Marketing**: Landing page pública (SEO, conversión)
   - **App web**: Interfaz autenticada mobile-first (misma funcionalidad que la app nativa)

2. **Mobile (`apps/mobile`)**: React Native + Expo. App nativa para iOS y Android.

3. **Shared (`packages/shared`)**: Tipos TypeScript, utilidades y constantes compartidas entre web y mobile.

4. **Supabase (`packages/supabase`)**: Migraciones SQL, seeds, y edge functions.

## Routing (Web)

Next.js usa Route Groups para separar marketing y app:

```
app/
├── (marketing)/     ← Rutas públicas, sin auth
│   ├── page.tsx     ← Landing (/)
│   └── layout.tsx   ← Navbar + Footer
├── (app)/           ← Rutas autenticadas
│   ├── dashboard/   ← Home logueado (/dashboard)
│   ├── shipment/    ← Wizard de envío (/shipment)
│   ├── tracking/    ← GPS en vivo (/tracking)
│   ├── profile/     ← Perfil + docs (/profile)
│   └── layout.tsx   ← Bottom nav + auth guard
└── api/             ← API Routes (backend)
```

Los Route Groups `(marketing)` y `(app)` NO afectan la URL. 
`/` muestra la landing. `/dashboard` muestra la app.

## Auth Flow

```
[Usuario] → Login (Google/Email; Facebook opcional por flag)
    ↓
[Supabase Auth] → Crea sesión + JWT
    ↓
[Trigger SQL] → Crea profile en tabla public.profiles
    ↓
[Middleware Next.js] → Verifica JWT en cada request a (app)/*
    ↓
[App] → Muestra contenido autenticado
```

Supabase Auth maneja:
- OAuth con Google (Facebook opcional por feature flag)
- Magic links por email
- Session management con cookies (SSR)
- JWT refresh automático

## Base de Datos

PostgreSQL con PostGIS para queries geoespaciales.

### Tablas principales:
- `profiles` → Extiende auth.users con nombre, teléfono, rol, avatar
- `drivers` → Datos de verificación del fletero (docs, rating)
- `vehicles` → Vehículos del fletero (múltiples por driver)
- `shipments` → Envíos con estado, precio, descuento, `assignment_strategy_id`
- `shipment_driver_applications` → Postulaciones de fleteros a envíos abiertos; la plataforma asigna conductor
- `shipment_legs` → Tramos con coordenadas PostGIS
- `tracking_points` → Puntos GPS para tracking en vivo
- `reviews` → Reseñas post-viaje
- `payments` → Registro de transacciones MercadoPago

### Row Level Security (RLS):
Cada tabla tiene políticas que restringen acceso según `auth.uid()`.
Los clientes solo ven sus envíos. Los fleteros solo ven sus datos y envíos asignados.

## Real-time (GPS Tracking)

```
[Fletero Mobile] → Expo Location (background)
    ↓
[Supabase Insert] → tracking_points table
    ↓
[Supabase Realtime] → Broadcast a subscribers
    ↓
[Cliente Web/Mobile] → Actualiza marker en mapa
```

Supabase Realtime usa WebSockets. La tabla `tracking_points` está habilitada
para realtime via `alter publication supabase_realtime add table`.

## Matching y asignación (conductores)

Modelo de negocio: **el cliente publica el envío**; **los fleteros se postulan**; **FleteYa asigna on-demand** (tras cada postulación si `AUTO_ASSIGN_ON_APPLICATION`, o vía `POST .../assign`) con **`proximity_then_rating_v1` por defecto**: primero **bandas de cercanía** al retiro (GPS de la postulación y/o **fin del viaje activo** del conductor), dentro de cada banda gana la **mejor valoración** en la app. Así se prioriza **encadenar varios viajes en el día** (la “nueva ubicación” tras una entrega acerca al conductor al siguiente retiro y compite en la banda más favorable). Descuentos por tramos encadenados siguen en pricing (`packages/shared` / wizard).

- Tabla `shipment_driver_applications` + RPC `last_leg_dest_coords` (service_role) para el destino del viaje en curso.
- Postulación: `POST .../applications` → opcionalmente dispara asignación automática.
- Lógica en **`packages/shared/src/assignment`**: `registerAssignmentStrategy()` para evolucionar reglas sin romper API.

## Pagos (MercadoPago)

```
[Cliente] → Confirma envío (conductor ya asignado por la plataforma) y paga
    ↓
[API Route] → Crea preferencia MercadoPago (marketplace split)
    ↓
[MercadoPago] → Checkout (QR, tarjeta, débito)
    ↓
[Webhook] → /api/webhooks/mercadopago
    ↓
[API] → Actualiza shipment.status + crea payment record
    ↓
[Split] → Comisión (22%) a FleteYa, resto al fletero
```

Se usa MercadoPago Marketplace con split de pagos.
El `marketplace_fee` se configura por transacción.

## SmartRoute Engine (Backhaul)

El motor de matching para viajes de retorno:

1. **Geofencing**: Cuando un fletero completa un viaje, busca cargas pendientes
   en un radio de 5km alrededor del destino usando PostGIS:
   ```sql
   ST_DWithin(origin_location, ST_MakePoint(lng, lat)::geography, 5000)
   ```

2. **Scoring**: Cada carga candidata recibe un score basado en:
   - Proximidad al destino del fletero
   - Dirección de la ruta de vuelta
   - Capacidad disponible vs requerida
   - Ventana horaria

3. **Pricing**: Descuento automático basado en el ahorro real:
   - Leg 1 (ida): 0% descuento
   - Leg 2 (conexión): 15-25%
   - Leg 3+ (cadena): 25-45%
   - Bonus circuito: +8%

## Deploy

### Web → Vercel
- Push a `main` → Deploy automático
- Preview deploys en cada PR
- Edge functions para API routes
- Variables de entorno en Vercel dashboard

### Mobile → Expo EAS
- `eas build --platform all` → Builds en la nube
- `eas submit` → Publicación en stores
- Over-the-air updates con `eas update`

## Monitoreo

- **Eventos de marketing**: `data-marketing-event` + `window.dataLayer` en landing web.
- **Logs de plataforma**: Vercel logs (web) + Supabase logs (DB).
- **Salud operativa**: build/lint/tests en CI local y verificación de deploy con checklist Vercel/Supabase.
