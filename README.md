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
│   └── supabase/     → Migraciones SQL (11), seeds y scripts de BD
├── docs/             → PDFs generados (use cases, marketing plan)
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
| Real-time | Supabase Realtime | GPS tracking, chat, status updates |
| State Management | Zustand | Auth, wizard, tracking stores |
| Push | Web Push (VAPID) + Expo Notifications | Notificaciones |
| Rate Limiting | Upstash Redis (prod) / in-memory (dev) | Proteccion anti-abuso |
| Hosting | Vercel (web) + Expo EAS (mobile) | Deploy |
| Tests | Vitest | Unit + integration (202+ tests) |

## Requisitos Previos

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **Cuenta Supabase** (gratis) — https://supabase.com
- **Expo CLI** (`npm install -g expo-cli`) — solo si vas a correr la app mobile
- **Google Chrome** — necesario si vas a generar PDFs con los scripts de `/docs`

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

# Google Maps (necesario para autocomplete de direcciones y tracking)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...

# OAuth (se configuran tambien en Supabase Dashboard)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Asignacion automatica
ASSIGNMENT_STRATEGY_ID=proximity_then_rating_v1
AUTO_ASSIGN_ON_APPLICATION=true
```

Para la app mobile, crear `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_MAPS_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Configurar Google Maps API Key

1. Ir a https://console.cloud.google.com
2. Crear un proyecto o usar uno existente
3. Habilitar las APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Directions API**
   - **Geocoding API**
4. Crear credencial → API Key
5. Restringir la key a las APIs de arriba + dominio de tu app
6. Copiar la key a `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

### 5. Correr migraciones de base de datos

```bash
pnpm db:migrate
```

Esto ejecuta las 11 migraciones SQL que crean todas las tablas, funciones RPC, politicas RLS, buckets de storage, etc.

Opcionalmente, cargar datos de prueba:
```bash
pnpm db:seed
```

### 6. Iniciar desarrollo

```bash
# Web (Next.js) — http://localhost:3000
pnpm dev:web

# Mobile (Expo) — abrir en Expo Go
pnpm dev:mobile
```

### 7. Correr tests

```bash
# Todos los tests del monorepo
pnpm test

# Solo un workspace
pnpm test:web      # 29 test suites, 148+ tests
pnpm test:shared   # 5 test suites, 54+ tests
pnpm test:mobile   # Tests de la app mobile

# Con watch mode
cd apps/web && pnpm test:watch
```

---

## Funcionalidades Completas

### Paginas Publicas (Marketing)

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/` | Landing page | Hero, como funciona, stats, reviews, pricing, FAQ |
| `/cotizar` | Cotizador instantaneo | Cotiza sin registro, 1-5 tramos, captura de email para reservar precio 2h |
| `/como-funciona` | Como funciona | Explicacion del servicio en 4 pasos |
| `/fleteros` | Landing fleteros | Reclutamiento de nuevos conductores |
| `/planes` | Planes de suscripcion | 3 planes (Particular/Comercio/Empresa) con comparativa, FAQ y precios |
| `/legal/[slug]` | Paginas legales | Terminos, privacidad, etc. |
| `/empresa/[slug]` | Paginas de empresa | Informacion corporativa |
| `/t/[id]` | Tracking publico | Seguimiento en vivo sin login (para compartir por WhatsApp) |

