# FleteYa — Documentacion del Proyecto

## Que es FleteYa?

FleteYa es un marketplace digital de fletes y mudanzas para el Area Metropolitana de Buenos Aires (AMBA), Argentina. Conecta clientes que necesitan mover cosas (mudanzas, mercaderia, residuos, etc.) con fleteros verificados que tienen vehiculos disponibles.

La plataforma optimiza los retornos (backhaul): cuando un fletero termina un viaje y queda en una zona, el sistema detecta automaticamente si hay envios cerca de su ubicacion para que pueda tomar otro trabajo sin viajar de vuelta vacio, reduciendo el precio para el cliente y aumentando la rentabilidad del fletero.

---

## Arquitectura General

```
fletaya/
├── apps/
│   ├── web/             → Next.js 14 (App Router) — Web publica + App autenticada + API
│   └── mobile/          → React Native + Expo — App para iOS y Android
├── packages/
│   ├── shared/          → Tipos TypeScript, utilidades, constantes y logica de asignacion
│   └── supabase/        → Migraciones SQL (11), seeds y scripts de BD
├── docs/                → Scripts de generacion de PDFs y documentos generados
```

### Stack Tecnologico

| Capa | Tecnologia | Para que |
|------|-----------|----------|
| Frontend Web | Next.js 14 (App Router) | Landing pages + app autenticada |
| Frontend Mobile | React Native + Expo 52 | App nativa iOS/Android |
| Backend/API | Next.js API Routes | 23 endpoints REST |
| Base de datos | Supabase (PostgreSQL + PostGIS) | Datos + consultas geoespaciales |
| Autenticacion | Supabase Auth | Google, Facebook, Email magic link |
| Storage | Supabase Storage | Fotos DNI, vehiculos, evidencia |
| Pagos | MercadoPago | Cobro a clientes, split payout a fleteros |
| Mapas | Google Maps Platform | Autocomplete, direcciones, tracking en vivo |
| Real-time | Supabase Realtime | GPS tracking, chat, status updates, tracking publico |
| State Management | Zustand | Stores: auth, shipment wizard, tracking |
| Push Notifications | Web Push (VAPID) + Expo Notifications | Alertas en web y mobile |
| Rate Limiting | Upstash Redis (prod) + in-memory (dev) | Proteccion contra abuso |
| Hosting Web | Vercel | Deploy automatico |
| Hosting Mobile | Expo EAS | Build y publicacion |
| Error Tracking | Sentry (opcional) | Monitoreo de errores |

### Arquitectura SOLID de integraciones

- Las rutas API dependen de **interfaces (puertos)** y no de SDKs concretos.
- Cada proveedor externo vive en su **adapter** (patrón Ports & Adapters):
  - `lib/payments/adapters/*` (ej. MercadoPago)
  - `lib/identity/adapters/*` (ej. RENAPER)
  - `lib/notifications/adapters/*` (email/sms/whatsapp/push)
  - `lib/billing/adapters/*` (AFIP)
  - `lib/analytics/adapters/*` (PostHog)
  - `lib/error-reporting/adapters/*` (Sentry)
- La selección de proveedor es por variables de entorno (`*_PROVIDER`), lo que permite cambiar implementación sin tocar la capa de aplicación.
- Casos de uso en `lib/use-cases/*` concentran orquestación de dominio y mantienen handlers HTTP livianos.

---

## Modulos y Funcionalidades

### 1. Flujo del Cliente

1. **Cotizacion sin registro** (`/cotizar`) — El cliente pone origen, destino y tipo de envio. El sistema calcula precio al instante con descuentos por multiples paradas. Despues de cotizar, puede **reservar el precio por 2 horas** dejando su email (captura de lead).

2. **Creacion de envio** (`/shipment`) — Wizard de 4 pasos:
   - **Ruta**: 1-5 tramos con Google Places Autocomplete (restringido a Argentina). Al seleccionar una direccion se abre un **popup con mapa interactivo** donde el usuario puede arrastrar el pin para ajustar la ubicacion exacta y confirmar.
   - **Carga**: Tipo de envio (8 tipos), peso, vehiculo, ayudantes, horario.
   - **Asignacion**: Info del proceso automatico de postulacion.
   - **Confirmar**: Resumen con precio, descuentos y comision.

