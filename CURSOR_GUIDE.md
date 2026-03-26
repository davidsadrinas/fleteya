# FleteYa — Guía de Implementación para Cursor

Este archivo contiene instrucciones paso a paso para completar el desarrollo del proyecto.
Cada sección es un prompt que podés copiar y pegar en Cursor para que implemente esa funcionalidad.
Seguí el orden — cada paso depende del anterior.

**Progreso:** PASO 1–2 (Auth + onboarding post-registro) en código · PASO 7 parcial (tema oscuro manual PDF, sin toggle). Continuar con PASO 3 (dashboard cliente).

---

## Obligatorio en cada implementación (no lo omitas)

Toda feature o fix que toque lógica, UI, rutas, API o base de datos debe incluir **tests** y pasar **lint** antes de dar por cerrada la tarea.

1. **Tests (Vitest en `apps/web`)**  
   - **Unit:** utilidades, `lib/auth/*`, `lib/onboarding/*`, stores, schemas Zod, parsers.  
   - **Integración:** API routes, `middleware`, `app/auth/callback`, servicios que armen request/response.  
   - **Componentes (RTL):** pantallas críticas (`login`, onboarding, forms) con mocks de Supabase / `next/navigation`.  
   - Ubicación: `apps/web/__tests__/**` (mirá archivos existentes como referencia).  
   - Comando: desde la raíz del monorepo **`pnpm test:web`** (o **`pnpm test`** para todos los workspaces que tengan script `test`).

2. **Lint**  
   - **`pnpm lint`** desde la raíz (cada package con script `lint`).  
   - Corregí errores de ESLint en los archivos que modifiques; no acumules deuda en el mismo PR/cambio.

3. **Al pedir un paso a Cursor / Claude**  
   Copiá y pegá al final del prompt:  
   *“Incluí o actualizá tests (unit / integración / RTL según aplique) y verificá que `pnpm test:web` y `pnpm lint` pasen.”*

Incumplir esto es considerado trabajo incompleto.

---

## Login con redes sociales (recordatorio para implementadores)

