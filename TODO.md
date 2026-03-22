# FleteYa — TODO / Pendientes

Estado: 🔴 No iniciado | 🟡 En progreso | 🟢 Completado

---

## Fase 0: Setup del Proyecto
- 🟢 Definir arquitectura (monorepo, stack, servicios)
- 🟢 Crear estructura de carpetas
- 🟢 Documentar modelo financiero e impositivo
- 🟢 Diseñar interfaz interactiva completa
- 🟢 Definir flujos de usuario (cliente + fletero)
- 🔴 Crear proyecto en Supabase
- 🔴 Crear proyecto en Vercel
- 🔴 Configurar repositorio en GitHub
- 🔴 Configurar pnpm workspaces
- 🔴 Setup de ESLint + Prettier + Husky

## Fase 1: Web — Landing / Marketing
- 🟡 Landing page (hero, propuesta de valor, cómo funciona)
- 🔴 Sección "Para Fleteros" (beneficios, registro)
- 🔴 Reviews / Testimonials
- 🔴 Pricing / Comisiones transparentes
- 🔴 FAQ
- 🔴 Footer con links legales
- 🔴 Navbar responsive con CTA
- 🔴 SEO: meta tags, OG images, sitemap
- 🔴 Analytics: Google Analytics / Plausible
- 🔴 Blog / Novedades (opcional para SEO)

## Fase 2: Auth y Onboarding
- 🔴 Supabase Auth setup
- 🔴 Login con Google (OAuth)
- 🔴 Login con Facebook (OAuth)
- 🔴 Login con Instagram (OAuth)
- 🔴 Login con email + magic link
- 🔴 Onboarding flow cliente (nombre, teléfono)
- 🔴 Onboarding flow fletero (datos + primer vehículo)
- 🔴 Middleware de auth en rutas protegidas
- 🔴 Roles: client / driver / admin

## Fase 3: Base de Datos
- 🔴 Migración: tabla users (profile extendido)
- 🔴 Migración: tabla drivers (verificación, docs)
- 🔴 Migración: tabla vehicles
- 🔴 Migración: tabla shipments + shipment_legs
- 🔴 Migración: tabla tracking_points (PostGIS)
- 🔴 Migración: tabla reviews
- 🔴 Migración: tabla payments
- 🔴 Row Level Security (RLS) policies
- 🔴 Seed data para desarrollo
- 🔴 Habilitar extensión PostGIS

## Fase 4: Web App — Flujo del Cliente
- 🔴 Dashboard / Home (viajes activos, retornos disponibles)
- 🔴 Wizard de nuevo envío — Paso 1: Ruta (Google Places autocomplete)
- 🔴 Wizard de nuevo envío — Paso 2: Carga (tipo, peso, vehículo)
- 🔴 Wizard de nuevo envío — Paso 3: Elegir fletero (matching)
- 🔴 Wizard de nuevo envío — Paso 4: Confirmación y pago
- 🔴 Integración Google Maps (mapa interactivo con ruta)
- 🔴 Multi-tramo con descuentos encadenados (SmartRoute Engine)
- 🔴 Tracking GPS en vivo (Supabase Realtime)
- 🔴 Chat con fletero (Supabase Realtime)
- 🔴 Historial de viajes
- 🔴 Sistema de reviews post-viaje

## Fase 5: Web App — Flujo del Fletero
- 🔴 Panel del fletero (estadísticas, viajes pendientes)
- 🔴 Verificación de DNI (upload frente + dorso + selfie)
- 🔴 Upload de licencia de conducir
- 🔴 Upload de seguro del vehículo
- 🔴 Upload de VTV
- 🔴 Gestión de vehículos (CRUD, seleccionar activo)
- 🔴 Aceptar/rechazar viajes
- 🔴 Oportunidades de retorno (backhaul)
- 🔴 Historial + estadísticas de ingresos
- 🔴 Compartir ubicación GPS

## Fase 6: Pagos
- 🔴 Integración MercadoPago Marketplace (split payments)
- 🔴 Checkout con tarjeta, QR, débito
- 🔴 Webhook de confirmación de pago
- 🔴 Liquidación al fletero (24-48hs)
- 🔴 Historial de pagos y facturas
- 🔴 Retenciones impositivas automáticas