3. **Confirmacion y pago** (`/shipment/confirmation`) — Muestra:
   - Badge **"Envio protegido"** con seguro de responsabilidad civil.
   - **ETA estimado** (45-90 minutos segun trafico y distancia).
   - Resumen del viaje, fletero y vehiculo.
   - Agregar al calendario (.ics para Google Calendar, Apple, Outlook).
   - Pago seguro con MercadoPago.

4. **Tracking en vivo** (`/tracking`) — Mapa interactivo con posicion GPS del fletero en tiempo real. Solo se muestra si hay un envio en estado activo (assigned, en_route_to_pickup, at_origin, loading, picked_up, in_transit, arriving). Si no hay envio activo, muestra mensaje informativo.

5. **Compartir tracking por WhatsApp** — Desde la pagina de tracking, el cliente puede compartir un link publico (`/t/{id}`) por WhatsApp o copiar al portapapeles. El destinatario ve el progreso en tiempo real sin necesitar cuenta. Cada envio se convierte en exposicion de marca (growth loop viral).

6. **Repetir envio** — En el dashboard, la seccion "Envios recientes" muestra los ultimos 5 envios con boton **"Repetir"** que precarga el tipo de envio en el wizard y redirige automaticamente.

7. **Fletero favorito** — El cliente puede marcar fleteros con estrella desde los envios recientes. Los favoritos tienen prioridad en futuras asignaciones (plan Comercio/Empresa).

8. **Resenas** — Al finalizar, el cliente califica al fletero (1-5 estrellas + comentario).

### 2. Flujo del Fletero (Mobile)

1. **Registro y verificacion** — Sube DNI (frente/dorso) + selfie. Un admin revisa y aprueba manualmente desde el panel de admin.

2. **Vehiculos** — Registra hasta 5 vehiculos (moto, utilitario, camioneta, camion, grua, atmosferico) con fotos, certificaciones especiales (hazmat, habilitacion de grua) y fechas de vencimiento.

3. **Busqueda de envios** — Ve envios disponibles dentro de 15km. Puede postularse con su ubicacion GPS actual.

4. **Asignacion automatica** — Al postularse, el sistema puede auto-asignar basandose en cercania (bandas de distancia) y rating del fletero. Fleteros con rating < 3.0 son filtrados.

5. **Tracking activo** — La app mobile envia ubicacion GPS cada pocos segundos mientras esta en un envio activo (rate limit: 240/min). Incluye batch/flush para optimizar red.

6. **Chat y evidencia** — Chatea con el cliente (mensajes rapidos predefinidos), sube fotos de evidencia en pickup y delivery.

### 3. Panel de Administracion

- **Acceso restringido**: Solo `david.sadrinas@gmail.com` puede acceder. Verificacion directa por email, sin consulta a base de datos.
- **Dashboard** (`/admin`) — 12 metricas: usuarios totales, fleteros verificados, pendientes de verificacion, envios activos/entregados/cancelados, disputas abiertas, GMV, revenue, referidos activos.
- **Gestion de fleteros** (`/admin/drivers`) — Lista paginada con filtros (pending/verified/unverified), aprobar/rechazar con auditoria.
- **Gestion de disputas** (`/admin/disputes`) — Revisa y resuelve disputas con nota de resolucion.
- **Gestion de envios** (`/admin/shipments`) — Vista general con filtros por estado.
- **Auditoria** — Tabla `admin_actions` registra cada accion admin con timestamp.

### 4. Tracking Publico (`/t/[id]`)

Pagina publica compartible (sin login) que muestra:
- Estado actual con barra de progreso visual.
- Origen, destino y nombre del fletero asignado.
- Lista completa de estados con indicador (completado/activo/pendiente).
- Actualizaciones en tiempo real via Supabase Realtime.
- CTA para registrarse en FleteYa.

Proposito de negocio: cada envio compartido es publicidad gratuita. El destinatario ve la marca y puede convertirse en cliente.