| Método | UI en `/login` | Configuración |
|--------|----------------|---------------|
| **Google** | Siempre visible (“Continuar con Google”) | Supabase → Authentication → Providers → Google (Client ID/Secret). Redirect OAuth en Google: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`. |
| **Email (magic link)** | Siempre | Mismo menú Providers → Email; en **dev** conviene desactivar “Confirm email” (ver PASO 0 §2b). |
| **Facebook** | **Oculto por defecto** | Activar en **`apps/web/.env` / Vercel:** `NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH=true`, y el provider en Supabase + Meta (misma callback URL que Google). |
| **Instagram u otras redes** | A futuro | Mismo patrón que Facebook: feature flag + provider en Supabase cuando exista soporte; no asumir que están activos sin env + dashboard. |

**URLs:** Site URL y “Additional Redirect URLs” deben incluir `{origin}/auth/callback` (local y producción). Detalle paso a paso: **PASO 0 §2b** y `apps/web/.env.example`.

---

## Herramientas de asistencia (Cursor + Claude Code)

- **Cursor:** ya usá `.cursorrules` y las reglas en **`.cursor/rules/`** (tests, lint, revisión). El agente las toma en cada sesión según `alwaysApply` / globs.  
- **Claude Code:** podés **importar o reutilizar la misma política**: pegá el contenido de `.cursorrules` y de las reglas de `.cursor/rules/` en las instrucciones del proyecto, o instalá **Skills** del marketplace orientados a *code review*, *lint*, *TypeScript* — y exigí explícitamente: *“seguí CURSOR_GUIDE.md y corré `pnpm test:web` + `pnpm lint`”*.  
- Objetivo: misma barra de calidad en ambos entornos (tests nuevos por feature, sin romper el build).

---

## PASO 0: Setup inicial (hacelo vos, no Cursor)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear proyecto en Supabase (supabase.com)
#    - Nombre: fletaya
#    - Region: South America (São Paulo)
#    - Copiar URL y keys

# 2b. Activar proveedores de Auth (la web usa Google y magic link por email; Facebook u otras redes son opcionales)
#    Dashboard → Authentication → Providers:
#
#    Google (recomendado si usás el botón "Continuar con Google"):
#    - Activar el provider.
#    - Client ID y Client Secret desde Google Cloud Console (APIs y servicios → Credenciales →
#      ID de cliente OAuth / aplicación web).
#    - En Google, "URI de redirección autorizados": agregar exactamente
#      https://<PROJECT_REF>.supabase.co/auth/v1/callback
#      (PROJECT_REF está en Settings → General → Reference ID del proyecto Supabase).
#
#    Facebook (opcional; el botón en /login está oculto salvo que actives el flag en env):
#    - En apps/web/.env.local: NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH=true (y en Vercel si aplica).
#    - Activar el provider en Supabase y pegar App ID + Secret desde Meta for Developers.
#    - En Facebook, "Valid OAuth Redirect URIs": la misma URL
#      https://<PROJECT_REF>.supabase.co/auth/v1/callback
#    - Otras redes (ej. Instagram) pueden sumarse después con flags similares en código.
#
#    Email (magic link):
#    - Activar el provider y el envío del magic link / OTP por correo.
#    - Desarrollo local: desactivá "Confirm email" (o equivalente: no exigir confirmación
#      antes de iniciar sesión) para que el enlace del mail te deje entrar al toque.
#      En producción podés volver a exigir email confirmado según tu política.
#
#    Authentication → URL configuration:
#    - Site URL: http://localhost:3000 en dev; en prod tu dominio (ej. https://fletaya.vercel.app).
#    - Additional Redirect URLs: incluí http://localhost:3000/auth/callback y las URLs de prod
#      (Supabase valida el redirect después del OAuth/magic link).

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local con tus keys de Supabase

# 4. Correr las migraciones SQL
# En Supabase Dashboard → SQL Editor → ejecutar en orden:
# packages/supabase/migrations/001_initial.sql
# packages/supabase/migrations/002_driver_insert_policy.sql (onboarding fletero: INSERT en drivers)
# packages/supabase/migrations/003_shipment_driver_applications.sql (postulaciones + asignación)
# packages/supabase/migrations/004_last_leg_dest_coords.sql (encadenados: destino último tramo)

# 5. Habilitar PostGIS en Supabase
# Database → Extensions → buscar "postgis" → activar

# 6. Crear buckets en Supabase Storage:
# - dni-documents (private)
# - vehicle-photos (public)
# - avatars (public)

# 7. Verificar que corre
pnpm dev:web
# Abrir http://localhost:3000

# 8. Calidad (obligatorio antes de commitear cambios de código)
pnpm lint
pnpm test:web
# Opcional: todo el monorepo con tests definidos
# pnpm test
```

---

## PASO 1: Auth con Supabase

Prompt para Cursor:
```
Implementá autenticación con Supabase Auth en el proyecto.

Archivos a crear/modificar:
- apps/web/app/(app)/layout.tsx → agregar auth guard que redirija a /login si no hay sesión
- apps/web/app/login/page.tsx → pantalla de login con Google, email; Facebook opcional vía NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH
- apps/web/lib/hooks/index.ts → ya tiene useSession, verificá que funcione
- apps/web/middleware.ts → middleware de Next.js para proteger rutas (app)/*

Contexto:
- Supabase client está en lib/supabase-client.ts (browser) y lib/supabase-server.ts (server)
- El store de auth está en lib/stores/index.ts (useAuthStore)
- Los providers de auth (Google, Facebook) se configuran en Supabase Dashboard
- Para desarrollo, usar email con "Confirm email" desactivado
- Los colores del brand están en tailwind.config.ts (brand-coral para botones, brand-forest para textos)
- Tipografía: Bricolage Grotesque para títulos, Work Sans para subtítulos, Instrument Sans para body
- El login debe tener el logo "flete" en charcoal + "ya" en coral
- Después del login, redirigir a /(app)/dashboard
- Tests: middleware, callback, path-utils, login (RTL), feature flag Facebook; ejecutar pnpm test:web
```

---

## PASO 2: Onboarding post-registro