### App Autenticada

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/dashboard` | Dashboard | Home: bienvenida, tipos de servicio, envio activo, viajes de retorno, envios recientes con "Repetir" y fletero favorito |
| `/shipment` | Wizard de envio | 4 pasos: Ruta (con autocomplete + confirmacion en mapa) → Carga → Asignacion → Confirmar |
| `/shipment/confirmation` | Confirmacion | Resumen, badge de seguro, ETA estimado, calendario (.ics), pago con MercadoPago |
| `/tracking` | Tracking en vivo | Mapa GPS, estados, chat, evidencia, disputas, compartir por WhatsApp. Solo se muestra el mapa si hay envio activo |
| `/profile` | Perfil | Datos de cuenta, documentos (DNI, licencia, seguro, VTV), vehiculos |
| `/settings` | Configuracion | Push notifications, codigo de referido, canjear referido |
| `/admin` | Panel admin | Dashboard con 12 metricas, gestion de fleteros, disputas, envios |

### Wizard de Creacion de Envio (Detalle)

**Paso 1 — Ruta:**
- 1 a 5 tramos (origen/destino)
- Direcciones con **Google Places Autocomplete** (restringido a Argentina)
- Al seleccionar una direccion, se abre un **popup con mapa de Google Maps** mostrando un pin arrastrable
- El usuario confirma la ubicacion exacta antes de continuar
- Las coordenadas reales se guardan en el store

**Paso 2 — Carga:**
- 8 tipos: mudanza, mercaderia, materiales, electrodomesticos, muebles, acarreo vehiculo, limpieza atmosferico, residuos
- Peso (4 categorias), tipo de vehiculo (6 tipos), cantidad de ayudantes (0-3)
- Detalle especifico para acarreo (motivo: averia, compraventa, traslado)
- Alertas para servicios que requieren certificacion

**Paso 3 — Asignacion:**
- Informacion sobre el proceso de postulacion y asignacion automatica

**Paso 4 — Confirmar:**
- Resumen de tramos, precio estimado con descuentos por cadena, comision

### Dashboard: Envios Recientes + Repetir Envio

El dashboard muestra los ultimos 5 envios completados/cancelados con:
- Tipo de envio y estado (Entregado/Cancelado)
- Precio final y fecha
- Boton **"Repetir"** — precarga el tipo de envio en el wizard y redirige a `/shipment`
- Boton **fletero favorito** (estrella) — marca/desmarca al fletero como favorito

### Tracking en Vivo

- **Mapa interactivo solo con envio activo**: Si no hay envio o el estado no es activo (assigned, en_route, in_transit, etc.), se muestra un mensaje informativo en lugar del mapa
- **Compartir por WhatsApp**: Boton que genera un link publico `/t/{shipmentId}` y lo comparte via WhatsApp. El destinatario ve el progreso sin necesitar cuenta
- **Copiar link**: Boton alternativo que copia el link al portapapeles
- **Chat en vivo**: Mensajes con el fletero + respuestas rapidas predefinidas
- **Evidencia fotografica**: Fotos de pickup y delivery subidas por el fletero
- **Disputas**: El cliente puede abrir un reclamo con descripcion y evidencia

### Tracking Publico (`/t/[id]`)

Pagina publica (sin login) que muestra:
- Estado actual del envio con barra de progreso
- Origen, destino y nombre del fletero
- Lista de estados con indicador visual
- Actualizaciones en tiempo real via Supabase Realtime
- CTA para registrarse en FleteYa

Cada envio se convierte en un canal de marketing viral cuando el cliente comparte el link.

### Confirmacion y Pago

La pagina de confirmacion incluye:
- **Badge "Envio protegido"**: Indica que el envio tiene seguro de responsabilidad civil del fletero verificado
- **ETA estimado**: Muestra rango de tiempo de llegada (45-90 min)
- Resumen del viaje (retiro, entrega, fletero, vehiculo)
- Desglose de precio (base, descuento, total)
- Notificaciones enviadas (email cliente + fletero)
- Agregar al calendario (Google Calendar, Apple, Outlook via .ics)
- Boton de pago con MercadoPago

### Cotizador con Captura de Leads (`/cotizar`)

Despues de cotizar, el resultado muestra:
- Precio estimado con desglose por tramo
- Badge de seguro de responsabilidad civil
- **"Reserva este precio por 2 horas"**: Input de email + boton Reservar. Al confirmar, muestra countdown de 2h
- CTAs de registro/login

### Planes de Suscripcion (`/planes`)

| Plan | Precio | Comision | Incluye |
|------|--------|----------|---------|
| Particular | Gratis | 22% | Cotizacion instantanea, 5 tramos, tracking, chat, seguro RC, MercadoPago |
| Comercio | $14.900/mes + IVA | 18% | + 10 envios/mes, fletero favorito con prioridad, soporte WhatsApp, facturacion automatica |
| Empresa | $39.900/mes + IVA | 15% | + 30 envios/mes, multiples usuarios, API, reportes, account manager, SLA 30 min |

### Sistema de Administracion

- **Admin unico**: Solo `david.sadrinas@gmail.com` tiene acceso al panel de admin. Verificacion directa por email sin consulta a base de datos.
- **Dashboard**: 12 metricas (usuarios, fleteros verificados, envios activos/entregados/cancelados, disputas, GMV, revenue, referidos)
- **Gestion de fleteros**: Verificar/rechazar con auditoria
- **Gestion de disputas**: Resolver con nota de resolucion
- **Vista de envios**: Filtros por estado

### Tema Visual

- **Dark mode unico**: Sin toggle dark/light. La app siempre usa el tema oscuro (background `#0F172A`, superficie `#1E293B`).
- Variables CSS en `:root` para colores consistentes (`--fy-bg`, `--fy-text`, `--fy-dim`, etc.)
- Paleta: teal `#0D9488` (primario), amber `#F59E0B` (acento), coral `#FF6B6B` (CTA)

