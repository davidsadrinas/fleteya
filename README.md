# FleteYa

Marketplace de fletes con optimizacion de retornos (backhaul) para AMBA, Argentina.

## Arquitectura

```
fletaya/
├── apps/
│   ├── web/          → Next.js 14 (App Router) - Web publica + App + API
│   └── mobile/       → React Native + Expo - App iOS/Android
├── packages/
│   ├── shared/       → Tipos, utilidades, constantes y logica de asignacion
│   └── supabase/     → Migraciones SQL, seeds y scripts de BD
```

## Stack Tecnologico

| Capa | Tecnologia | Proposito |
|------|-----------|-----------|
| Web | Next.js 14 (App Router) | Landing + App web |
| Mobile | React Native + Expo 52 | App iOS/Android |
| Auth | Supabase Auth | Google, Facebook, Email magic link |
| Base de datos | Supabase (PostgreSQL + PostGIS) | Datos + geolocalizacion |
| Storage | Supabase Storage | Fotos DNI, vehiculos, evidencia |
| Pagos | MercadoPago | Cobro y split payments |
| Mapas | Google Maps Platform | Autocomplete, direcciones, tracking |
| Real-time | Supabase Realtime | GPS tracking, chat, disputas |
| Push | Web Push (VAPID) + Expo Notifications | Notificaciones |
| Rate Limiting | Upstash Redis (prod) / in-memory (dev) | Proteccion anti-abuso |
| Hosting | Vercel (web) + Expo EAS (mobile) | Deploy |
| Tests | Vitest | Unit + integration tests |

## Requisitos Previos

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **Cuenta Supabase** (gratis) — https://supabase.com
- **Expo CLI** (`npm install -g expo-cli`) — solo si vas a correr la app mobile

## Setup Completo desde Cero

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd fletaya
pnpm install
```

### 2. Configurar Supabase

1. Crear un proyecto nuevo en https://supabase.com
2. Ir a **Settings → API** y copiar:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`)

3. En el dashboard de Supabase, activar extensiones:
   - **PostGIS** (Database → Extensions → buscar "postgis" → Enable)
   - **uuid-ossp** (suele estar habilitado por defecto)

4. Activar providers de Auth (Authentication → Providers):
   - **Email** (magic link, ya viene activado)
   - **Google** (necesitas Client ID/Secret de Google Cloud Console)
   - **Facebook** (opcional, necesitas App ID/Secret de Facebook Developers)

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp apps/web/.env.example apps/web/.env.local
```

Editar `apps/web/.env.local` con los valores de tu proyecto Supabase:

```env
# Obligatorio
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Pagos (para que funcione MercadoPago)
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=...

# Push notifications (generar con: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Opcional
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Para la app mobile, crear `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_MAPS_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Correr migraciones de base de datos

```bash
pnpm db:migrate
```

Esto ejecuta las 10 migraciones SQL que crean todas las tablas, funciones RPC, politicas RLS, buckets de storage, etc.

Opcionalmente, cargar datos de prueba:
```bash
pnpm db:seed
```

### 5. Iniciar desarrollo

```bash
# Web (Next.js) — http://localhost:3000
pnpm dev:web

# Mobile (Expo) — abrir en Expo Go
pnpm dev:mobile
```

### 6. Correr tests

```bash
# Todos los tests del monorepo
pnpm test

# Solo un workspace
pnpm test:web      # 29 test files, 151+ tests
pnpm test:shared   # 5 test files, 54+ tests
pnpm test:mobile   # Tests de la app mobile

# Con watch mode
cd apps/web && pnpm test:watch

# Con coverage
pnpm test:coverage
```

## Estructura de la Web (Next.js)

```
apps/web/app/
├── (marketing)/          → Rutas publicas
│   ├── page.tsx          → Landing page
│   ├── como-funciona/    → Explicacion del servicio
│   ├── cotizar/          → Cotizador instantaneo (sin login)
│   ├── fleteros/         → Landing para fleteros
│   └── legal/[slug]/     → Paginas legales
├── (app)/                → Rutas autenticadas
│   ├── dashboard/        → Home del usuario
│   ├── shipment/         → Wizard de nuevo envio + confirmacion
│   ├── tracking/         → Tracking GPS en vivo
│   ├── profile/          → Perfil, documentos, vehiculos
│   ├── settings/         → Config, push, referidos
│   └── admin/            → Panel admin (stats, fleteros, disputas)
├── api/                  → API Routes
│   ├── shipments/        → CRUD envios + asignacion + chat + disputas
│   ├── drivers/          → Gestion fleteros
│   ├── payments/         → Crear preferencia MP + webhook
│   ├── quote/            → Cotizacion instantanea
│   ├── referrals/        → Codigos de referido
│   ├── push/             → Subscripcion + envio de push
│   ├── admin/            → Stats, verificacion, disputas
│   ├── documents/        → URLs firmadas para storage
│   └── tracking/         → GPS tracking
```

## Deploy

### Web (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
# IMPORTANTE: NEXT_PUBLIC_APP_URL debe apuntar a tu dominio, NO a localhost
# Si usas Install Command custom, evitar `corepack enable` en CI:
# corepack prepare pnpm@10.28.1 --activate && pnpm install --frozen-lockfile
```

### Mobile (Expo EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Build
eas build --platform all

# Submit a stores
eas submit --platform all
```

## Documentacion del Proyecto

Para una explicacion completa de la arquitectura, funcionalidades, modelo de datos, pricing, seguridad y API endpoints, ver **[FLETAYA.md](./FLETAYA.md)**.

## Licencias y Cuentas

| Servicio | Costo | Nota |
|----------|-------|------|
| Supabase | Gratis (Free tier) | Hasta 50K MAU |
| Vercel | Gratis (Hobby) | Deploy automatico |
| Google Play | USD 25 (unico) | Cuenta de desarrollador |
| Apple App Store | USD 99/ano | Developer Program |
| Google Maps | USD 200/mes credito gratis | Places, Directions |
| MercadoPago | % por transaccion | Split payments |