Prompt para Cursor:
```
Creá el flujo de onboarding que aparece después del primer login.

Archivos a crear:
- apps/web/app/onboarding/page.tsx → formulario de 2 pasos

Paso 1: Datos personales
- Nombre completo (input)
- Teléfono (input con formato argentino)
- Rol: "Necesito un flete" (client) o "Soy fletero" (driver) → botones grandes

Paso 2 (solo si eligió driver):
- Datos del primer vehículo (marca, modelo, año, patente, tipo)
- Usar createVehicleSchema de lib/schemas/index.ts para validar
- Tipos disponibles: moto, utilitario, camioneta, camion, grua, atmosferico

Al completar:
- Actualizar el profile en Supabase (tabla profiles: name, phone, role)
- Si es driver, crear registro en tabla drivers + primer vehículo en tabla vehicles
- Redirigir a /(app)/dashboard

Validación con Zod: usar onboardingSchema y createVehicleSchema de lib/schemas/index.ts
Estilos: brand manual (cream bg, coral buttons, forest text)

Tests: lib/onboarding/status, middleware /onboarding, migración 002 aplicada en Supabase; RTL opcional para la página de onboarding.
Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO 3: Dashboard del cliente

Prompt para Cursor:
```
Completá el dashboard del cliente en apps/web/app/(app)/dashboard/page.tsx.
Ya tiene una versión con datos hardcodeados. Hacé que sea funcional:

1. Fetch del perfil del usuario logueado desde Supabase (tabla profiles)
2. Mostrar "Hola, [nombre] 👋"
3. Botón "Nuevo envío" → link a /(app)/shipment
4. Si hay un shipment con status != 'delivered' y != 'cancelled', mostrar card de "Viaje activo" con link a /(app)/tracking
5. Fetch de backhaul trips disponibles: shipments con status 'in_transit' que tengan capacidad libre (por ahora mockear esto)
6. Sección "Tipos de servicio" con los 3 cards: Flete (camioneta icon), Acarreo (auto icon), Atmosférico (químico icon)

Usar useSession() de lib/hooks para obtener el usuario.
Usar useSupabaseQuery() de lib/hooks para fetchar datos.
Mantener los estilos del brand manual (cream bg, cards blancas con shadow-sm, coral para CTAs).

Tests: fetch/mocks de Supabase o hooks donde aplique; pnpm test:web y pnpm lint.
```

---

## PASO 4: Wizard de nuevo envío (la pantalla más importante)

Prompt para Cursor:
```
Implementá el wizard completo de nuevo envío en apps/web/app/(app)/shipment/page.tsx.

Usar el store useShipmentWizard de lib/stores/index.ts para manejar el estado.
Usar los schemas de lib/schemas/index.ts para validar.

4 pasos:

PASO 1 - RUTA:
- Inputs de dirección con autocomplete. Usar el componente AddressInput del prototipo (fletaya-completo.jsx) como referencia pero implementarlo con la API de Google Places real (@react-google-maps/api + use-places-autocomplete)
- Mapa que muestra los puntos seleccionados (usar @react-google-maps/api con GoogleMap + Marker + Polyline)
- Botón "+ Agregar tramo" (máximo 5) con badge de descuento encadenado
- Selector de cuándo: "Ahora", "Hoy", "Programar"
- El store ya tiene addLeg(), removeLeg(), updateLeg()

PASO 2 - CARGA:
- Tipo de envío: chips seleccionables (Mudanza, Mercadería, Materiales, Electrodomésticos, Muebles, Acarreo de vehículo, Limpieza/Atmosférico, Residuos)
- Si selecciona "Acarreo de vehículo", mostrar campos extra: marca, modelo, patente del auto a transportar, motivo (avería/compraventa/traslado)
- Si selecciona "Limpieza/Atmosférico" o "Residuos", mostrar disclaimer de documentación requerida al prestador
- Descripción (textarea)
- Peso aproximado (4 opciones: hasta 20kg, 20-200kg, 200-1500kg, +1500kg)
- Tipo de vehículo (6 cards: moto, utilitario, camioneta, camión, grúa, atmosférico)
- Ayudantes (0, 1, 2)