### 5. Planes de Suscripcion (`/planes`)

| Plan | Precio | Comision | Envios incluidos | Diferencial |
|------|--------|----------|------------------|-------------|
| Particular | Gratis | 22% | Pago por envio | Todo lo basico |
| Comercio | $14.900/mes + IVA | 18% | 10/mes | Fletero favorito, soporte WhatsApp, facturacion automatica |
| Empresa | $39.900/mes + IVA | 15% | 30/mes | Multiples usuarios, API, reportes, account manager, SLA 30 min |

Incluye FAQ sobre cambio de plan, envios adicionales, permanencia y medios de pago.

### 6. Sistema de Referidos

- Cada usuario obtiene un codigo unico (3 letras del nombre + aleatorio, 8 chars total).
- Al compartirlo, el referido y el referente ganan $500 ARS.
- Limite de 50 usos por codigo. Previene auto-referidos y duplicados.
- Gestion desde `/settings` con lista de canjes exitosos.

### 7. Notificaciones Push

- **Web**: Service worker (`sw.js`) con VAPID keys para Web Push API.
- **Mobile**: Expo Notifications + FCM.
- El usuario activa/desactiva desde configuracion.
- Triggers: asignacion, cambios de estado, mensajes de chat, nuevas postulaciones, updates de disputas.

### 8. Cotizador con Captura de Leads (`/cotizar`)

- Cotizacion instantanea sin registro (1-5 tramos, 8 tipos de envio).
- Resultado muestra precio con desglose por tramo y descuentos por cadena.
- Badge de seguro de responsabilidad civil incluido.
- **Reserva de precio**: Input de email para guardar la cotizacion por 2 horas con countdown visual.
- CTAs de registro/login despues del resultado.

---

## Tema Visual

- **Dark mode unico** — Sin toggle. La app siempre usa el tema oscuro.
- El componente `ThemeToggle` fue eliminado; no existe `useThemeStore`.
- `tailwind.config.ts` no tiene `darkMode: "class"`.
- Variables CSS en `:root` definen los colores del tema oscuro:
  - Background: `#0F172A` (fy-bg)
  - Surface: `#1E293B` (brand-surface)
  - Card: `#1E3A5F` (brand-card)
  - Text: light gray (fy-text), `#94A3B8` (fy-soft), `#64748B` (fy-dim)
  - Primary: `#0D9488` (brand-teal)
  - Accent: `#F59E0B` (brand-amber)
  - CTA: `#FF6B6B` (brand-coral)
  - Error: `#EF4444` (brand-error)

---

## Modelo de Datos

### Tablas principales

| Tabla | Descripcion |
|-------|-------------|
| `profiles` | Perfil extendido de usuarios (extiende auth.users de Supabase) |
| `drivers` | Perfiles de fleteros: DNI, verificacion, rating, total de viajes |
| `vehicles` | Vehiculos registrados con tipo, capacidad y certificaciones |
| `shipments` | Envios: cliente, fletero asignado, precio, comision, estado, backhaul |
| `shipment_legs` | Tramos individuales (origen/destino por parada) |
| `shipment_driver_applications` | Postulaciones de fleteros con ubicacion GPS |
| `tracking_points` | Puntos GPS en tiempo real (lat, lng, speed, heading) — PostGIS geography |
| `shipment_evidence` | Fotos de evidencia (pickup/delivery) |
| `shipment_chat_messages` | Mensajes del chat en tiempo real con quick tags |
| `shipment_disputes` | Disputas/reclamos con resolucion admin |
| `reviews` | Resenas con rating 1-5 y comentario |
| `payments` | Pagos via MercadoPago con estado, payout y webhook_verified |
| `referral_codes` | Codigos de referido por usuario |
| `referral_redemptions` | Registro de canjes de codigos |
| `push_subscriptions` | Subscripciones a notificaciones push |
| `admin_actions` | Log de auditoria de acciones administrativas |
| `quote_sessions` | Cotizaciones guardadas (sin login) |