---

## API Endpoints

### Publicos (sin auth)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/quote` | Cotizacion instantanea (1-5 tramos, con descuentos) |
| POST | `/api/payments/webhook` | Webhook MercadoPago (verificacion HMAC-SHA256) |
| GET | `/api/health` | Health check |

### Autenticados (requieren sesion)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET/POST | `/api/shipments` | Listar/crear envios |
| PATCH | `/api/shipments/[id]/status` | Actualizar estado del envio |
| POST | `/api/shipments/[id]/assign` | Trigger asignacion de fletero |
| GET/POST | `/api/shipments/[id]/applications` | Postulaciones de fleteros |
| GET/POST | `/api/shipments/[id]/chat` | Chat del envio |
| POST | `/api/shipments/[id]/evidence` | Subir evidencia fotografica |
| GET/POST | `/api/shipments/[id]/disputes` | Disputas/reclamos |
| GET/PATCH | `/api/drivers` | Perfil de fletero |
| POST | `/api/payments/create` | Crear preferencia MercadoPago |
| POST/GET | `/api/tracking` | Enviar/consultar ubicacion GPS |
| GET/POST | `/api/referrals` | Codigos de referido |
| POST/DELETE | `/api/push/subscribe` | Subscripcion a push notifications |
| POST | `/api/documents/signed-url` | URL firmada para storage |

### Admin (requieren email admin)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admin/stats` | Estadisticas de plataforma |
| GET | `/api/admin/shipments` | Todos los envios |
| GET | `/api/admin/drivers` | Todos los fleteros (con filtro de estado) |
| PATCH | `/api/admin/drivers/[id]/verify` | Verificar/rechazar fletero |
| GET | `/api/admin/disputes` | Todas las disputas |
| PATCH | `/api/admin/disputes/[id]` | Resolver disputa |

### Internos (requieren secret)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/push/send` | Enviar push notification |

---

## Pricing y Comisiones

### Calculo de precio
```
Precio base por tramo = $3.200 + ($1.800 x distancia_km)
```

### Descuentos por cadena (multi-parada)
| Tramo | Descuento |
|-------|-----------|
| 1ro | 0% |
| 2do | 15% |
| 3ro | 27% |
| 4to | 39% |
| 5to | 45% |

Circuito (ultimo destino ≈ primer origen): bonus del 8%.

### Comision
- **Normal**: 22% del precio final
- **Backhaul**: 15% (incentivo para retornos)
- **Plan Comercio**: 18%
- **Plan Empresa**: 15%

---

## Seguridad

| Mecanismo | Implementacion |
|-----------|---------------|
| CSRF | Header `X-Requested-With: FleteYa` requerido en mutaciones. `apiFetch()` lo agrega. |
| Rate Limiting | Upstash Redis (prod) / Map in-memory (dev). Limites por IP y usuario. |
| CSP | Whitelist: Supabase, MercadoPago, Google Maps. |
| HSTS | `Strict-Transport-Security` con 1 ano max-age. |
| Webhook Auth | HMAC-SHA256 para webhooks de MercadoPago. |
| Admin Auth | Verificacion directa por email (`david.sadrinas@gmail.com`), sin query a BD. |
| Path Traversal | Regex UUID + decodificacion percent-encoding en signed URLs. |
| DNI Verification | Aprobacion manual de admin (sin auto-verificacion). |
| Min Rating | Fleteros con rating < 3.0 excluidos de asignaciones. |
| RLS | Row Level Security en todas las tablas. |