PASO 3 - ASIGNACIÓN (plataforma, sin elección manual del cliente):
- El cliente no elige fletero: los conductores postulan con POST /api/shipments/[id]/applications
- El fletero ve cargas abiertas con GET /api/shipments?role=driver&view=open
- La asignación es on-demand: tras cada postulación (AUTO_ASSIGN_ON_APPLICATION + SERVICE_ROLE_KEY) y/o POST /api/shipments/[id]/assign (Bearer ASSIGNMENT_RUN_SECRET). Estrategia por defecto proximity_then_rating_v1: bandas de cercanía (GPS + fin de viaje activo para encadenar) y dentro de cada banda mejor rating. Ajustá bandas en packages/shared/src/assignment/strategies/proximity-then-rating-v1.ts
- UX cliente en este paso: mensaje claro ("Buscamos un fletero", estado de postulaciones o "te avisamos cuando asignemos") — sin listado de conductores para elegir

PASO 4 - CONFIRMAR:
- Resumen de la ruta (todos los tramos)
- Datos del fletero asignado (cuando shipment.driver_id está definido)
- Desglose de precio (usar calcPriceCascade de packages/shared/src/utils)
- Si hay descuento por backhaul, mostrar precio tachado + precio final
- Botón "Confirmar y pagar" → POST a /api/shipments → redirigir a confirmación

Navegación: botones "← Atrás" y "Siguiente →" en cada paso.
Progress bar de 4 pasos arriba.
Colores del brand: coral para CTAs, mint para badges de descuento, forest para textos.
```

---

## PASO 5: Tracking GPS en vivo

Prompt para Cursor:
```
Implementá el tracking en vivo en apps/web/app/(app)/tracking/page.tsx.

Funcionalidad:
1. Recibir el shipmentId por query param o desde el store
2. Suscribirse a cambios en tiempo real de tracking_points usando useRealtimeTracking() de lib/hooks
3. Suscribirse a cambios de status del shipment usando useRealtimeShipmentStatus()
4. Mostrar mapa de Google Maps con:
   - Marker del origen (verde mint)
   - Marker del destino (amarillo sunshine)
   - Polyline de la ruta
   - Marker animado del fletero (azul, pulsante) que se mueve en tiempo real
5. Status bar arriba con: icono + label + descripción del estado actual + ETA
6. Progress bar
7. Card del fletero: avatar, nombre, vehículo, rating, botones "Chat" y "Llamar"
8. Timeline de estados (7 pasos): Aceptado → En camino al origen → Llegó → Cargando → En tránsito → Llegando → Entregado

Los estados están definidos en packages/shared/src/types/index.ts (STATUS_META).
Para la posición del driver, usar los datos de Supabase Realtime (tracking_points table).
Usar @react-google-maps/api para el mapa real.

