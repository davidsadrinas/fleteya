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
│   └── supabase/        → Migraciones SQL, seeds y scripts de BD
```

### Stack Tecnologico

| Capa | Tecnologia | Para que |
|------|-----------|----------|
| Frontend Web | Next.js 14 (App Router) | Landing pages + app autenticada |
| Frontend Mobile | React Native + Expo 52 | App nativa iOS/Android |
| Backend/API | Next.js API Routes | Endpoints REST |
| Base de datos | Supabase (PostgreSQL + PostGIS) | Datos + consultas geoespaciales |
| Autenticacion | Supabase Auth | Google, Facebook, Email magic link |
| Storage | Supabase Storage | Fotos DNI, vehiculos, evidencia |
| Pagos | MercadoPago | Cobro a clientes, split payout a fleteros |
| Mapas | Google Maps Platform | Autocomplete, direcciones, tracking |
| Real-time | Supabase Realtime | GPS tracking en vivo, chat, disputas |
| Push Notifications | Web Push (VAPID) + Expo Notifications | Alertas en web y mobile |
| Rate Limiting | Upstash Redis (prod) + in-memory (dev) | Proteccion contra abuso |
| Hosting Web | Vercel | Deploy automatico |
| Hosting Mobile | Expo EAS | Build y publicacion |
| Error Tracking | Sentry (opcional) | Monitoreo de errores |

---

## Modulos y Funcionalidades

### 1. Flujo del Cliente

1. **Cotizacion sin registro** (`/cotizar`) — El cliente pone origen, destino y tipo de envio. El sistema calcula precio al instante con descuentos por multiples paradas.

2. **Creacion de envio** (`POST /api/shipments`) — Con login, crea el envio con 1-5 tramos. El servidor calcula precio, comision y descuentos por cadena.

3. **Pago** (`POST /api/payments/create`) — Genera preferencia de MercadoPago. El cliente paga via checkout de MP. Un webhook (`POST /api/payments/webhook`) confirma el pago y auto-acepta el envio.

4. **Tracking en vivo** (`/tracking`) — Mapa con posicion GPS del fletero en tiempo real via Supabase Realtime. Chat integrado, evidencia fotografica y sistema de disputas.

5. **Resenas** — Al finalizar, el cliente califica al fletero (1-5 estrellas + comentario).

### 2. Flujo del Fletero (Mobile)

1. **Registro y verificacion** — Sube DNI (frente/dorso) + selfie. Un admin revisa y aprueba manualmente desde el panel de admin.

2. **Vehiculos** — Registra 1+ vehiculos (moto, auto, camioneta, camion, etc.) con fotos y certificaciones (cargas peligrosas, materiales fragiles, etc.).

3. **Busqueda de envios** — Ve envios disponibles cerca suyo. Puede postularse a los que le interesen.

4. **Asignacion automatica** — Al postularse, el sistema puede auto-asignar basandose en cercania (bandas de distancia) y rating del fletero. Fleteros con rating < 3.0 son filtrados.

5. **Tracking activo** — La app mobile envia ubicacion GPS cada pocos segundos mientras esta en un envio activo. Incluye batch/flush para optimizar red.

6. **Chat y evidencia** — Chatea con el cliente, sube fotos de evidencia en pickup y delivery.

### 3. Panel de Administracion

- **Dashboard** (`/admin`) — Estadisticas de la plataforma (envios, ingresos, fleteros).
- **Gestion de fleteros** (`/admin/drivers`) — Lista de fleteros, verificacion/rechazo de documentos con auditoria.
- **Gestion de disputas** (`/admin/disputes`) — Revisa y resuelve disputas entre clientes y fleteros.
- **Gestion de envios** (`/admin/shipments`) — Vista general de todos los envios con filtros.

### 4. Sistema de Referidos

- Cada usuario obtiene un codigo unico de referido.
- Al compartirlo, el referido y el referente ganan $500 ARS.
- Limite de 50 usos por codigo. Previene auto-referidos y duplicados.

### 5. Notificaciones Push

- **Web**: Service worker (`sw.js`) con VAPID keys para Web Push API.
- **Mobile**: Expo Notifications + FCM.
- El usuario puede activar/desactivar desde configuracion.

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
| `tracking_points` | Puntos GPS en tiempo real (lat, lng, speed, heading) |
| `shipment_evidence` | Fotos de evidencia (pickup/delivery) |
| `shipment_chat_messages` | Mensajes del chat en tiempo real |
| `shipment_disputes` | Disputas/reclamos con resolucion admin |
| `reviews` | Resenas con rating 1-5 |
| `payments` | Pagos via MercadoPago con estado y payout programado |
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
- **Normal**: 22% del precio final
- **Backhaul**: 15% (incentivo para retornos)

### Costos operativos sobre la comision
- MercadoPago: ~3.4%
- Seguro RC: ~2.5%
- IVA neto: ~3.5%
- IIBB: ~3.5%
- Ganancias: ~5%

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
| Admin Auth | Verificacion de rol via service role (bypass RLS) para prevenir escalamiento de privilegios. |
| DNI Verification | Requiere aprobacion manual de admin (sin auto-verificacion). |
| Min Rating | Fleteros con rating < 3.0 son filtrados automaticamente de asignaciones. |

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
| POST | `/api/shipments/[id]/disputes` | Crear disputa |
| GET/POST | `/api/drivers` | Perfil fletero |
| POST | `/api/payments/create` | Crear preferencia MP |
| POST | `/api/tracking` | Enviar ubicacion GPS |
| GET/POST | `/api/referrals` | Codigos de referido |
| POST/DELETE | `/api/push/subscribe` | Subscripcion push |
| POST | `/api/documents/signed-url` | URL firmada para storage |

### Admin (requieren rol admin)
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
2. Agrupa candidatos en bandas de distancia (0-5km, 5-10km, 10-15km).
3. Dentro de cada banda, selecciona el de mejor rating.

### `default_v1`
- Estrategia simple: ordena por rating descendente.

### Filtros previos a la seleccion
- Fleteros con rating < 3.0 (y al menos 1 viaje) son excluidos.
- Solo candidatos verificados y dentro del radio de busqueda (15km).

### Backhaul auto-detection
- Si el fletero asignado tiene un envio en curso cuyo destino esta a <=5km del pickup del nuevo envio, el sistema marca el nuevo envio como `is_backhaul = true`, aplicando la comision reducida (15% vs 22%).

---

## Tests

El proyecto usa **Vitest** como framework de testing.

### Ejecutar tests
```bash
# Todos los tests del monorepo
pnpm test

# Solo un workspace
pnpm test:web
pnpm test:shared
pnpm test:mobile

# Con watch mode
cd apps/web && pnpm test:watch

# Con coverage
pnpm test:coverage
```

### Cobertura de tests
- **Shared**: Pricing (calcDistanceKm, calcChainDiscount, calcCommission, calcPriceCascade), assignment strategies (proximity bands, chain distance, min rating filter).
- **Web API**: Shipment creation, payment creation, rate limiting, quote calculation, referral redemption, webhook signature verification, admin stats authorization.
