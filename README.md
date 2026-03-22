# FleteYa

Marketplace de fletes con optimización de retornos (backhaul) para AMBA, Argentina.

## Arquitectura

```
fletaya-project/
├── apps/
│   ├── web/          → Next.js 14 (App Router) - Web pública + App web
│   └── mobile/       → React Native + Expo - App iOS/Android
├── packages/
│   ├── shared/       → Tipos, utilidades y constantes compartidas
│   └── supabase/     → Migraciones, seeds y edge functions
└── docs/             → Documentación del proyecto
```

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Web | Next.js 14 (App Router) | Landing + App web |
| Mobile | React Native + Expo | App iOS/Android |
| Auth | Supabase Auth + NextAuth | Google, Facebook, Instagram, Email |
| Base de datos | Supabase (PostgreSQL + PostGIS) | Datos + geolocalización |
| Storage | Supabase Storage | Fotos DNI, vehículos |
| Pagos | MercadoPago SDK | Split payments marketplace |
| Maps | Google Maps Platform | Autocomplete, directions, tracking |
| Hosting | Vercel | Web + API routes |
| Real-time | Supabase Realtime | GPS tracking en vivo |
| Push | Expo Notifications + FCM | Notificaciones |

## Inicio Rápido

### Requisitos
- Node.js 20+
- pnpm 8+
- Cuenta de Supabase (gratis)
- Cuenta de Vercel (gratis)
- Expo CLI (`npm install -g expo-cli`)

### Setup

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd fletaya-project
pnpm install

# 2. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# 3. Configurar Supabase
# Crear proyecto en https://supabase.com
# Copiar URL y anon key al .env.local

# 4. Correr migraciones
pnpm db:migrate

# 5. Desarrollo
pnpm dev:web      # → http://localhost:3000
pnpm dev:mobile   # → Expo Go en el celular
```

### Deploy

```bash
# Web → Vercel
vercel

# Mobile → Expo
eas build --platform all
eas submit --platform all
```

## Estructura de la Web (Next.js)

```
apps/web/app/
├── (marketing)/          → Rutas públicas (landing, sobre nosotros, etc.)
│   ├── page.tsx          → Landing page principal
│   ├── como-funciona/    → Explicación del servicio
│   ├── fleteros/         → Landing para fleteros
│   ├── precios/          → Pricing y comisiones
│   └── layout.tsx        → Layout con navbar y footer
├── (app)/                → Rutas autenticadas (la app)
│   ├── dashboard/        → Home del usuario logueado
│   ├── shipment/         → Wizard de nuevo envío
│   ├── tracking/         → Tracking GPS en vivo
│   ├── profile/          → Perfil, docs, vehículos
│   ├── settings/         → Configuración de cuenta
│   └── layout.tsx        → Layout con bottom nav
├── api/                  → API Routes (backend)
│   ├── auth/             → NextAuth endpoints
│   ├── shipments/        → CRUD de envíos
│   ├── drivers/          → Gestión de fleteros
│   ├── tracking/         → WebSocket tracking
│   └── webhooks/         → MercadoPago webhooks
└── layout.tsx            → Root layout
```

## Variables de Entorno

### Web (`apps/web/.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mobile (`apps/mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Base de Datos

### Tablas principales
- `users` → Usuarios (extends Supabase auth)
- `drivers` → Perfil de fleteros (docs, verificación)
- `vehicles` → Vehículos de fleteros
- `shipments` → Envíos/fletes
- `shipment_legs` → Tramos de cada envío
- `tracking_points` → Puntos GPS en tiempo real
- `reviews` → Reseñas de clientes
- `payments` → Registro de pagos

### Extensiones PostgreSQL
- `postgis` → Queries geoespaciales
- `pg_cron` → Jobs programados
- `uuid-ossp` → UUIDs

## Licencias y Cuentas Necesarias

| Servicio | Costo | Nota |
|----------|-------|------|
| Supabase | Gratis (Free tier) | Hasta 50K MAU |
| Vercel | Gratis (Hobby) | Deploy automático |
| Google Play | USD 25 (único) | Cuenta de desarrollador |
| Apple App Store | USD 99/año | Developer Program |
| Google Maps | USD 200/mes crédito gratis | Places, Directions |
| MercadoPago | % por transacción | Split payments |
| AWS Activate | Hasta USD 100K créditos | Aplicar como startup |