Colores: seguir brand manual. El marker del driver es azul (#40916C mint), pulsante.
```

---

## PASO 6: Perfil del fletero (docs + vehículos)

Prompt para Cursor:
```
Implementá el perfil del fletero en apps/web/app/(app)/profile/page.tsx.

Si el usuario es client: mostrar perfil simple (nombre, email, teléfono, historial de viajes).
Si el usuario es driver: mostrar perfil completo con:

1. Header: avatar, nombre, rating, total de viajes, badge de verificación
2. Documentación obligatoria (4 items + 2 opcionales):
   - 🪪 DNI (frente + dorso + selfie) → upload a Supabase Storage bucket "dni-documents"
   - 🚗 Licencia de conducir → upload con fecha de vencimiento
   - 🛡️ Seguro del vehículo → upload con fecha de vencimiento
   - 🔧 VTV/RTO → upload con fecha de vencimiento
   - 🧪 Certificado Ambiental (solo si tiene vehículo tipo "atmosferico") → Ley 24.051
   - 🏗️ Habilitación de grúa (solo si tiene vehículo tipo "grua")
   Cada doc muestra: icono, label, fecha de vencimiento, estado (✓ verde o "Subir" button)
   Upload: usar Supabase Storage, actualizar URL en tabla drivers via PATCH /api/drivers

3. Mis vehículos:
   - Lista de vehículos con radio button para seleccionar el activo
   - Cada vehículo muestra: icono del tipo, marca, año, patente, capacidad
   - Botón "+ Agregar vehículo" → modal/form con createVehicleSchema
   - Si el tipo es grúa o atmosférico, mostrar campos extra de certificación

4. Si no tiene todos los docs: mostrar warning "No podés recibir viajes hasta completar la documentación"

Upload de archivos: usar Supabase Storage client-side con supabase.storage.from('bucket').upload()
Validación: usar documentUploadSchema de lib/schemas (max 10MB, jpg/png/pdf)
```

---

## PASO 7: Dark mode

Prompt para Cursor:
```
Implementá dark mode en toda la app.

El store useThemeStore ya existe en lib/stores/index.ts con mode (light/dark/system).

Paleta dark (del brand manual):
- bg: #0F1A14 (forest-tinted black, NOT pure black)
- surface: #142019
- card: #1A2B22
- text: #E8F0EC
- soft: #8BA39B
- dim: #5A7268
- border: #2A3D33
- accent (mint): #74C69D (lighter in dark mode)
- coral: #FF7F6B (same in both modes)
- sunshine: #FFD166 (same in both modes)

Implementación:
1. Agregar las variables dark al tailwind.config.ts usando darkMode: 'class'
2. Agregar toggle en settings page y en el header
3. Aplicar dark: prefix a todos los componentes existentes
4. Persistir preferencia en localStorage
5. Respetar sistema operativo cuando mode = "system"

El logo "fleteya" en dark mode: "flete" en blanco + "ya" en coral.
```

---

## PASO 8: Confirmación con email + calendario

Prompt para Cursor:
```
Después de confirmar un envío, mostrar pantalla de confirmación con:

1. Checkmark verde animado
2. Número de reserva
3. Resumen de la ruta y fletero
4. Desglose de precio con descuento si aplica

5. Sección "Notificaciones enviadas":
   - Email al cliente → simulado con Resend o mostrar estado "Enviado ✓"
   - Email al fletero → idem
   (Para producción: integrar Resend o SendGrid via API route)

6. Sección "Agregar al calendario":
   - Botón Google Calendar
   - Botón Apple Calendar
   - Botón Outlook
   - Todos generan archivo .ics usando la librería "ics" (ya en package.json)
   - Preview del .ics en monospace

7. Botón "Volver al inicio"

Usar la librería "ics" para generar el evento con: título, fecha/hora, ubicación (dirección origen), descripción (fletero + vehículo + patente).
```

---

## PASO 9: Compartir ubicación (lado fletero)

Prompt para Cursor:
```
Implementá la funcionalidad de compartir ubicación GPS para el fletero.

El hook useShareLocation() ya existe en lib/hooks/index.ts.

En la vista del fletero (cuando tiene un viaje activo):
1. Botón "Compartir ubicación" que activa navigator.geolocation.watchPosition
2. Cada 5 segundos, insertar un tracking_point en Supabase con lat, lng, speed, heading
3. Formato PostGIS: POINT(lng lat)
4. Mostrar indicador "📍 Compartiendo ubicación" con animación pulse
5. Botón para dejar de compartir
6. Botones para cambiar el status del viaje: "Llegué al origen" → "Cargando" → "En tránsito" → "Llegando" → "Entregado"
   Cada cambio actualiza shipments.status via Supabase update

El cliente ve todo esto en tiempo real gracias a Supabase Realtime (ya implementado en PASO 5).
```

---

## PASO 10: Tests adicionales

Prompt para Cursor:
```
Agregá tests para las funcionalidades nuevas. Ya existen tests en:
- packages/shared/__tests__/utils.test.ts (15 tests de pricing)
- apps/web/__tests__/lib/schemas.test.ts (20 tests de validación)
- apps/web/__tests__/lib/stores.test.ts (12 tests de stores)
- apps/web/__tests__/api/routes.test.ts (8 tests de API contracts)
- apps/mobile/__tests__/screens/flows.test.ts (10 tests de flows)

Agregar:
1. apps/web/__tests__/components/ShipmentWizard.test.tsx → test de cada paso del wizard (render, interacción, validación)
2. apps/web/__tests__/components/LiveTracking.test.tsx → test de la suscripción realtime y actualización de markers
3. apps/web/__tests__/components/DriverProfile.test.tsx → test de upload de docs, toggle de vehículo activo
4. apps/web/__tests__/lib/hooks.test.ts → test de useSession, useRealtimeTracking (mockear Supabase)
5. apps/web/__tests__/api/shipments.test.ts → integration test del endpoint POST /api/shipments con datos válidos e inválidos

Usar vitest + @testing-library/react para componentes.
Mockear Supabase con vi.mock('@supabase/supabase-js').
Correr con: pnpm test
```

---

## PASO 11: Mobile app

Prompt para Cursor:
```
Completá la app mobile en apps/mobile/ para que tenga paridad con la web.

Ya existe: root layout, tabs layout, home screen, supabase client.

Implementar:
1. app/auth/login.tsx → login con Supabase Auth (Google + email). Usar expo-auth-session para OAuth.
2. app/(tabs)/index.tsx → ya está, verificar que use datos reales de Supabase
3. app/(tabs)/search.tsx → wizard simplificado de nuevo envío (misma lógica que web pero con componentes nativos)
4. app/shipment/new.tsx → wizard completo con react-native-google-places-autocomplete para addresses y react-native-maps para el mapa
5. app/tracking/[id].tsx → tracking en vivo con react-native-maps (MapView + Marker animado + Polyline)
6. app/(tabs)/account.tsx → perfil con upload de docs usando expo-image-picker (cámara para DNI)
7. app/profile/vehicles.tsx → gestión de vehículos

Para GPS del fletero: usar expo-location con Location.watchPositionAsync en background.
Para push notifications: usar expo-notifications.
Compartir el store de Zustand y los tipos de @shared entre web y mobile.

Colores: misma paleta que web (ver tailwind.config.ts), pero usando StyleSheet o NativeWind.
Dark mode: usar useColorScheme() de react-native + useThemeStore.
```

---

## PASO 12: Landing page SEO + Analytics

Prompt para Cursor:
```
Mejorá la landing page para SEO y conversión:

1. Agregar metadata completa en app/layout.tsx (ya tiene básico, agregar structured data JSON-LD)
2. Crear app/(marketing)/como-funciona/page.tsx → página dedicada con más detalle
3. Crear app/(marketing)/fleteros/page.tsx → landing específica para reclutamiento de fleteros
4. Agregar sitemap.xml via next-sitemap
5. Agregar robots.txt
6. Agregar Google Analytics (o Plausible para privacidad)
7. Agregar schema.org LocalBusiness markup
8. Optimizar imágenes con next/image
9. Agregar animaciones de entrada con framer-motion (stagger en las cards de "cómo funciona")

La landing ya está completa en app/(marketing)/page.tsx con todas las secciones.
Solo falta SEO técnico y performance.
```

---

## Notas para Cursor / Claude

- **`.cursorrules`** + **`.cursor/rules/*.mdc`**: convenciones, tests obligatorios y login social (Facebook con flag).
- **App Store (iOS):** publicación y mitos sobre “apps hechas con IA” → `docs/APP_STORE_COMPLIANCE.md`.
- **`CURSOR_GUIDE.md`** (esta guía): pasos de producto; la sección **“Obligatorio en cada implementación”** aplica a *todos* los PASOs.
- Los tipos compartidos están en `packages/shared/src/types/index.ts`
- Las utilidades de pricing están en `packages/shared/src/utils/index.ts`
- Las constantes (tipos de envío, pesos, etc.) están en `packages/shared/src/constants/index.ts`
- Migraciones SQL: `packages/supabase/migrations/` (`003` postulaciones, `004` RPC encadenados / último tramo)
- La paleta del brand está en `apps/web/tailwind.config.ts`
- Tests de referencia: `apps/web/__tests__/**` (Vitest + Testing Library; ver `vitest.config.ts`)
- **Auth social:** Google + email siempre en UI; Facebook solo con `NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH=true`; credenciales OAuth en **Supabase Dashboard**, no solo en `.env` (salvo NextAuth u otro flujo).
- No dejar rastros de herramientas de asistencia en el código comentado
- UI en español (Argentina), código en inglés
- **Web + mobile (Expo):** mismos flujos de producto; en web usar layout responsive (`max-w-md` → `sm:max-w-lg` → `lg:max-w-xl`), `100dvh`, `safe-area-inset` y targets táctiles en nav. Ver `.cursorrules`.