## Fase 7: Notificaciones
- 🔴 Email transaccional (confirmación, viaje aceptado, completado)
- 🔴 Integración .ics para calendario (Google, Apple, Outlook)
- 🔴 Push notifications (Expo + FCM)
- 🔴 WhatsApp Business API (opcional)

## Fase 8: App Mobile (React Native + Expo)
- 🔴 Setup Expo con Expo Router
- 🔴 Pantalla de login (social + email)
- 🔴 Home del cliente
- 🔴 Wizard de nuevo envío
- 🔴 Integración Google Maps nativa
- 🔴 Tracking GPS en vivo
- 🔴 Panel del fletero
- 🔴 Verificación de DNI con cámara nativa
- 🔴 Push notifications
- 🔴 Deep linking (web → app)

## Fase 9: SmartRoute Engine
- 🔴 Algoritmo de matching fletero-carga
- 🔴 Geofencing dinámico para oportunidades de retorno
- 🔴 Scoring de compatibilidad (ruta, capacidad, tiempo)
- 🔴 Pricing dinámico con descuentos por cadena
- 🔴 Bonus de circuito (vuelve al origen)
- 🔴 Filtro por tipo de vehículo especializado (grúa, atmosférico)

## Fase 9B: Acarreo de Vehículos
- 🔴 Flujo específico: cliente ingresa marca/modelo/patente del vehículo
- 🔴 Selección de motivo (avería, compra/venta, traslado)
- 🔴 Matching solo con grúas / camiones plancha habilitados
- 🔴 Documentación del vehículo transportado (fotos pre/post carga)
- 🔴 Acta de estado del vehículo (rayaduras, golpes) con firma digital
- 🔴 Seguro específico de transporte vehicular
- 🔴 Verificación de habilitación de grúa del prestador

## Fase 9C: Camiones Atmosféricos / Limpieza / Residuos
- 🔴 Flujo específico: tipo de residuo, volumen estimado, origen
- 🔴 Matching solo con atmosféricos habilitados
- 🔴 Verificación de Certificado Ambiental (Ley 24.051) — renovación anual
- 🔴 Verificación de habilitación sanitaria municipal
- 🔴 Verificación de certificado de formación profesional del chofer
- 🔴 Manifiesto de transporte de residuos (generación automática)
- 🔴 Registro de destino de descarga (planta habilitada)
- 🔴 Libreta de viajes digital (requerida por normativa)
- 🔴 Trazabilidad completa: origen → transporte → disposición final
- 🔴 Alertas de vencimiento de certificados

## Fase 10: Admin Panel
- 🔴 Dashboard de métricas (GMV, viajes, retornos)
- 🔴 Verificación manual de fleteros
- 🔴 Gestión de disputas
- 🔴 Reportes financieros
- 🔴 Configuración de comisiones

## Fase 11: Legal y Compliance
- 🔴 Términos y Condiciones (redacción legal)
- 🔴 Política de Privacidad (Ley 25.326)
- 🔴 Contrato de adhesión fleteros
- 🔴 Constitución de SAS
- 🔴 Alta en ARCA (IVA, Ganancias, IIBB)
- 🔴 Contratación de seguro RC (Res. 589/2025 SSN)
- 🔴 Registro como agente de percepción

## Fase 12: Go-to-Market
- 🔴 Reclutamiento de 200 fleteros iniciales
- 🔴 Campaña de Instagram/TikTok
- 🔴 Google Ads (keywords de flete)
- 🔴 Partnerships con inmobiliarias
- 🔴 Programa de referidos
- 🔴 PR en medios tech/emprendedores

---

## Decisiones Técnicas Pendientes
- [ ] ¿Usar tRPC o REST para la API?
- [ ] ¿React Query o SWR para data fetching?
- [ ] ¿Tailwind o CSS Modules en la web?
- [ ] ¿NativeWind o StyleSheet en mobile?
- [ ] ¿Resend o SendGrid para emails transaccionales?
- [ ] ¿Stripe como alternativa/complemento a MercadoPago?

## Métricas de Éxito (Fase 1)
- [ ] 200+ fleteros registrados pre-lanzamiento
- [ ] 500+ viajes/mes en mes 3
- [ ] >30% tasa de retorno (backhaul) en mes 6
- [ ] NPS >50 en clientes
- [ ] CAC < ARS 5.000