---

## Estructura de Archivos (Web)

```
apps/web/
├── app/
│   ├── (marketing)/              → Rutas publicas
│   │   ├── page.tsx              → Landing page
│   │   ├── como-funciona/        → Explicacion del servicio
│   │   ├── cotizar/              → Cotizador con captura de email
│   │   ├── planes/               → Planes de suscripcion (Particular/Comercio/Empresa)
│   │   ├── fleteros/             → Landing para fleteros
│   │   ├── legal/[slug]/         → Paginas legales
│   │   └── empresa/[slug]/       → Paginas institucionales
│   ├── (app)/                    → Rutas autenticadas
│   │   ├── dashboard/            → Home con envios recientes + repetir + favorito
│   │   ├── shipment/             → Wizard con autocomplete + mapa + confirmacion con ETA/seguro
│   │   ├── tracking/             → Tracking GPS + WhatsApp share + chat + disputas
│   │   ├── profile/              → Perfil, documentos, vehiculos
│   │   ├── settings/             → Config, push, referidos
│   │   └── admin/                → Panel admin (stats, fleteros, disputas, envios)
│   ├── t/[id]/                   → Tracking publico (compartible, sin login)
│   ├── api/                      → 23 API Routes
│   └── login/                    → Autenticacion
├── components/
│   ├── address-input.tsx         → Autocomplete Google Places + popup mapa con pin arrastrable
│   ├── auth-sync.tsx             → Sincronizacion de sesion Supabase
│   ├── onboarding-gate.tsx       → Gate de onboarding para nuevos usuarios
│   ├── marketing-navbar.tsx      → Navbar de paginas publicas
│   ├── error-boundary.tsx        → Error boundary React
│   └── tracking/                 → Chat, evidencia, disputas panels
├── lib/
│   ├── stores/index.ts           → Zustand: auth, shipment wizard, tracking
│   ├── hooks.ts                  → useSession, useSupabaseQuery, useRealtimeTracking
│   ├── schemas.ts                → Validacion Zod
│   ├── api-fetch.ts              → Wrapper fetch con CSRF header
│   ├── admin/auth.ts             → requireAdmin() — verificacion por email
│   └── supabase-client.ts        → Cliente Supabase browser
├── __tests__/                    → 29 test suites (148 tests)
└── styles/globals.css            → Tokens CSS, clases utilitarias
```

---

## Deploy

### Web (Vercel)

```bash
npm install -g vercel
vercel

# IMPORTANTE: configurar NEXT_PUBLIC_APP_URL al dominio real, NO localhost
```

### Mobile (Expo EAS)

```bash
npm install -g eas-cli
eas build --platform all
eas submit --platform all
```

---

## Generar PDFs

```bash
# PDF de use cases con screenshots
node docs/generate-pdf.mjs

# PDF del plan de marketing
node docs/generate-marketing-pdf.mjs
```

Requieren Google Chrome instalado en `/Applications/Google Chrome.app` y el dev server corriendo en `localhost:3000`.

---

## Documentacion del Proyecto

Para una explicacion completa de la arquitectura, modelo de datos, logica de asignacion, seguridad y mas, ver **[FLETAYA.md](./FLETAYA.md)**.

## Licencias y Cuentas

| Servicio | Costo | Nota |
|----------|-------|------|
| Supabase | Gratis (Free tier) | Hasta 50K MAU |
| Vercel | Gratis (Hobby) | Deploy automatico |
| Google Play | USD 25 (unico) | Cuenta de desarrollador |
| Apple App Store | USD 99/ano | Developer Program |
| Google Maps | USD 200/mes credito gratis | Places, Directions, Geocoding |
| MercadoPago | % por transaccion | Split payments |