### Extensiones PostgreSQL
- **PostGIS** — Consultas geoespaciales (distancia, radio de busqueda)
- **uuid-ossp** — Generacion de UUIDs

### Seguridad de datos
- **Row Level Security (RLS)** en todas las tablas — cada usuario solo ve sus propios datos.
- **Service Role** usado solo en rutas de servidor confiables (asignacion, admin, webhooks).

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

Si el ultimo destino = primer origen (circuito), se suma un bonus del 8%.

### Comision de la plataforma
| Contexto | Comision |
|----------|----------|
| Normal | 22% del precio final |
| Backhaul | 15% (incentivo para retornos) |
| Plan Comercio | 18% |
| Plan Empresa | 15% |

### Costos operativos sobre la comision
- MercadoPago: ~3.4%
- Seguro RC: ~2.5%
- IVA neto: ~3.5%
- IIBB: ~3.5%
- Ganancias: ~5%
- **Margen neto**: ~5% del precio del envio

---

## Seguridad

| Mecanismo | Implementacion |
|-----------|---------------|
| CSRF | Header `X-Requested-With: FleteYa` requerido en POST/PUT/PATCH/DELETE. `apiFetch()` lo agrega automaticamente. |
| Rate Limiting | Upstash Redis en produccion, Map in-memory en dev. Limites por IP y por usuario. |
| CSP | Content-Security-Policy con whitelist de dominios (Supabase, MercadoPago, Google Maps). |
| HSTS | `Strict-Transport-Security` con 1 ano de max-age. |
| Path Traversal | Validacion estricta con regex UUID + decodificacion de percent-encoding en signed URLs. |
| Webhook Auth | HMAC-SHA256 para verificar firmas de webhooks de MercadoPago. |
| Admin Auth | Verificacion directa por email (`david.sadrinas@gmail.com`). Sin query a BD, sin service role. |
| DNI Verification | Requiere aprobacion manual de admin (sin auto-verificacion). |
| Min Rating | Fleteros con rating < 3.0 son filtrados automaticamente de asignaciones. |
| RLS | Row Level Security en todas las tablas de Supabase. |

---

## API Endpoints

### Publicos (sin auth)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/quote` | Cotizacion instantanea |
| POST | `/api/payments/webhook` | Webhook MercadoPago (HMAC auth) |
| GET | `/api/health` | Health check |

### Autenticados (requieren sesion o Bearer token)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET/POST | `/api/shipments` | Listar/crear envios |
| PATCH | `/api/shipments/[id]/status` | Actualizar estado |
| POST | `/api/shipments/[id]/assign` | Asignar fletero |
| GET/POST | `/api/shipments/[id]/applications` | Postulaciones |
| GET/POST | `/api/shipments/[id]/chat` | Chat del envio |
| POST | `/api/shipments/[id]/evidence` | Subir evidencia |
| GET/POST | `/api/shipments/[id]/disputes` | Crear/listar disputas |
| GET/PATCH | `/api/drivers` | Perfil fletero |
| POST | `/api/payments/create` | Crear preferencia MP |
| POST/GET | `/api/tracking` | Enviar/consultar ubicacion GPS |
| GET/POST | `/api/referrals` | Codigos de referido |
| POST/DELETE | `/api/push/subscribe` | Subscripcion push |
| POST | `/api/documents/signed-url` | URL firmada para storage |

### Admin (requieren email admin)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/admin/stats` | Estadisticas de plataforma |
| GET | `/api/admin/shipments` | Todos los envios |
| GET | `/api/admin/drivers` | Todos los fleteros |
| PATCH | `/api/admin/drivers/[id]/verify` | Verificar/rechazar fletero |
| GET | `/api/admin/disputes` | Todas las disputas |
| PATCH | `/api/admin/disputes/[id]` | Resolver disputa |

### Internos (requieren secret)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/push/send` | Enviar push notification |

---

## Logica de Asignacion de Fleteros

El sistema usa estrategias pluggables para asignar fleteros a envios:

### `proximity_then_rating_v1` (default)
1. Calcula "distancia efectiva" de cada candidato al pickup:
   - Si el fletero tiene un envio en curso, usa la distancia desde el destino de ese envio (chain distance).
   - Si no, usa la distancia GPS directa.
2. Agrupa candidatos en bandas de distancia (0-10km, 10-25km, 25-80km).
3. Dentro de cada banda, selecciona el de mejor rating.

### `default_v1`
- Estrategia simple: ordena por rating descendente.

### Filtros previos a la seleccion
- Fleteros con rating < 3.0 (y al menos 1 viaje) son excluidos.
- Solo candidatos verificados y dentro del radio de busqueda (15km).

### Backhaul auto-detection
- Si el fletero asignado tiene un envio en curso cuyo destino esta a <=5km del pickup del nuevo envio, el sistema marca el nuevo envio como `is_backhaul = true`, aplicando la comision reducida (15% vs 22%).

---

## Componentes Clave

### `AddressInput` (`components/address-input.tsx`)
Componente de autocompletado de direcciones con confirmacion en mapa:
- Usa `use-places-autocomplete` para sugerencias de Google Places (restringido a Argentina).
- Dropdown con resultados mientras el usuario escribe (debounce 300ms).
- Al seleccionar, abre un **modal con Google Map** (estilo dark) centrado en la direccion.
- Pin arrastrable para ajustar la ubicacion exacta.
- Botones "Confirmar" y "Cancelar".
- Devuelve direccion + coordenadas al componente padre.
- Wrapper `AddressInputProvider` carga el script de Google Maps con `useJsApiLoader`.

### `ChatPanel` (`components/tracking/chat-panel.tsx`)
Panel de chat en tiempo real entre cliente y fletero con mensajes rapidos predefinidos.

### `EvidencePanel` (`components/tracking/evidence-panel.tsx`)
Panel para subir/ver fotos de evidencia en pickup y delivery.

### `DisputesPanel` (`components/tracking/disputes-panel.tsx`)
Panel para crear y ver disputas con razon, detalle y evidencia.

---

## Tests

El proyecto usa **Vitest** como framework de testing.

### Ejecutar tests
```bash
pnpm test           # Todo el monorepo
pnpm test:web       # 29 suites, 148 tests
pnpm test:shared    # 5 suites, 54 tests
```

### Cobertura de tests

**Shared (54 tests)**:
- Pricing: calcDistanceKm, calcChainDiscount, calcCommission, calcPriceCascade
- Assignment: proximity bands, chain distance, min rating filter, default_v1, proximity_then_rating_v1

**Web API (95+ tests)**:
- Shipment creation, status updates, payment creation
- Rate limiting, quote calculation (multi-leg, chain discounts)
- Referral redemption (self-referral, duplicates, max uses)
- Webhook signature verification (HMAC-SHA256)
- Admin stats authorization (email verification)
- Chat, evidence, disputes routes
- Document signed URLs (UUID path validation)
- Critical flow integration (shipment → payment → status)

**Web Components (50+ tests)**:
- Login page (providers, branding)
- Shipment wizard (steps, navigation)
- Shipment confirmation (calendar, payment)
- Live tracking (active/inactive states, empty state)
- Auth sync, onboarding, driver profile
- Marketing SEO, schemas, stores, hooks, middleware

---

## Rate Limits

| Endpoint | Limite | Ventana |
|----------|--------|---------|
| Quote | 30 | 15 min |
| Webhook | 100 | 1 min |
| Shipment creation | 15 | 15 min |
| Chat | 20 | 1 min |
| Tracking GPS | 240 | 1 min |

---

## Constantes Clave

| Constante | Valor | Descripcion |
|-----------|-------|-------------|
| Centro AMBA | -34.6037, -58.3816 | Buenos Aires |
| Radio busqueda | 15 km | Busqueda general de fleteros |
| Radio backhaul | 5 km | Deteccion automatica de retorno |
| Max tramos | 5 | Por envio |
| Max vehiculos | 5 | Por fletero |
| Max referidos | 50 | Por codigo |
| Payout delay | 48 horas | Despues de aprobacion de pago |
| Min rating | 3.0 | Para ser asignado |
