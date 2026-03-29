# FleteYa - APIs Externas y Servicios de Terceros

Documento de referencia de todas las integraciones externas de la plataforma con instrucciones de configuracion.

---

## Indice

**Servicios core (pre-existentes):**

1. [Supabase (Backend-as-a-Service)](#1-supabase-backend-as-a-service)
2. [Google Maps Platform](#2-google-maps-platform)
3. [Autenticacion OAuth (Google / Facebook)](#3-autenticacion-oauth-google--facebook)
4. [MercadoPago (Procesador de Pagos)](#4-mercadopago-procesador-de-pagos)
5. [Web Push Notifications (VAPID)](#5-web-push-notifications-vapid)
6. [Expo Push Notifications (Mobile)](#6-expo-push-notifications-mobile)
7. [Sentry (Monitoreo de Errores)](#7-sentry-monitoreo-de-errores)
8. [Upstash Redis (Rate Limiting)](#8-upstash-redis-rate-limiting)
9. [Supabase Realtime (Chat y Tracking en Vivo)](#9-supabase-realtime-chat-y-tracking-en-vivo)
10. [Supabase Storage (Documentos e Imagenes)](#10-supabase-storage-documentos-e-imagenes)
11. [Geolocalizacion del Navegador y Expo Location](#11-geolocalizacion-del-navegador-y-expo-location)

**Servicios nuevos (integrados):**

12. [RENAPER / Verificacion de Identidad](#12-renaper--verificacion-de-identidad)
13. [OCR / Procesamiento de Imagenes](#13-ocr--procesamiento-de-imagenes)
14. [Email Transaccional (Resend)](#14-email-transaccional-resend)
15. [Facturacion Electronica AFIP](#15-facturacion-electronica-afip)
16. [WhatsApp Business API](#16-whatsapp-business-api)
17. [Seguro de Carga](#17-seguro-de-carga)
18. [SMS Transaccional (Twilio)](#18-sms-transaccional-twilio)
19. [Calculo de Rutas Reales (Google Directions)](#19-calculo-de-rutas-reales-google-directions)
20. [Analytics (PostHog)](#20-analytics-posthog)
21. [Servicio Unificado de Notificaciones](#21-servicio-unificado-de-notificaciones)

---

## 1. Supabase (Backend-as-a-Service)

**Que es:** Plataforma open-source que provee base de datos PostgreSQL, autenticacion, storage de archivos, funciones serverless y suscripciones en tiempo real.

**Para que lo usamos:** Base de datos PostgreSQL con PostGIS, autenticacion (OAuth + magic link), storage de archivos, realtime (tracking GPS, chat, cambios de estado), Row-Level Security.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Web | Clave publica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Clave anonima (legacy) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Clave admin — **nunca exponer al cliente** |
| `DATABASE_URL` | Server | Conexion directa PostgreSQL |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | URL del proyecto |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Clave anonima |

**Como configurar:** Crear cuenta en [supabase.com](https://supabase.com) → Settings > API → copiar URL, anon key, service_role key. Habilitar PostGIS en Database > Extensions. Ejecutar `pnpm db:migrate`.

---

## 2. Google Maps Platform

**Que es:** Suite de APIs para mapas, geocoding, autocompletado de direcciones y calculo de rutas.

**Para que lo usamos:** Places Autocomplete (restringido a Argentina), Geocoding, mapas interactivos con marcadores arrastrables, Maps SDK nativo mobile.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Web | API Key para Maps JS, Places, Geocoding |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Mobile | API Key para Maps SDK nativo |

**Como configurar:** Google Cloud Console → APIs & Services → habilitar Maps JavaScript API, Places API, Geocoding API, Directions API, Maps SDK Android/iOS → Create API Key → restringir por referrer (web) y package (mobile). Costo: ~$200 USD/mes de credito gratis.

---

## 3. Autenticacion OAuth (Google / Facebook)

**Que es:** Login social via OAuth 2.0 gestionado por Supabase Auth.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | Server | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Server | Client Secret |
| `FACEBOOK_CLIENT_ID` | Server | Client ID de Facebook |
| `FACEBOOK_CLIENT_SECRET` | Server | Client Secret |
| `NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH` | Web | `true` para boton de Facebook |
| `NEXTAUTH_SECRET` | Server | Secret para firmar sesiones |
| `NEXTAUTH_URL` | Web | URL base para callbacks |

**Como configurar Google:** Google Cloud Console → Credentials → OAuth Client ID → agregar redirect URI `https://<proyecto>.supabase.co/auth/v1/callback` → pegar Client ID/Secret en Supabase Dashboard → Authentication → Providers → Google.

**Como configurar Facebook:** Facebook Developers → crear app → Facebook Login → agregar redirect URI → pegar App ID/Secret en Supabase.

---

## 4. MercadoPago (Procesador de Pagos)

**Que es:** Plataforma de pagos lider en Argentina. Soporta tarjetas, transferencias, efectivo, billeteras digitales.

**Para que lo usamos:** Preferencias de pago, webhooks IPN, verificacion HMAC-SHA256, payout scheduling.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `MERCADOPAGO_ACCESS_TOKEN` | Server | Token de acceso |
| `MERCADOPAGO_PUBLIC_KEY` | Server | Clave publica |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Web | Clave publica frontend |
| `MERCADOPAGO_WEBHOOK_SECRET` | Server | Secret HMAC webhooks |

**Como configurar:** MercadoPago Developers → crear aplicacion Checkout Pro → copiar credenciales → configurar webhook URL: `https://tudominio.com/api/payments/webhook`, eventos: `payment`.

**Endpoints:** `POST /api/payments/create`, `POST /api/payments/webhook`

---

## 5. Web Push Notifications (VAPID)

**Para que lo usamos:** Notificaciones push nativas del navegador.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web | Clave publica VAPID |
| `VAPID_PRIVATE_KEY` | Server | Clave privada VAPID |
| `PUSH_SEND_SECRET` | Server | Bearer token interno |

**Como configurar:** `npx web-push generate-vapid-keys` → copiar Public/Private key. Generar PUSH_SEND_SECRET con `openssl rand -base64 32`.

---

## 6. Expo Push Notifications (Mobile)

**Que es:** Push notifications para iOS (APNs) y Android (FCM) via Expo.

**Como configurar:** Android: descargar `google-services.json` de Firebase Console → colocar en `apps/mobile/`. iOS: generar APNs Key en Apple Developer → subir en Expo Dashboard. No requiere variables de entorno adicionales.

---

## 7. Sentry (Monitoreo de Errores)

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Web | Data Source Name |

**Como configurar:** Crear cuenta en [sentry.io](https://sentry.io) → proyecto Next.js → copiar DSN. Se carga lazy, no afecta performance si no se configura.

---

## 8. Upstash Redis (Rate Limiting)

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `UPSTASH_REDIS_REST_URL` | Server | URL REST Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Token de autenticacion |

**Como configurar:** Crear cuenta en [upstash.com](https://upstash.com) → crear base Redis → copiar REST URL y Token. Opcional: sin el, rate limiting funciona in-memory.

---

## 9. Supabase Realtime (Chat y Tracking en Vivo)

**Para que lo usamos:** Tracking GPS en vivo, chat en tiempo real, cambios de estado de envios.

**Como configurar:** No requiere config extra. Verificar Realtime habilitado en Supabase Dashboard → Database → Replication para tablas: `tracking_points`, `shipments`, `shipment_chat_messages`.

---

## 10. Supabase Storage (Documentos e Imagenes)

**Buckets:** `dni-documents` (DNI, licencia, selfie, seguro, VTV), `shipment-evidence` (fotos de retiro/entrega). Crear en Supabase Dashboard → Storage. URLs firmadas expiran en 5 min.

---

## 11. Geolocalizacion del Navegador y Expo Location

**Web:** `navigator.geolocation.watchPosition()` — tracking cada 5 seg, no requiere config.

**Mobile:** `expo-location` con permisos foreground/background. Cola offline para envios sin conexion.

---

## 12. RENAPER / Verificacion de Identidad

**Que es:** Validacion automatica de DNI y licencia de conducir contra bases oficiales via proveedor intermediario (Nosis, 4identity, etc.).

**Para que lo usamos:** Verificar automaticamente identidad del conductor al aprobar en el panel admin. Si el proveedor esta configurado, valida DNI + selfie + datos; si no, el flujo manual sigue funcionando.

**Codigo:** `apps/web/lib/identity/` (patron provider pluggable)

**Tabla:** `identity_verifications` (migracion 011)

**Integracion:** Se ejecuta automaticamente en `PATCH /api/admin/drivers/[id]/verify` cuando `action === "approve"` y se provee `dniNumber`.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `RENAPER_PROVIDER` | Server | `nosis` / `4identity` / `renaper_direct` |
| `RENAPER_API_URL` | Server | URL base de la API del proveedor |
| `RENAPER_API_KEY` | Server | API key |
| `RENAPER_API_SECRET` | Server | API secret (opcional segun proveedor) |

### Como configurar

1. Elegir proveedor:
   - **Nosis** ([nosis.com](https://www.nosis.com)): contactar ventas, solicitar acceso a API de identidad.
   - **4identity**: verificacion biometrica con comparacion facial.
   - **RENAPER directo**: requiere convenio institucional con el estado (~2-3 meses).
2. Obtener credenciales del proveedor → setear `RENAPER_API_URL`, `RENAPER_API_KEY`, `RENAPER_API_SECRET`.
3. Setear `RENAPER_PROVIDER=nosis` (o el nombre del proveedor elegido).
4. Ejecutar migracion: `pnpm db:migrate` (crea tabla `identity_verifications`).
5. **Sin configurar:** el flujo de verificacion de conductor funciona igual que antes (manual por admin).

**Degradacion graceful:** Si `RENAPER_API_KEY` no esta seteada, la verificacion se saltea y el admin aprueba/rechaza manualmente.

---

## 13. OCR / Procesamiento de Imagenes

**Que es:** Extraccion automatica de datos de documentos usando Google Cloud Vision API.

**Para que lo usamos:** OCR de DNI argentino (numero, nombre, vencimiento), licencia de conducir (categoria, vencimiento), poliza de seguro (numero, aseguradora, vigencia). Pre-llena formularios y acelera la verificacion.

**Codigo:** `apps/web/lib/ocr/` (parsers regex por tipo de documento)

**Tabla:** `ocr_extractions` (migracion 011)

**Endpoint:** `POST /api/documents/ocr` (autenticado, rate limited: 20 req / 15 min)

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `GOOGLE_CLOUD_CREDENTIALS_JSON` | Server | JSON de service account en base64 |

### Como configurar

1. En Google Cloud Console (mismo proyecto que Maps), ir a **APIs & Services > Library**.
2. Habilitar **Cloud Vision API**.
3. Ir a **IAM & Admin > Service Accounts** → crear una service account.
4. Descargar el JSON de la key.
5. Codificar en base64:
   ```bash
   cat service-account.json | base64 -w 0
   ```
6. Copiar el resultado → `GOOGLE_CLOUD_CREDENTIALS_JSON`.
7. Instalar dependencia:
   ```bash
   pnpm add @google-cloud/vision --filter @fletaya/web
   ```

**Costo:** $1.50 USD / 1000 imagenes (primeras 1000/mes gratis). ~6 imagenes por conductor.

**Degradacion graceful:** Si `GOOGLE_CLOUD_CREDENTIALS_JSON` no esta seteada, el endpoint devuelve 503 y los documentos se verifican manualmente.

---

## 14. Email Transaccional (Resend)

**Que es:** Envio de emails automaticos para eventos clave del negocio.

**Para que lo usamos:** Bienvenida, confirmacion de envio, fletero asignado, envio entregado, recibo de pago, aprobacion/rechazo de conductor, actualizacion de disputas.

**Codigo:** `apps/web/lib/email/` (index.ts + templates.ts)

**Templates implementados:** `welcomeEmail`, `shipmentConfirmedEmail`, `driverAssignedEmail`, `shipmentDeliveredEmail`, `driverApprovedEmail`, `paymentReceiptEmail`, `disputeUpdateEmail`

**Integracion automatica en:**
- `POST /api/payments/webhook` (pago aprobado → confirmacion + recibo)
- `PATCH /api/admin/drivers/[id]/verify` (aprobado/rechazado → notificacion)
- `PATCH /api/shipments/[id]/status` (delivered → notificacion)

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `RESEND_API_KEY` | Server | API key de Resend |
| `EMAIL_FROM` | Server | Remitente (default: `FleteYa <no-reply@fleteya.com.ar>`) |
| `EMAIL_REPLY_TO` | Server | Reply-to (default: `soporte@fleteya.com.ar`) |

### Como configurar

1. Crear cuenta en [resend.com](https://resend.com).
2. Ir a **Domains > Add Domain** → agregar `fleteya.com.ar`.
3. Agregar los registros DNS que indica Resend (DKIM, SPF, DMARC) en tu DNS.
4. Esperar verificacion (~5 min).
5. Ir a **API Keys** → crear key → copiar a `RESEND_API_KEY`.
6. Instalar:
   ```bash
   pnpm add resend --filter @fletaya/web
   ```

**Costo:** Free tier: 100 emails/dia, 3000/mes. Pro: $20 USD/mes por 50K emails.

**Degradacion graceful:** Sin `RESEND_API_KEY`, los emails se loguean a consola con prefijo `[Email][Dry]`.

---

## 15. Facturacion Electronica AFIP

**Que es:** Emision automatica de Facturas C (monotributo/exento) via web services de AFIP.

**Para que lo usamos:** Emitir factura electronica automaticamente cuando se aprueba un pago. Genera CAE (Codigo de Autorizacion Electronico) oficial.

**Codigo:** `apps/web/lib/billing/` (usa libreria `@afipsdk/afip.js`)

**Tabla:** `invoices` (migracion 011)

**Integracion automatica en:** `POST /api/payments/webhook` — cuando el pago es aprobado, emite factura y guarda CAE.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `AFIP_CUIT` | Server | CUIT de la empresa |
| `AFIP_CERT_PATH` | Server | Path al certificado digital (.crt) |
| `AFIP_KEY_PATH` | Server | Path a la clave privada (.key) |
| `AFIP_ENVIRONMENT` | Server | `testing` o `production` |
| `AFIP_PUNTO_VENTA` | Server | Punto de venta (default: 1) |

### Como configurar

1. **Generar certificado digital:**
   ```bash
   openssl genrsa -out certs/afip.key 2048
   openssl req -new -key certs/afip.key \
     -subj "/C=AR/O=FleteYa/CN=fleteya/serialNumber=CUIT 20XXXXXXXX9" \
     -out certs/afip.csr
   ```
2. Ir a [AFIP con clave fiscal](https://auth.afip.gob.ar/) → **Administracion de Certificados Digitales**.
3. Subir el CSR → descargar el `.crt` emitido.
4. Colocar `afip.crt` y `afip.key` en `apps/web/certs/` (agregar a `.gitignore`).
5. Delegar el web service **wsfe** (Facturacion Electronica) al certificado.
6. Instalar:
   ```bash
   pnpm add @afipsdk/afip.js --filter @fletaya/web
   ```
7. Probar con `AFIP_ENVIRONMENT=testing` primero (homologacion).

**Degradacion graceful:** Sin `AFIP_CUIT`, no se emiten facturas. Los pagos se procesan normalmente.

---

## 16. WhatsApp Business API

**Que es:** API oficial de WhatsApp para enviar notificaciones transaccionales y recibir mensajes.

**Para que lo usamos:** Notificaciones de envio confirmado/entregado, aprobacion de conductor, recibo de pago. Canal #1 en Argentina por tasa de lectura.

**Codigo:** `apps/web/lib/whatsapp/`

**Endpoint webhook:** `GET/POST /api/whatsapp/webhook` (verificacion Meta + mensajes entrantes)

**Integracion automatica:** Se dispara via el servicio unificado de notificaciones junto con email/push.

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `WHATSAPP_PHONE_NUMBER_ID` | Server | ID del numero de WhatsApp Business |
| `WHATSAPP_ACCESS_TOKEN` | Server | Token permanente de la app |
| `WHATSAPP_VERIFY_TOKEN` | Server | Token para verificar webhook |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Server | ID de la cuenta Business |

### Como configurar

1. Crear una **Meta Business App** en [developers.facebook.com](https://developers.facebook.com/).
2. Agregar el producto **WhatsApp**.
3. En **WhatsApp > Getting Started**:
   - Agregar numero de telefono de negocio
   - Copiar **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - Generar **Permanent Token** → `WHATSAPP_ACCESS_TOKEN`
4. Configurar **Webhook**:
   - URL: `https://tudominio.com/api/whatsapp/webhook`
   - Verify Token: un string secreto → `WHATSAPP_VERIFY_TOKEN`
   - Suscribirse a: `messages`
5. Crear **Message Templates** (requieren aprobacion de Meta, ~24-48hs):
   - `shipment_confirmed`: "Hola {{1}}, tu envio #{{2}} fue confirmado. Monto: ${{3}}"
   - `shipment_delivered`: "Tu envio #{{1}} fue entregado. Monto: ${{2}}"
   - `driver_approved`: "Felicitaciones {{1}}, tu cuenta de fletero fue aprobada"
   - `payment_receipt`: "Recibimos tu pago de ${{1}} por el envio #{{2}}"

**Costo:** Conversaciones de utilidad: ~$0.03 USD/conversacion en Argentina. Primeras 1000 conversaciones de servicio gratis/mes.

**Degradacion graceful:** Sin `WHATSAPP_ACCESS_TOKEN`, los mensajes se loguean a consola con `[WhatsApp][Dry]`.

---

## 17. Seguro de Carga

**Que es:** Cotizacion y contratacion de seguro de carga por envio.

**Para que lo usamos:** Ofrecer al cliente la opcion de asegurar su carga. Soporta proveedor externo (Clupp, Sancor, etc.) o calculo interno con tarifas fijas.

**Codigo:** `apps/web/lib/insurance/`

**Tabla:** `cargo_insurance_policies` (migracion 011)

**Endpoint:** `POST /api/insurance/quote` (publico, rate limited: 30 req / 15 min)

**Tarifas internas (sin proveedor):**
- basic: 1.5% del valor declarado (minimo $500 ARS)
- full: 3%
- fragile: 5%

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `CARGO_INSURANCE_PROVIDER` | Server | `internal` / `clupp` / nombre del proveedor |
| `CARGO_INSURANCE_API_URL` | Server | URL de la API del proveedor |
| `CARGO_INSURANCE_API_KEY` | Server | API key del proveedor |
| `CARGO_INSURANCE_COMMISSION_RATE` | Server | Comision por venta (default: 10%) |

### Como configurar

**Con proveedor externo:**
1. Contactar al proveedor (Clupp, Sancor, Federacion Patronal, etc.) para obtener acceso API.
2. Copiar credenciales → `CARGO_INSURANCE_API_URL`, `CARGO_INSURANCE_API_KEY`.
3. Setear `CARGO_INSURANCE_PROVIDER` con el nombre del proveedor.

**Sin proveedor externo:**
- No se necesita configurar nada. Funciona con tarifas internas.
- La cotizacion se calcula automaticamente basada en el valor declarado y tipo de cobertura.

---

## 18. SMS Transaccional (Twilio)

**Que es:** Envio de SMS como fallback de notificaciones cuando push y WhatsApp no estan disponibles.

**Para que lo usamos:** Notificaciones criticas cuando el usuario no tiene push ni WhatsApp. Se dispara como ultimo recurso via el servicio unificado de notificaciones.

**Codigo:** `apps/web/lib/sms/`

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | Server | Account SID |
| `TWILIO_AUTH_TOKEN` | Server | Auth Token |
| `TWILIO_PHONE_NUMBER` | Server | Numero de Twilio (E.164: `+5491100000000`) |

### Como configurar

1. Crear cuenta en [twilio.com](https://www.twilio.com/).
2. Ir a **Console > Account Info** → copiar **Account SID** y **Auth Token**.
3. **Phone Numbers > Buy a Number** → comprar numero argentino (+54).
4. Copiar numero → `TWILIO_PHONE_NUMBER`.
5. Instalar:
   ```bash
   pnpm add twilio --filter @fletaya/web
   ```

**Costo:** ~$0.07 USD por SMS a Argentina. Numero: ~$1 USD/mes.

**Degradacion graceful:** Sin `TWILIO_ACCOUNT_SID`, los SMS se loguean a consola con `[SMS][Dry]`.

---

## 19. Calculo de Rutas Reales (Google Directions)

**Que es:** Calculo de distancia real por ruta (no linea recta) y tiempo estimado de viaje usando Google Directions API.

**Para que lo usamos:** Cotizaciones mas precisas. Reemplaza el calculo Haversine * 1.3 con distancias reales. Tambien calcula ETA y devuelve polyline para dibujar la ruta en el mapa.

**Codigo:** `apps/web/lib/routes/`

**Integracion automatica en:** `POST /api/quote` — para cada leg, primero intenta ruta real; si falla, cae a Haversine * 1.3 (factor de correccion).

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `GOOGLE_DIRECTIONS_API_KEY` | Server | API Key sin restriccion de referrer |

### Como configurar

1. En Google Cloud Console (mismo proyecto que Maps), habilitar **Directions API**.
2. Crear una API key **sin restriccion de HTTP referrer** (para uso server-side).
3. Restringir esa key por IP del servidor si es posible.
4. Copiar → `GOOGLE_DIRECTIONS_API_KEY`.
5. Si no se configura, se usa `NEXT_PUBLIC_GOOGLE_MAPS_KEY` como fallback.

**Costo:** $5.00 USD / 1000 requests. Cada cotizacion de 3 paradas = 3 requests = ~$0.015 USD. Con $200 USD de credito gratis: ~40K cotizaciones/mes.

**Degradacion graceful:** Sin API key configurada, el quote sigue usando `calcDistanceKm()` (Haversine) con factor de correccion 1.3x y ETA estimado a 30 km/h promedio AMBA.

---

## 20. Analytics (PostHog)

**Que es:** Product analytics open source con event tracking, funnels, session replay y feature flags.

**Para que lo usamos:** Tracking de funnel de conversion (visita → cotizacion → registro → envio), metricas de engagement, server-side events para pagos y entregas.

**Codigo:**
- `apps/web/lib/analytics/index.ts` — client-side (lazy-loaded `posthog-js`)
- `apps/web/lib/analytics/server.ts` — server-side (HTTP API directo)
- `apps/web/components/analytics-provider.tsx` — Next.js provider con pageview tracking

**Integracion:**
- `AnalyticsProvider` en `apps/web/app/(app)/layout.tsx` — pageviews automaticos
- Server events en `payments/webhook` (`payment_completed`) y `shipments/[id]/status` (`shipment_delivered`)

**Eventos clave trackeados:**
| Evento | Origen | Properties |
|--------|--------|------------|
| `$pageview` | Client (auto) | URL |
| `payment_completed` | Server (webhook) | amount, paymentType, shipmentId |
| `shipment_delivered` | Server (status) | shipmentId |

| Variable | Entorno | Descripcion |
|----------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Web | Project API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Web | Host (default: `https://us.i.posthog.com`) |

### Como configurar

1. Crear cuenta en [posthog.com](https://posthog.com) (o self-host con Docker).
2. Crear proyecto → copiar **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`.
3. Copiar **Host** → `NEXT_PUBLIC_POSTHOG_HOST`.
4. Instalar:
   ```bash
   pnpm add posthog-js --filter @fletaya/web
   ```

**Costo:** Free tier: 1M eventos/mes, session replay, feature flags. Self-hosted: gratis.

**Degradacion graceful:** Sin `NEXT_PUBLIC_POSTHOG_KEY`, no se trackea nada. No afecta performance.

---

## 21. Servicio Unificado de Notificaciones

**Que es:** Dispatcher central que envia notificaciones por el mejor canal disponible.

**Para que lo usamos:** Punto unico para disparar notificaciones multi-canal. Cada evento intenta todos los canales configurados en orden de prioridad y loguea el resultado.

**Codigo:** `apps/web/lib/notifications/index.ts`

**Tabla:** `notification_log` (migracion 011) — registro de todos los envios con canal, estado, errores.

**Orden de canales:**
1. **Push** — siempre se intenta primero (via `/api/push/send`)
2. **WhatsApp** — si tiene telefono y `WHATSAPP_ACCESS_TOKEN` esta configurado
3. **Email** — si tiene email y `RESEND_API_KEY` esta configurado
4. **SMS** — solo si ningun otro canal tuvo exito (fallback)

**No requiere configuracion propia** — usa las credenciales de cada servicio individual (Push, WhatsApp, Email, SMS).

---

## Resumen de Servicios

| # | Servicio | Estado | Degradacion sin config |
|---|----------|--------|------------------------|
| 1 | Supabase | Obligatorio | App no funciona |
| 2 | Google Maps | Obligatorio | Sin mapas ni autocomplete |
| 3 | OAuth Google/Facebook | Obligatorio | Sin login social |
| 4 | MercadoPago | Obligatorio | Sin cobros |
| 5 | Web Push (VAPID) | Opcional | Sin push browser |
| 6 | Expo Push | Opcional | Sin push mobile |
| 7 | Sentry | Opcional | Errores solo en consola |
| 8 | Upstash Redis | Opcional | Rate limiting in-memory |
| 9 | Supabase Realtime | Incluido | N/A (parte de Supabase) |
| 10 | Supabase Storage | Incluido | N/A (parte de Supabase) |
| 11 | Geolocalizacion | Nativo | N/A (API del navegador) |
| 12 | **RENAPER** | **Integrado** | Verificacion manual por admin |
| 13 | **OCR** | **Integrado** | Endpoint devuelve 503 |
| 14 | **Email (Resend)** | **Integrado** | Emails logueados a consola |
| 15 | **AFIP** | **Integrado** | No se emiten facturas |
| 16 | **WhatsApp** | **Integrado** | Mensajes logueados a consola |
| 17 | **Seguro de Carga** | **Integrado** | Tarifas internas (sin aseguradora) |
| 18 | **SMS (Twilio)** | **Integrado** | SMS logueados a consola |
| 19 | **Rutas Reales** | **Integrado** | Haversine * 1.3 (fallback) |
| 20 | **Analytics (PostHog)** | **Integrado** | Sin tracking |
| 21 | **Notificaciones** | **Integrado** | Usa canales disponibles |

## Dependencias Nuevas

```bash
pnpm add resend @afipsdk/afip.js twilio posthog-js @google-cloud/vision --filter @fletaya/web
```

## Migracion de Base de Datos

```bash
# Ejecutar la migracion 011 que crea todas las tablas nuevas:
pnpm db:migrate
```

Tablas creadas: `identity_verifications`, `invoices`, `cargo_insurance_policies`, `ocr_extractions`, `notification_log`. Columnas agregadas a `drivers` y `shipments`.
