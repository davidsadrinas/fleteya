# FleteYa — Guía de Implementación para Cursor

Este archivo contiene instrucciones paso a paso para completar el desarrollo del proyecto.
Cada sección es un prompt que podés copiar y pegar en Cursor para que implemente esa funcionalidad.
Seguí el orden — cada paso depende del anterior.

**Progreso:** PASO 1–2 (Auth + onboarding post-registro) en código · PASO 7 parcial (tema oscuro manual PDF, sin toggle). Continuar con PASO 3 (dashboard cliente).

**FASE 2 (Hardening):** No iniciado. Ejecutar H1–H9 antes de lanzar a usuarios reales. Ver sección "FASE 2" abajo.

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

---

# FASE 2: Hardening, Seguridad y Calidad

> Los pasos 1–12 construyen las features del MVP.
> La Fase 2 endurece lo que ya existe: cierra vulnerabilidades, elimina duplicación,
> mejora la resiliencia y lleva la cobertura de tests a un nivel aceptable.
> Ejecutar estos pasos **antes** de lanzar a usuarios reales.

**Progreso:** No iniciado.

---

## PASO H1: Middleware de autorización centralizado

Prompt para Cursor:
```
Creá un middleware de autorización reutilizable para todas las API routes y páginas protegidas.

Problema actual (con código exacto vulnerable):

VULNERABILIDAD 1 — Frontend actualiza status sin autorización:
En apps/web/app/(app)/tracking/page.tsx líneas 299-304, cualquier usuario puede cambiar el
status de cualquier shipment directamente desde el navegador:

  onClick={async () => {
    if (!shipmentId) return;
    await supabase
      .from("shipments")
      .update({ status: next.value, updated_at: new Date().toISOString() })
      .eq("id", shipmentId);
  }}

Esto es el bloque de botones "Cambiar estado" (líneas 287-310 en tracking/page.tsx).
No hay verificación de que el usuario sea el driver asignado ni que la transición sea válida.

VULNERABILIDAD 2 — Escalación de privilegios vía query param:
En apps/web/app/api/shipments/route.ts línea 14:

  const role = searchParams.get("role") || "client";

Cualquier usuario puede pasar ?role=driver para ver shipments de otros usuarios.
El rol debería inferirse del perfil en Supabase, no del query string.

VULNERABILIDAD 3 — Driver no verificado en tracking:
En apps/web/app/api/tracking/route.ts líneas 31-36, se busca el shipment pero nunca se verifica
que el driver_id apunte al usuario actual:

  const { data: shipment } = await supabase
    .from("shipments")
    .select("driver_id")
    .eq("id", shipmentId)
    .single();
  // ← Falta: if (shipment.driver_id !== currentDriverId) return 403

VULNERABILIDAD 4 — useShareLocation sin permisos:
En apps/web/lib/hooks/index.ts líneas 143-150, el hook inserta tracking_points directamente
en Supabase sin verificar que el usuario sea el driver asignado:

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      await supabase.from("tracking_points").insert({
        shipment_id: shipmentId,
        location: `POINT(${pos.coords.longitude} ${pos.coords.latitude})`,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
      });
    },

Implementación:

1. Crear apps/web/lib/auth/middleware.ts con tres wrappers:

   import { NextRequest, NextResponse } from "next/server";
   import { createServerSupabase } from "@/lib/supabase-server";
   import { canAccessShipment } from "@/lib/shipments/access";
   import type { UserRole } from "@shared/types";

   type AuthenticatedHandler = (
     req: NextRequest,
     context: { user: { id: string; email: string }; role: UserRole; supabase: ReturnType<typeof createServerSupabase> }
   ) => Promise<NextResponse>;

   // Wrapper 1: verifica sesión y extrae user + role desde tabla profiles
   export function withAuth(handler: AuthenticatedHandler) {
     return async (req: NextRequest) => {
       const supabase = createServerSupabase();
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

       const { data: profile } = await supabase
         .from("profiles")
         .select("role")
         .eq("id", user.id)
         .maybeSingle();

       const role = (profile?.role as UserRole) ?? "client";
       return handler(req, { user: { id: user.id, email: user.email ?? "" }, role, supabase });
     };
   }

   // Wrapper 2: withAuth + verificación de rol
   export function withRole(handler: AuthenticatedHandler, allowedRoles: UserRole[]) { ... }

   // Wrapper 3: withAuth + verificación de acceso al shipment
   // Extrae shipmentId del path /api/shipments/[id]/...
   export function withShipmentAccess(handler, accessLevel: 'read' | 'write') { ... }

2. Refactorizar API routes existentes:

   a. apps/web/app/api/shipments/route.ts GET:
      - ELIMINAR línea 14: const role = searchParams.get("role") || "client";
      - Usar withAuth, inferir rol desde context.role
      - Si role === "driver", buscar driver_id del usuario; si role === "client", filtrar por client_id
      - Para view=open (drivers buscando cargas), verificar que el usuario sea driver

   b. apps/web/app/api/tracking/route.ts POST:
      - Después de obtener el shipment (línea 32), agregar verificación:
        - Buscar el driver_id del shipment
        - Buscar el driver record del usuario actual
        - Si no coinciden, retornar 403 "No sos el driver asignado a este envío"

   c. apps/web/app/api/shipments/[id]/chat/route.ts:
      - Usar withShipmentAccess('read') en GET
      - Usar withShipmentAccess('write') en POST

   d. Idem para evidence y disputes routes

3. Crear endpoint de status update (reemplaza las llamadas directas del frontend):

   Crear apps/web/app/api/shipments/[id]/status/route.ts:

   import { NextRequest, NextResponse } from "next/server";
   import { createServerSupabase } from "@/lib/supabase-server";
   import { ShipmentStatus } from "@shared/types";

   // Transiciones válidas: cada status solo puede ir a ciertos estados
   const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
     pending: ["accepted", "cancelled"],
     accepted: ["heading_to_origin", "cancelled"],
     heading_to_origin: ["at_origin"],
     at_origin: ["loading"],
     loading: ["in_transit"],
     in_transit: ["arriving"],
     arriving: ["delivered"],
     delivered: [],
     cancelled: [],
   };

   export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
     const supabase = createServerSupabase();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

     const { status: newStatus } = await req.json();
     const shipmentId = params.id;

     // 1. Buscar shipment + driver_id
     const { data: shipment } = await supabase
       .from("shipments")
       .select("id, status, driver_id")
       .eq("id", shipmentId)
       .single();
     if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });

     // 2. Verificar que el usuario es el driver asignado
     const { data: driverRow } = await supabase
       .from("drivers")
       .select("id")
       .eq("user_id", user.id)
       .maybeSingle();
     if (!driverRow || shipment.driver_id !== driverRow.id) {
       return NextResponse.json({ error: "Solo el fletero asignado puede cambiar el estado" }, { status: 403 });
     }

     // 3. Validar transición
     const currentStatus = shipment.status as ShipmentStatus;
     const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
     if (!allowed.includes(newStatus)) {
       return NextResponse.json(
         { error: `No se puede pasar de "${currentStatus}" a "${newStatus}"` },
         { status: 400 }
       );
     }

     // 4. Actualizar
     const { error } = await supabase
       .from("shipments")
       .update({ status: newStatus, updated_at: new Date().toISOString() })
       .eq("id", shipmentId);
     if (error) return NextResponse.json({ error: error.message }, { status: 500 });

     return NextResponse.json({ status: newStatus });
   }

4. Actualizar tracking/page.tsx — reemplazar el bloque de botones (líneas 287-310):
   - ELIMINAR el bloque completo de <div className="mt-3 grid grid-cols-2 gap-2"> con los 5 botones
   - En su lugar, si el usuario es el driver asignado, mostrar botones que hagan:
     fetch(`/api/shipments/${shipmentId}/status`, {
       method: "PATCH",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ status: next.value }),
     })
   - Solo mostrar el botón del siguiente estado válido, no todos los estados

5. Actualizar lib/hooks/index.ts useShareLocation (líneas 126-161):
   - Antes de iniciar watchPosition, verificar via API que el usuario es el driver asignado
   - Agregar un fetch a /api/shipments/${shipmentId} que retorne si el usuario tiene acceso write

6. Mejorar canAccessShipment en lib/shipments/access.ts:
   - Actualmente hace 2 queries separadas (líneas 13-35); optimizar con un solo query JOIN
   - Agregar campo isDriver al resultado para saber si el usuario es el driver asignado
   - Verificar que la cuenta del usuario esté activa

Tests (en apps/web/__tests__/):
- api/auth-middleware.test.ts:
  - withAuth rechaza request sin sesión Supabase → 401
  - withAuth pasa user + role al handler cuando hay sesión válida
  - withRole rechaza si el usuario tiene rol incorrecto → 403
  - withShipmentAccess rechaza si el usuario no es client ni driver del shipment → 403

- api/shipment-status.test.ts:
  - PATCH con transición válida (pending → accepted) → 200
  - PATCH con transición inválida (pending → delivered) → 400
  - PATCH sin ser driver asignado → 403
  - PATCH sin sesión → 401

- Actualizar api/shipments.test.ts:
  - Verificar que GET ya no acepta ?role como parámetro
  - GET como cliente retorna solo sus shipments
  - GET como driver retorna solo shipments donde es driver asignado

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H2: Consolidar lógica de pricing en packages/shared

Prompt para Cursor:
```
Extraé toda la lógica de pricing a una función centralizada en packages/shared.

Problema actual — el cálculo de precio está duplicado con valores inconsistentes:

DUPLICADO 1 — Frontend (apps/web/app/(app)/shipment/page.tsx líneas 38-43):
  const estimatedBase = useMemo(() => {
    const km = legsPayload.length * 8;           // ← ASUME 8km por tramo (???)
    return Math.max(6000, 3200 + km * 1800);     // ← base 3200 + 1800/km, mínimo 6000
  }, [legsPayload.length]);
  const estimatedDiscount = legsPayload.length > 1 ? Math.min((legsPayload.length - 1) * 12, 45) : 0;
  // ← Descuento: 12% por tramo extra, máximo 45%. NO coincide con CHAIN_DISCOUNTS [0, 0.15, 0.27, 0.39, 0.45]

DUPLICADO 2 — Backend (apps/web/app/api/shipments/route.ts líneas 78-90):
  const legsWithPricing = input.legs.map((leg, i) => {
    const distKm = calculateDistance(leg.originLat, leg.originLng, leg.destLat, leg.destLng);
    const basePrice = Math.round(3200 + distKm * 1800);   // ← misma fórmula base
    const chainDiscount = i === 0 ? 0 : Math.min(0.15 + (i - 1) * 0.12, 0.45);
    // ← Descuento: 15% + 12%*(i-1), tope 45%. TAMPOCO coincide con CHAIN_DISCOUNTS del shared
    const legPrice = Math.round(basePrice * (1 - chainDiscount));
    ...
  });
  const commission = Math.round(totalFinal * COMMISSION.BASE_RATE); // ← usa COMMISSION del shared

FUENTE DE VERDAD — packages/shared/src/types/index.ts líneas 204-209:
  export const COMMISSION = {
    BASE_RATE: 0.22,
    BACKHAUL_RATE: 0.15,
    CHAIN_DISCOUNTS: [0, 0.15, 0.27, 0.39, 0.45],  // ← valores oficiales por leg index
    CIRCUIT_BONUS: 0.08,
  };

Resumen: hay 3 implementaciones distintas del descuento encadenado que dan resultados diferentes.

Implementación:

1. Crear packages/shared/src/pricing/index.ts:

   import { COMMISSION, VEHICLE_TYPES } from "../types";
   import type { VehicleType, ShipmentType } from "../types";

   // Constantes de pricing (centralizadas, no hardcodeadas en cada archivo)
   export const PRICING = {
     BASE_PER_KM: 1800,        // ARS por kilómetro
     MINIMUM_BASE: 3200,       // ARS mínimo por tramo
     MINIMUM_TOTAL: 6000,      // ARS mínimo total del envío
     HELPER_SURCHARGE: 2500,   // ARS por ayudante
     MERCADOPAGO_FEE: 0.034,   // 3.4%
     INSURANCE_FEE: 0.025,     // 2.5%
     // Multiplicadores por tipo de vehículo (sobre el precio base)
     VEHICLE_MULTIPLIERS: {
       moto: 0.6,
       utilitario: 0.85,
       camioneta: 1.0,     // referencia
       camion: 1.4,
       grua: 1.8,          // requiere equipamiento especial
       atmosferico: 2.0,   // requiere certificación ambiental
     } satisfies Record<VehicleType, number>,
   } as const;

   export interface PricingInput {
     legs: Array<{ distanceKm: number }>
     vehicleType: VehicleType
     helpers: number
     shipmentType: ShipmentType
     isBackhaul?: boolean
     isCircuit?: boolean   // último destino ≈ primer origen (dentro de 5km)
   }

   export interface LegPricing {
     basePrice: number
     chainDiscount: number     // porcentaje (0, 0.15, 0.27, 0.39, 0.45)
     discountAmount: number    // en ARS
     finalPrice: number        // basePrice - discountAmount
   }

   export interface PricingResult {
     legs: LegPricing[]
     subtotal: number           // suma de todos los legs.finalPrice
     helpersSurcharge: number   // helpers * HELPER_SURCHARGE
     circuitBonus: number       // descuento extra si isCircuit (8% del subtotal)
     totalBeforeFees: number    // subtotal + helpersSurcharge - circuitBonus
     commission: number         // 22% (o 15% si backhaul)
     mercadopagoFee: number     // 3.4%
     insuranceFee: number       // 2.5%
     totalClient: number        // totalBeforeFees + mercadopagoFee + insuranceFee
     totalDriver: number        // totalBeforeFees - commission
     commissionRate: number     // 0.22 o 0.15
   }

   export function calculatePricing(input: PricingInput): PricingResult {
     const vehicleMultiplier = PRICING.VEHICLE_MULTIPLIERS[input.vehicleType];
     const commissionRate = input.isBackhaul ? COMMISSION.BACKHAUL_RATE : COMMISSION.BASE_RATE;

     const legs: LegPricing[] = input.legs.map((leg, i) => {
       const rawBase = Math.max(PRICING.MINIMUM_BASE, PRICING.MINIMUM_BASE + leg.distanceKm * PRICING.BASE_PER_KM);
       const basePrice = Math.round(rawBase * vehicleMultiplier);
       const chainDiscount = COMMISSION.CHAIN_DISCOUNTS[i] ?? COMMISSION.CHAIN_DISCOUNTS[COMMISSION.CHAIN_DISCOUNTS.length - 1];
       const discountAmount = Math.round(basePrice * chainDiscount);
       const finalPrice = basePrice - discountAmount;
       return { basePrice, chainDiscount, discountAmount, finalPrice };
     });

     const subtotal = legs.reduce((sum, l) => sum + l.finalPrice, 0);
     const helpersSurcharge = input.helpers * PRICING.HELPER_SURCHARGE;
     const circuitBonus = input.isCircuit ? Math.round(subtotal * COMMISSION.CIRCUIT_BONUS) : 0;
     const totalBeforeFees = Math.max(PRICING.MINIMUM_TOTAL, subtotal + helpersSurcharge - circuitBonus);

     const commission = Math.round(totalBeforeFees * commissionRate);
     const mercadopagoFee = Math.round(totalBeforeFees * PRICING.MERCADOPAGO_FEE);
     const insuranceFee = Math.round(totalBeforeFees * PRICING.INSURANCE_FEE);

     return {
       legs,
       subtotal,
       helpersSurcharge,
       circuitBonus,
       totalBeforeFees,
       commission,
       mercadopagoFee,
       insuranceFee,
       totalClient: totalBeforeFees + mercadopagoFee + insuranceFee,
       totalDriver: totalBeforeFees - commission,
       commissionRate,
     };
   }

   Exportar desde packages/shared/src/index.ts

2. Actualizar apps/web/app/(app)/shipment/page.tsx:
   - Importar { calculatePricing, PRICING } de @shared/pricing
   - ELIMINAR líneas 38-43 (el cálculo manual de estimatedBase/estimatedDiscount/estimatedFinal)
   - Reemplazar con:
     const pricing = useMemo(() => calculatePricing({
       legs: legsPayload.map(leg => ({
         distanceKm: calculateDistance(leg.originLat, leg.originLng, leg.destLat, leg.destLng),
       })),
       vehicleType: (data.vehicleType || "camioneta") as VehicleType,
       helpers: data.helpers,
       shipmentType: (data.type || "mudanza") as ShipmentType,
     }), [legsPayload, data.vehicleType, data.helpers, data.type]);
   - Importar también calculateDistance de @shared/utils (mover la función Haversine al shared)
   - En el paso 4 (Confirmar, líneas 222-238), mostrar el desglose completo:
     - Precio base por tramo con descuento encadenado
     - Subtotal + ayudantes
     - Comisión 22% (mostrar como info, no como cargo extra al cliente)
     - Fee MercadoPago
     - Total final
   - ELIMINAR la línea 237 hardcodeada: "Comisión base plataforma: 22%."

3. Actualizar apps/web/app/api/shipments/route.ts:
   - Importar calculatePricing de @shared/pricing
   - ELIMINAR el bloque de pricing inline (líneas 78-90)
   - ELIMINAR la función calculateDistance local (líneas 136-142) — moverla a @shared/utils
   - Reemplazar con:
     const pricing = calculatePricing({
       legs: input.legs.map(leg => ({
         distanceKm: calculateDistance(leg.originLat, leg.originLng, leg.destLat, leg.destLng),
       })),
       vehicleType: input.vehicleType ?? "camioneta",
       helpers: input.helpers,
       shipmentType: input.type,
     });
   - Usar pricing.totalClient como final_price
   - Usar pricing.commission como commission
   - Usar pricing.totalDriver como driver_payout

4. Mover calculateDistance a packages/shared/src/utils/geo.ts:
   - La función ya existe en api/shipments/route.ts líneas 136-142 (Haversine)
   - También existe en packages/shared/src/utils/index.ts como haversineDistanceKm
   - Verificar cuál es la correcta y unificar en un solo lugar
   - Exportar desde @shared/utils

Tests (packages/shared/__tests__/pricing.test.ts):
- 1 tramo camioneta, 10km → precio base: 3200 + 10*1800 = 21200, descuento 0%, comisión 22%
- 3 tramos, 10km cada uno → descuentos [0%, 15%, 27%], verificar total
- 5 tramos (máximo) → descuentos [0%, 15%, 27%, 39%, 45%]
- Backhaul → comisión 15% en vez de 22%
- Circuito → bonus 8% aplicado
- Grúa → multiplicador 1.8x
- Atmosférico → multiplicador 2.0x
- Moto → multiplicador 0.6x
- 0 km → precio mínimo MINIMUM_BASE
- 2 ayudantes → + 5000 ARS
- Edge: distancia negativa o NaN → debería clampear a 0

Ejecutar pnpm test y pnpm lint.
```

---

## PASO H3: Transacciones de base de datos para operaciones multi-step

Prompt para Cursor:
```
Agregá transacciones a todas las operaciones de DB que hacen múltiples inserts/updates.

Problema actual — código exacto con operaciones no atómicas:

PROBLEMA 1 — Shipment creation (apps/web/app/api/shipments/route.ts líneas 92-131):
Primero inserta el shipment (líneas 93-109):
  const { data: shipment, error: shipError } = await supabase
    .from("shipments")
    .insert({ client_id: user.id, type: input.type, ... })
    .select()
    .single();

Luego inserta los legs (líneas 114-129):
  const { error: legsError } = await supabase
    .from("shipment_legs")
    .insert(legsWithPricing.map(...));

Si el segundo insert falla, el shipment queda huérfano en la DB sin tramos.
Además, si hay un error de red entre los dos, el usuario ve un error pero el shipment ya existe.

PROBLEMA 2 — Vehicle activation (apps/web/app/(app)/profile/page.tsx líneas 129-138):
Dos updates secuenciales no atómicos:
  await supabase.from("vehicles").update({ active: false }).eq("driver_id", driver.id);
  await supabase.from("vehicles").update({ active: true }).eq("id", vehicleId);

Si el segundo falla, TODOS los vehículos quedan inactivos y el driver no puede recibir viajes.

Implementación:

1. Crear packages/supabase/migrations/007_atomic_operations.sql:

   -- ========================================
   -- RPC: Crear shipment con legs atómicamente
   -- ========================================
   CREATE OR REPLACE FUNCTION public.create_shipment_with_legs(
     p_client_id UUID,
     p_type TEXT,
     p_description TEXT,
     p_weight TEXT,
     p_vehicle_type TEXT,
     p_helpers INT,
     p_scheduled_at TIMESTAMPTZ,
     p_base_price NUMERIC,
     p_discount NUMERIC,
     p_final_price NUMERIC,
     p_commission NUMERIC,
     p_assignment_strategy_id TEXT DEFAULT 'proximity_then_rating_v1',
     p_legs JSONB DEFAULT '[]'::jsonb
     -- p_legs: [{ "originAddress": "...", "destAddress": "...",
     --            "originLng": -58.38, "originLat": -34.60,
     --            "destLng": -58.40, "destLat": -34.62,
     --            "distanceKm": 12.5, "estimatedMinutes": 44,
     --            "legOrder": 0, "price": 25600, "discount": 0 }]
   ) RETURNS jsonb AS $$
   DECLARE
     v_shipment_id UUID;
     v_shipment jsonb;
   BEGIN
     -- Insertar shipment
     INSERT INTO shipments (
       client_id, type, description, weight, helpers, scheduled_at,
       base_price, discount, final_price, commission,
       assignment_strategy_id, status
     ) VALUES (
       p_client_id, p_type, p_description, p_weight, p_helpers, p_scheduled_at,
       p_base_price, p_discount, p_final_price, p_commission,
       p_assignment_strategy_id, 'pending'
     )
     RETURNING id INTO v_shipment_id;

     -- Insertar todos los legs
     INSERT INTO shipment_legs (
       shipment_id, leg_order, origin_address, dest_address,
       origin_location, dest_location,
       distance_km, estimated_minutes, price, discount
     )
     SELECT
       v_shipment_id,
       (leg->>'legOrder')::int,
       leg->>'originAddress',
       leg->>'destAddress',
       ST_SetSRID(ST_MakePoint(
         (leg->>'originLng')::float,
         (leg->>'originLat')::float
       ), 4326)::geography,
       ST_SetSRID(ST_MakePoint(
         (leg->>'destLng')::float,
         (leg->>'destLat')::float
       ), 4326)::geography,
       (leg->>'distanceKm')::numeric,
       (leg->>'estimatedMinutes')::int,
       (leg->>'price')::numeric,
       (leg->>'discount')::numeric
     FROM jsonb_array_elements(p_legs) AS leg;

     -- Retornar shipment completo como JSON
     SELECT jsonb_build_object(
       'id', v_shipment_id,
       'final_price', p_final_price,
       'status', 'pending'
     ) INTO v_shipment;

     RETURN v_shipment;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Solo usuarios autenticados pueden llamar
   REVOKE ALL ON FUNCTION public.create_shipment_with_legs FROM PUBLIC;
   GRANT EXECUTE ON FUNCTION public.create_shipment_with_legs TO authenticated;

   -- ========================================
   -- RPC: Activar vehículo atómicamente
   -- ========================================
   CREATE OR REPLACE FUNCTION public.set_active_vehicle(
     p_driver_id UUID,
     p_vehicle_id UUID
   ) RETURNS VOID AS $$
   BEGIN
     -- Desactivar todos los del driver
     UPDATE vehicles SET active = false WHERE driver_id = p_driver_id;
     -- Activar el seleccionado
     UPDATE vehicles SET active = true WHERE id = p_vehicle_id AND driver_id = p_driver_id;

     -- Verificar que se activó exactamente 1
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Vehículo no encontrado o no pertenece al driver';
     END IF;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   REVOKE ALL ON FUNCTION public.set_active_vehicle FROM PUBLIC;
   GRANT EXECUTE ON FUNCTION public.set_active_vehicle TO authenticated;

2. Actualizar apps/web/app/api/shipments/route.ts POST:
   ELIMINAR los dos inserts separados (líneas 92-131).
   Reemplazar con:

   const { data: result, error: rpcError } = await supabase.rpc("create_shipment_with_legs", {
     p_client_id: user.id,
     p_type: input.type,
     p_description: input.description ?? "",
     p_weight: input.weight,
     p_vehicle_type: input.vehicleType ?? "camioneta",
     p_helpers: input.helpers,
     p_scheduled_at: input.scheduledAt || new Date().toISOString(),
     p_base_price: pricing.subtotal,             // del calculatePricing (PASO H2)
     p_discount: pricing.legs.reduce((s, l) => s + l.discountAmount, 0),
     p_final_price: pricing.totalClient,
     p_commission: pricing.commission,
     p_legs: JSON.stringify(legsWithPricing),
   });

   if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });
   return NextResponse.json({ shipment: result }, { status: 201 });

3. Actualizar apps/web/app/(app)/profile/page.tsx setActiveVehicle (líneas 129-138):
   ELIMINAR los dos updates separados. Reemplazar con:

   const setActiveVehicle = async (vehicleId: string) => {
     if (!driver?.id) return;
     const { error } = await supabase.rpc("set_active_vehicle", {
       p_driver_id: driver.id,
       p_vehicle_id: vehicleId,
     });
     if (error) {
       setMessage("No se pudo cambiar el vehículo activo.");
       return;
     }
     // Refrescar lista
     const { data } = await supabase
       .from("vehicles")
       .select("id,type,brand,year,plate,active")
       .eq("driver_id", driver.id);
     setVehicles((data as VehicleRow[] | null) ?? []);
   };

Tests:
- apps/web/__tests__/api/shipments.test.ts:
  - Mockear supabase.rpc y verificar que se llama con los parámetros correctos
  - Verificar que ya no se usan dos inserts separados
  - Test que un error en la RPC retorna 500 (no un shipment parcial)

- Test manual SQL:
  - Ejecutar la migración 007 en Supabase SQL editor
  - Llamar create_shipment_with_legs con datos válidos → verificar que shipment + legs se crean
  - Llamar con legs inválidos (lat fuera de rango) → verificar que ni shipment ni legs se crean (rollback)

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H4: Eliminar type assertions inseguras y agregar validación runtime

Prompt para Cursor:
```
Reemplazá todos los `as any` y type assertions inseguros con validación Zod runtime.

Problema actual — código exacto con cada `as any` y type assertion insegura:

EN lib/hooks/index.ts:
  Línea 27:  else setData(data as T[]);
    → useSupabaseQuery castea data genérico sin validar. Si la tabla cambia, crashea silenciosamente.

  Línea 38:  const [session, setSession] = useState<any>(null);
    → Session completamente sin tipo. Cualquier acceso a session.user es unsafe.

  Línea 75:  const point = payload.new as any;
    → Payload de Supabase Realtime casteado a any. Si el schema de tracking_points cambia,
      el regex en línea 79 falla silenciosamente.

  Línea 112: setStatus((payload.new as any).status);
    → Si payload.new no tiene .status, se setea undefined sin error.

EN lib/stores/index.ts:
  → NO hay `as any` actualmente (el store está bien tipado). Pero hay un potencial SSR issue:
  Línea 25-35: El bloque `if (typeof window !== "undefined")` ejecuta matchMedia y
    localStorage al cargarse el módulo. Esto ya tiene el guard correcto, pero verificar
    que no se ejecute durante SSR en Next.js con React Server Components.

EN dashboard/page.tsx:
  Línea 8:   type ProfileRow = { id: string; name: string | null };
  Línea 9:   type ShipmentRow = { id: string; status: string; ... };
    → Tipos definidos localmente en vez de compartidos. Si la tabla cambia, los tipos
      quedan desincronizados.

EN profile/page.tsx:
  Línea 62:  setDriver((driverData as DriverRow | null) ?? null);
  Línea 63:  if (!(driverData as DriverRow | null)?.id) return;
  Línea 67:  .eq("driver_id", (driverData as DriverRow).id);
  Línea 68:  setVehicles((vehData as VehicleRow[] | null) ?? []);
  Línea 126: setDriver((driverData as DriverRow | null) ?? null);
  Línea 137: setVehicles((data as VehicleRow[] | null) ?? []);
  Línea 186: {(driver as Record<string, unknown> | null)?.[doc.field] ? "✓ Cargado" : "Subir"}
    → 7 type assertions sin validación. Si Supabase devuelve null o un shape distinto,
      la UI se rompe o muestra datos incorrectos.

EN tracking/page.tsx:
  Línea 81:  setChatMessages(((json?.messages as ChatMessage[] | undefined) ?? []));
  Línea 84:  setFeedback((json?.error as string | undefined) ?? "No se pudo cargar el chat.");
  Línea 96:  setEvidence(((json?.evidence as ShipmentEvidence[] | undefined) ?? []));
  Línea 111: setDisputes(((json?.disputes as ShipmentDispute[] | undefined) ?? []));
    → Respuestas de API casteadas sin validar. Si el shape del response cambia, crashea.

Implementación:

1. Crear apps/web/lib/schemas/supabase-rows.ts con Zod schemas que coincidan con las tablas:

   import { z } from "zod";

   // Usar los mismos status que packages/shared/src/types/index.ts (ShipmentStatus)
   const shipmentStatusEnum = z.enum([
     "pending", "accepted", "heading_to_origin", "at_origin",
     "loading", "in_transit", "arriving", "delivered", "cancelled",
   ]);

   export const profileRowSchema = z.object({
     id: z.string().uuid(),
     name: z.string().nullable(),
     phone: z.string().nullable(),
     role: z.enum(["client", "driver", "admin"]).nullable(),
     avatar_url: z.string().nullable().optional(),
     onboarding_complete: z.boolean().optional(),
     created_at: z.string().optional(),
   });
   export type ProfileRow = z.infer<typeof profileRowSchema>;

   export const shipmentRowSchema = z.object({
     id: z.string().uuid(),
     client_id: z.string().uuid(),
     driver_id: z.string().uuid().nullable(),
     status: shipmentStatusEnum,
     type: z.string().nullable(),
     description: z.string().nullable().optional(),
     weight: z.string().nullable().optional(),
     helpers: z.number().optional(),
     base_price: z.number().nullable().optional(),
     discount: z.number().nullable().optional(),
     final_price: z.number().nullable(),
     commission: z.number().nullable().optional(),
     is_backhaul: z.boolean().nullable().optional(),
     scheduled_at: z.string().nullable().optional(),
     created_at: z.string(),
   });
   export type ShipmentRow = z.infer<typeof shipmentRowSchema>;

   export const driverRowSchema = z.object({
     id: z.string().uuid(),
     user_id: z.string().uuid().optional(),
     verified: z.boolean(),
     rating: z.number(),
     total_trips: z.number(),
     dni_front_url: z.string().nullable(),
     license_url: z.string().nullable(),
     insurance_url: z.string().nullable(),
     vtv_url: z.string().nullable(),
   });
   export type DriverRow = z.infer<typeof driverRowSchema>;

   export const vehicleRowSchema = z.object({
     id: z.string().uuid(),
     type: z.string(),
     brand: z.string(),
     year: z.number(),
     plate: z.string(),
     active: z.boolean(),
   });
   export type VehicleRow = z.infer<typeof vehicleRowSchema>;

   export const chatMessageSchema = z.object({
     id: z.string(),
     shipment_id: z.string(),
     sender_user_id: z.string(),
     body: z.string(),
     quick_tag: z.string().nullable(),
     created_at: z.string(),
   });
   export type ChatMessage = z.infer<typeof chatMessageSchema>;

   export const evidenceSchema = z.object({
     id: z.string(),
     stage: z.enum(["pickup", "delivery"]),
     file_url: z.string(),
     note: z.string().nullable(),
     created_at: z.string(),
   });
   export type ShipmentEvidence = z.infer<typeof evidenceSchema>;

   export const disputeSchema = z.object({
     id: z.string(),
     reason: z.string(),
     status: z.string(),
     created_at: z.string(),
   });
   export type ShipmentDispute = z.infer<typeof disputeSchema>;

   // Safe parser — retorna null y loguea si los datos no coinciden
   export function safeParseArray<T>(
     schema: z.ZodType<T>,
     data: unknown,
     context: string
   ): T[] {
     if (!Array.isArray(data)) {
       console.error(`[safeParseArray] ${context}: expected array, got`, typeof data);
       return [];
     }
     return data.flatMap((item) => {
       const result = schema.safeParse(item);
       if (!result.success) {
         console.error(`[safeParseArray] ${context}:`, result.error.flatten());
         return [];
       }
       return [result.data];
     });
   }

   export function safeParseOne<T>(
     schema: z.ZodType<T>,
     data: unknown,
     context: string
   ): T | null {
     const result = schema.safeParse(data);
     if (!result.success) {
       console.error(`[safeParseOne] ${context}:`, result.error.flatten());
       return null;
     }
     return result.data;
   }

2. Actualizar apps/web/lib/hooks/index.ts:

   a. Línea 38 — useSession:
      ANTES:  const [session, setSession] = useState<any>(null);
      DESPUÉS: import type { Session } from "@supabase/supabase-js";
               const [session, setSession] = useState<Session | null>(null);

   b. Línea 27 — useSupabaseQuery:
      ANTES:  else setData(data as T[]);
      DESPUÉS: Si querés mantener el genérico, agregar un parámetro schema opcional:
               export function useSupabaseQuery<T>(
                 table: string,
                 query?: { column: string; value: string },
                 enabled?: boolean,
                 schema?: z.ZodType<T>
               )
               Y usar safeParseArray si se provee schema, o el cast si no.

   c. Línea 75 — useRealtimeTracking:
      ANTES:  const point = payload.new as any;
      DESPUÉS:
        const raw = payload.new;
        if (!raw || typeof raw !== "object") return;
        const location = (raw as Record<string, unknown>).location;
        if (typeof location !== "string") return;
        const match = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
        if (match) {
          updatePosition({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) });
        }

   d. Línea 112 — useRealtimeShipmentStatus:
      ANTES:  setStatus((payload.new as any).status);
      DESPUÉS:
        const raw = payload.new;
        if (raw && typeof raw === "object" && "status" in raw && typeof raw.status === "string") {
          setStatus(raw.status);
        }

3. Actualizar apps/web/app/(app)/dashboard/page.tsx:
   - ELIMINAR las definiciones locales de ProfileRow y ShipmentRow (líneas 8-16)
   - Importar desde @/lib/schemas/supabase-rows:
     import { type ProfileRow, type ShipmentRow, profileRowSchema, shipmentRowSchema } from "@/lib/schemas/supabase-rows";
   - En línea 44, reemplazar el type coercion:
     ANTES:  price: Number(s.final_price ?? 0).toLocaleString("es-AR"),
     DESPUÉS: price: (s.final_price ?? 0).toLocaleString("es-AR"),
     (El schema ya garantiza que es number | null)

4. Actualizar apps/web/app/(app)/profile/page.tsx:
   - ELIMINAR las definiciones locales de ProfileRow, DriverRow, VehicleRow (líneas 10-35)
   - Importar desde @/lib/schemas/supabase-rows
   - Línea 62: ANTES: setDriver((driverData as DriverRow | null) ?? null);
     DESPUÉS: setDriver(safeParseOne(driverRowSchema, driverData, "profile:driver"));
   - Línea 68: ANTES: setVehicles((vehData as VehicleRow[] | null) ?? []);
     DESPUÉS: setVehicles(safeParseArray(vehicleRowSchema, vehData, "profile:vehicles"));
   - Línea 186: ANTES: {(driver as Record<string, unknown> | null)?.[doc.field] ? "✓ Cargado" : "Subir"}
     DESPUÉS: {driver?.[doc.field as keyof DriverRow] ? "✓ Cargado" : "Subir"}
     (Funciona porque DriverRow tiene los campos tipados como nullable strings)

5. Actualizar apps/web/app/(app)/tracking/page.tsx:
   - ELIMINAR las definiciones locales de ChatMessage, ShipmentEvidence, ShipmentDispute (líneas 10-32)
   - Importar desde @/lib/schemas/supabase-rows
   - Línea 81: ANTES: setChatMessages(((json?.messages as ChatMessage[] | undefined) ?? []));
     DESPUÉS: setChatMessages(safeParseArray(chatMessageSchema, json?.messages, "tracking:chat"));
   - Línea 96: setChatMessages → setEvidence con evidenceSchema
   - Línea 111: idem con disputeSchema

Tests (apps/web/__tests__/lib/schemas-supabase-rows.test.ts):
- profileRowSchema acepta datos válidos con todos los campos
- profileRowSchema acepta datos con campos opcionales ausentes
- profileRowSchema rechaza datos con role inválido ("superadmin")
- shipmentRowSchema rechaza status inválido ("flying")
- safeParseArray retorna array vacío cuando recibe null
- safeParseArray filtra items inválidos y retorna solo los válidos
- safeParseOne retorna null y loguea cuando data no coincide con schema

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H5: Rate limiting distribuido con Upstash Redis

Prompt para Cursor:
```
Reemplazá el rate limiter in-memory por uno distribuido que funcione en Vercel.

Problema actual:
- lib/rate-limit.ts usa un Map en memoria que:
  a. Se pierde en cada deploy o cold start de la serverless function
  b. No se comparte entre instancias (cada request puede ir a una función distinta)
  c. Tiene memory leak: las entries del Map nunca se limpian
  d. No funciona en producción con Vercel (múltiples serverless instances)

Implementación:

1. Instalar @upstash/ratelimit y @upstash/redis:
   pnpm add @upstash/ratelimit @upstash/redis --filter=web

2. Reescribir apps/web/lib/rate-limit.ts:

   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'

   // En dev sin Redis configurado, usar fallback permisivo
   const redis = process.env.UPSTASH_REDIS_REST_URL
     ? new Redis({
         url: process.env.UPSTASH_REDIS_REST_URL,
         token: process.env.UPSTASH_REDIS_REST_TOKEN!,
       })
     : null

   export function createRateLimiter(opts: { requests: number; window: string }) {
     if (!redis) {
       // Dev fallback: siempre permite (loguear warning una vez)
       return {
         limit: async (_identifier: string) => ({ success: true, remaining: opts.requests, reset: 0 }),
       }
     }
     return new Ratelimit({
       redis,
       limiter: Ratelimit.slidingWindow(opts.requests, opts.window),
       analytics: true,
       prefix: 'fletaya',
     })
   }

   // Presets para los distintos endpoints
   export const apiLimiter = createRateLimiter({ requests: 30, window: '1m' })
   export const trackingLimiter = createRateLimiter({ requests: 240, window: '1m' })
   export const authLimiter = createRateLimiter({ requests: 5, window: '15m' })
   export const chatLimiter = createRateLimiter({ requests: 20, window: '1m' })

3. Actualizar las API routes que usan rate limiting:
   - api/shipments/route.ts → usar apiLimiter
   - api/tracking/route.ts → usar trackingLimiter
   - api/shipments/[id]/chat/route.ts → usar chatLimiter
   - Agregar rate limiting al nuevo endpoint api/shipments/[id]/status/route.ts (del PASO H1)

4. Agregar las env vars a apps/web/.env.example:
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=

5. Actualizar apps/web/.env.example con instrucciones:
   # Rate limiting (Upstash Redis) — opcional en dev, requerido en prod
   # Crear cuenta gratis en https://upstash.com y copiar REST URL + Token

Tests:
- apps/web/__tests__/lib/rate-limit.test.ts:
  - Test que sin env vars, el fallback siempre retorna success
  - Test que con Redis mockeado, respeta el límite (mockear @upstash/redis)
  - Test que el identificador se construye correctamente (IP o userId)

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H6: Proteger documentos sensibles en Supabase Storage

Prompt para Cursor:
```
Corregí la exposición pública de documentos de identidad en Supabase Storage.

Problema actual — código exacto que expone documentos PII:

EN apps/web/app/(app)/profile/page.tsx línea 107:
  const url = supabase.storage.from("dni-documents").getPublicUrl(path).data.publicUrl;

Esto genera una URL pública permanente al DNI, licencia, seguro y VTV del fletero.
Cualquier persona con esa URL puede acceder al documento sin autenticación.
Estos son documentos de identidad (PII) — DNI argentino con foto, dirección, CUIL.

El upload path sí incluye userId (línea 98):
  const path = `${user.id}/${field}-${Date.now()}-${file.name}`;

Pero el getPublicUrl() anula la protección porque genera un link accesible sin auth.

EN apps/web/app/(app)/tracking/page.tsx línea 180 (evidence upload):
  const publicUrl = supabase.storage.from("shipment-evidence").getPublicUrl(filePath).data.publicUrl;

Misma vulnerabilidad con fotos de evidencia del envío (fotos de la carga, daños, etc.).

Implementación:

1. Migración SQL para políticas de Storage:

   Crear packages/supabase/migrations/008_storage_rls.sql:

   -- Políticas RLS para el bucket "dni-documents" (PRIVATE)
   -- Solo el propietario puede leer sus propios documentos
   CREATE POLICY "Users can read own documents"
     ON storage.objects FOR SELECT
     USING (
       bucket_id = 'dni-documents'
       AND auth.uid()::text = (storage.foldername(name))[1]
     );

   CREATE POLICY "Users can upload own documents"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'dni-documents'
       AND auth.uid()::text = (storage.foldername(name))[1]
     );

   CREATE POLICY "Users can update own documents"
     ON storage.objects FOR UPDATE
     USING (
       bucket_id = 'dni-documents'
       AND auth.uid()::text = (storage.foldername(name))[1]
     );

   CREATE POLICY "Users can delete own documents"
     ON storage.objects FOR DELETE
     USING (
       bucket_id = 'dni-documents'
       AND auth.uid()::text = (storage.foldername(name))[1]
     );

   -- Nota: las fotos de evidencia también deben protegerse
   -- Solo participantes del shipment pueden ver evidencia
   CREATE POLICY "Shipment participants can read evidence"
     ON storage.objects FOR SELECT
     USING (
       bucket_id = 'shipment-evidence'
       AND EXISTS (
         SELECT 1 FROM shipments s
         LEFT JOIN drivers d ON d.id = s.driver_id
         WHERE s.id::text = (storage.foldername(name))[1]
         AND (s.client_id = auth.uid() OR d.user_id = auth.uid())
       )
     );

2. Actualizar apps/web/app/(app)/profile/page.tsx:
   REEMPLAZAR función uploadDoc (líneas 78-127).

   Cambios clave:
   a. Línea 107 — ELIMINAR getPublicUrl, usar createSignedUrl:
      ANTES:
        const url = supabase.storage.from("dni-documents").getPublicUrl(path).data.publicUrl;

      DESPUÉS:
        const { data: signedData, error: signError } = await supabase.storage
          .from("dni-documents")
          .createSignedUrl(path, 3600); // 1 hora
        if (signError || !signedData?.signedUrl) {
          setMessage("No se pudo generar la URL del documento.");
          return;
        }
        const url = signedData.signedUrl;

   b. Agregar validación de tamaño ANTES del upload (antes de línea 99):
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        setMessage("El archivo supera el límite de 10MB.");
        return;
      }
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMessage("Solo se permiten archivos JPEG, PNG o PDF.");
        return;
      }

   c. Para mostrar documentos ya cargados: cuando se necesite mostrar el documento,
      generar signed URL on-demand (no guardar URL pública en la DB):
      - La DB guarda el PATH del archivo (ej: "uuid/dni_front_url-123456-foto.jpg")
      - Al mostrar, llamar createSignedUrl(path, 3600)
      - El signed URL expira en 1 hora — nunca se expone permanentemente

3. Actualizar apps/web/app/(app)/tracking/page.tsx evidence upload (línea 180):
   ANTES:
     const publicUrl = supabase.storage.from("shipment-evidence").getPublicUrl(filePath).data.publicUrl;

   DESPUÉS:
     const { data: signedData, error: signError } = await supabase.storage
       .from("shipment-evidence")
       .createSignedUrl(filePath, 3600);
     if (signError || !signedData?.signedUrl) {
       setFeedback("No se pudo generar la URL de la evidencia.");
       return;
     }
     const fileUrl = signedData.signedUrl;
     // Nota: para la DB, guardar el PATH (filePath), no la signed URL
     // Al mostrar evidencia, regenerar signed URL on-demand

4. Crear apps/web/app/api/documents/signed-url/route.ts:

   import { NextRequest, NextResponse } from "next/server";
   import { createServerSupabase } from "@/lib/supabase-server";

   export async function GET(req: NextRequest) {
     const supabase = createServerSupabase();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

     const path = new URL(req.url).searchParams.get("path");
     if (!path) return NextResponse.json({ error: "path requerido" }, { status: 400 });

     // SEGURIDAD: verificar que el path comience con el userId del usuario autenticado
     const bucket = new URL(req.url).searchParams.get("bucket") || "dni-documents";
     if (bucket === "dni-documents" && !path.startsWith(user.id)) {
       return NextResponse.json({ error: "No tenés acceso a este documento" }, { status: 403 });
     }

     const { data, error } = await supabase.storage
       .from(bucket)
       .createSignedUrl(path, 3600); // 1 hora
     if (error) return NextResponse.json({ error: error.message }, { status: 500 });

     return NextResponse.json({ signedUrl: data.signedUrl });
   }

5. Instrucciones manuales para Supabase Dashboard:
   - Storage → Buckets → "dni-documents":
     - Verificar que "Public" esté DESACTIVADO
     - Si está público, cambiarlo a privado
   - Storage → Buckets → "shipment-evidence":
     - Verificar que "Public" esté DESACTIVADO
   - Las RLS policies se aplican via la migración SQL de arriba

6. Actualizar el PASO 0 de esta guía para que la creación de buckets sea:
   # 6. Crear buckets en Supabase Storage:
   # - dni-documents → PRIVATE, RLS enabled (documentos PII)
   # - shipment-evidence → PRIVATE, RLS enabled (fotos de carga)
   # - vehicle-photos → PUBLIC (fotos del vehículo, no PII)
   # - avatars → PUBLIC

Tests:
- apps/web/__tests__/api/documents-signed-url.test.ts:
  - GET sin sesión → 401
  - GET con path de otro usuario (path no comienza con userId) → 403
  - GET con path propio → 200 + signedUrl
  - GET sin path → 400

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H7: Refactorizar tracking/page.tsx (487 líneas → componentes)

Prompt para Cursor:
```
Descomponé tracking/page.tsx en sub-componentes manejables.

Problema actual — el archivo apps/web/app/(app)/tracking/page.tsx tiene 487 líneas y mezcla
6 responsabilidades distintas en un solo componente:

SECCIONES ACTUALES DEL ARCHIVO:
  Líneas 10-32:   Definiciones de tipos locales (ChatMessage, ShipmentEvidence, ShipmentDispute)
                   → Mover a schemas/supabase-rows.ts (ya hecho en H4)
  Líneas 34-55:   Constantes y utilidades (STATUSES, QUICK_MESSAGES, safeParseJson)
  Líneas 57-68:   Estado del componente (13 hooks useState)
  Líneas 75-118:  Tres funciones loadChat/loadEvidence/loadDisputes CASI IDÉNTICAS:

    const loadChat = useCallback(async () => {      // línea 75
      try {
        if (!shipmentId) return;
        const res = await fetch(`/api/shipments/${shipmentId}/chat`);
        const json = await safeParseJson(res);
        if (res.ok) { setChatMessages(((json?.messages as ChatMessage[] | undefined) ?? [])); return; }
        setFeedback((json?.error as string | undefined) ?? "No se pudo cargar el chat.");
      } catch { setFeedback("No se pudo cargar el chat."); }
    }, [shipmentId]);

    const loadEvidence = useCallback(async () => {   // línea 90 — MISMO PATRÓN
    const loadDisputes = useCallback(async () => {   // línea 105 — MISMO PATRÓN

  Líneas 120-143: useEffect + Supabase Realtime subscription
  Líneas 146-217: Funciones de acción (sendChat, uploadEvidence, reportProblem)
  Líneas 219-268: UI — Status bar + progress + timeline
  Líneas 269-310: UI — Shipment info + botones de status (CONTROLES DE DEBUG)
  Líneas 313-324: UI — Driver contact (DATOS HARDCODEADOS: "Rating 4.8 · Camioneta")
  Líneas 326-368: UI — Chat panel
  Líneas 371-416: UI — Evidence upload
  Líneas 419-461: UI — Dispute form
  Líneas 469-476: UI — Backlog roadmap (NO debería estar en la UI de producción)

DATOS HARDCODEADOS a eliminar:
  Línea 61:  const [eta, setEta] = useState(25);    // ETA siempre 25 min
  Línea 318: <p className="text-xs text-fy-dim">Rating 4.8 · Camioneta</p>  // driver fake
  Línea 282: setEta((x) => Math.max(5, x - 2));     // ETA decrece arbitrariamente al compartir ubicación

Implementación:

1. Crear apps/web/lib/hooks/use-shipment-resource.ts:
   Hook genérico que reemplaza las 3 funciones idénticas:

   import { useCallback, useEffect, useState } from "react";
   import type { z } from "zod";
   import { safeParseArray } from "@/lib/schemas/supabase-rows";

   export function useShipmentResource<T>(
     shipmentId: string | null,
     resource: "chat" | "evidence" | "disputes",
     schema: z.ZodType<T>,
   ) {
     const [data, setData] = useState<T[]>([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const load = useCallback(async () => {
       if (!shipmentId) return;
       setLoading(true);
       setError(null);
       try {
         const res = await fetch(`/api/shipments/${shipmentId}/${resource}`);
         if (!res.ok) {
           const json = await res.json().catch(() => ({}));
           setError(json.error ?? `No se pudo cargar ${resource}.`);
           return;
         }
         const json = await res.json();
         // La API retorna { messages: [] } o { evidence: [] } o { disputes: [] }
         const key = resource === "chat" ? "messages" : resource;
         setData(safeParseArray(schema, json[key], `tracking:${resource}`));
       } catch {
         setError(`No se pudo cargar ${resource}.`);
       } finally {
         setLoading(false);
       }
     }, [shipmentId, resource, schema]);

     useEffect(() => { void load(); }, [load]);

     return { data, loading, error, refetch: load };
   }

2. Crear sub-componentes en apps/web/components/tracking/:

   a. chat-panel.tsx (mueve líneas 326-368 del tracking/page.tsx actual):
      Props: { shipmentId: string }
      - Usa useShipmentResource("chat", chatMessageSchema)
      - QUICK_MESSAGES constante movida aquí
      - Form con input + botón enviar
      - Lista de mensajes con timestamp formateado
      - Suscripción Realtime para nuevos mensajes (mover el channel de líneas 126-143)
      ~80 líneas

   b. evidence-panel.tsx (mueve líneas 371-416):
      Props: { shipmentId: string }
      - Usa useShipmentResource("evidence", evidenceSchema)
      - Dos inputs file (pre-carga / post-carga)
      - Grid de evidencia existente con links
      - Validación de tipo y tamaño de archivo antes del upload
      ~70 líneas

   c. dispute-panel.tsx (mueve líneas 419-461):
      Props: { shipmentId: string }
      - Usa useShipmentResource("disputes", disputeSchema)
      - Select con razones + textarea + botón
      - Lista de disputas activas con status y fecha
      ~60 líneas

   d. driver-card.tsx (mueve líneas 313-324):
      Props: { shipmentId: string }
      - Fetch del driver asignado desde Supabase: JOIN shipments → drivers → profiles → vehicles
      - Mostrar: avatar, nombre, rating (real), vehículo activo (real), total de viajes
      - Botones "Chat" (scroll al chat panel) y "Llamar" (tel: link al phone del driver)
      - Loading skeleton mientras carga
      - NO usar datos hardcodeados
      ~50 líneas

   e. status-timeline.tsx (mueve líneas 245-267):
      Props: { currentStatus: string }
      - Importar STATUS_META de @shared/types
      - Timeline vertical con dot indicator (activo = brand-teal-light pulsante)
      - Solo lectura — sin botones de acción
      ~40 líneas

3. Reescribir apps/web/app/(app)/tracking/page.tsx:

   Target: < 100 líneas. Solo coordina layout e imports:

   "use client";
   import { Suspense } from "react";
   import { useSearchParams } from "next/navigation";
   import { useRealtimeShipmentStatus, useRealtimeTracking } from "@/lib/hooks";
   import { STATUS_META } from "@shared/types";
   import { ChatPanel } from "@/components/tracking/chat-panel";
   import { EvidencePanel } from "@/components/tracking/evidence-panel";
   import { DisputePanel } from "@/components/tracking/dispute-panel";
   import { DriverCard } from "@/components/tracking/driver-card";
   import { StatusTimeline } from "@/components/tracking/status-timeline";

   function TrackingContent() {
     const searchParams = useSearchParams();
     const shipmentId = searchParams?.get("shipmentId") ?? null;
     const status = useRealtimeShipmentStatus(shipmentId);
     useRealtimeTracking(shipmentId);
     const current = STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.pending;

     if (!shipmentId) return <p>No se especificó un envío.</p>;

     return (
       <div className="px-4 sm:px-5 py-5 pb-10 max-w-lg mx-auto min-w-0 space-y-4">
         {/* Status bar + progress */}
         <section className="rounded-2xl border ...">
           <p>{current.label}</p>
           {/* progress bar basado en index del status */}
         </section>

         <StatusTimeline currentStatus={status} />
         <DriverCard shipmentId={shipmentId} />
         <ChatPanel shipmentId={shipmentId} />
         <EvidencePanel shipmentId={shipmentId} />
         <DisputePanel shipmentId={shipmentId} />
       </div>
     );
   }

4. ELIMINAR completamente:
   - Bloque "Backlog Marketplace 2026" (líneas 469-476) — roadmap no va en la UI de producción
   - Botones de "Cambiar estado" del cliente (líneas 287-310) — movidos al endpoint del backend (H1)
   - ETA hardcodeado (línea 61) — calcular desde distancia restante + velocidad promedio
   - Driver contact hardcodeado (línea 318) — reemplazado por DriverCard con datos reales
   - Botón "Compartir ubicación (fletero)" (líneas 273-286) — mover a la vista del driver, no del cliente

Tests:
- apps/web/__tests__/components/tracking/chat-panel.test.tsx:
  - Render con mensajes → muestra lista
  - Enviar mensaje → llama fetch POST
  - Quick message → envía con quickTag

- apps/web/__tests__/components/tracking/evidence-panel.test.tsx:
  - Render con evidencia → muestra grid
  - Upload file → llama Supabase storage + fetch POST

- apps/web/__tests__/components/tracking/status-timeline.test.tsx:
  - Render con status "in_transit" → marca los pasos hasta in_transit como completados
  - Render con status "pending" → solo primer paso activo

- apps/web/__tests__/lib/hooks/use-shipment-resource.test.ts:
  - Fetch success → retorna data parseada
  - Fetch error → retorna error string
  - shipmentId null → no hace fetch

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H8: Tests del flujo crítico end-to-end

Prompt para Cursor:
```
Escribí tests completos para el flujo crítico: auth → crear envío → tracking.

Problema actual:
- Mobile app tiene 0 tests
- Web tests son mayormente stubs (~5% cobertura real)
- No hay tests de integración para el flujo principal
- Tests existentes no cubren error paths

Implementación:

1. Completar apps/web/__tests__/api/shipments.test.ts:
   - POST con datos válidos → 201 + shipment ID
   - POST sin sesión → 401
   - POST con datos incompletos → 400 con errores de validación específicos
   - POST con más de 5 legs → 400
   - POST rate limited → 429
   - GET como cliente → solo tus shipments
   - GET como driver → solo shipments asignados a vos

2. Completar apps/web/__tests__/api/chat-route.test.ts:
   - GET sin acceso al shipment → 403
   - POST con mensaje vacío → 400
   - POST con XSS payload → sanitizado o rechazado
   - POST rate limited → 429

3. Completar apps/web/__tests__/api/disputes-route.test.ts:
   - POST con razón vacía → 400
   - POST con razón > 1000 chars → 400
   - POST sin acceso al shipment → 403

4. Completar apps/web/__tests__/components/ShipmentWizard.test.tsx:
   - Render paso 1 con inputs vacíos
   - Agregar un tramo → verificar que aparece en el form
   - Intentar avanzar sin completar campos → mostrar errores
   - Completar los 4 pasos y submit → verificar fetch a /api/shipments
   - Verificar que el desglose de precio se muestra correctamente

5. Completar apps/web/__tests__/components/LiveTracking.test.tsx:
   - Render con shipmentId válido → mostrar mapa placeholder
   - Simular payload de Supabase Realtime → verificar que marker se actualiza
   - Simular cambio de status → verificar que timeline se actualiza
   - Sin shipmentId → mostrar error

6. Completar apps/web/__tests__/lib/hooks.test.ts:
   - useSession: retorna null cuando no hay sesión
   - useSession: retorna user cuando hay sesión válida
   - useRealtimeTracking: parsea WKT POINT correctamente
   - useRealtimeTracking: ignora payload malformado sin crashear
   - useRealtimeShipmentStatus: actualiza status en tiempo real
   - useSupabaseQuery: retorna error cuando query falla

7. Crear apps/web/__tests__/lib/pricing.test.ts (si no existe de H2):
   - Verificar consistencia de cálculo entre frontend y backend

8. Crear apps/mobile/__tests__/ con al menos:
   - auth/login.test.tsx: render, botón Google, botón email
   - shipment/new.test.tsx: render wizard, validación de campos

Cada test debe cubrir: happy path, error path, edge case.
Mockear Supabase con vi.mock, no hacer calls reales.

Ejecutar pnpm test:web y pnpm lint.
```

---

## PASO H9: Limpiar código muerto, datos demo y controles de debug

Prompt para Cursor:
```
Hacé una limpieza general del código para dejarlo listo para producción.
No agregar features nuevas. Solo limpiar.

Tareas con ubicación exacta:

1. ELIMINAR datos demo hardcodeados del dashboard:

   En apps/web/app/(app)/dashboard/page.tsx:

   a. Líneas 144-163 — array de viajes demo que se muestra cuando no hay backhaul trips reales:
      : [
            {
              id: "demo-1",
              from: "Palermo",
              to: "Avellaneda",
              price: "8.500",
              ...
            },
            {
              id: "demo-2",
              from: "Belgrano",
              to: "Quilmes",
              ...
            },
          ]
      → ELIMINAR el fallback de datos demo. Si no hay backhaul trips, mostrar un mensaje
        tipo "No hay viajes de retorno disponibles en tu zona" en vez de datos ficticios.

   b. Líneas 130-132 — comentario que delata datos falsos:
      <p className="text-[11px] text-fy-dim mb-6 px-1">
        El ejemplo de "viaje activo" es ilustrativo hasta que conectemos tu historial con Supabase.
      </p>
      → ELIMINAR este párrafo completo. Los datos ya vienen de Supabase via useSupabaseQuery.

   c. Línea 136 — badge "Pronto en vivo" al lado de "Viajes de retorno":
      <span className="text-brand-teal-light text-xs font-semibold">Pronto en vivo</span>
      → ELIMINAR o cambiar por badge de cantidad si hay trips reales.

2. ELIMINAR controles de debug del tracking (si no se hizo en H7):

   En apps/web/app/(app)/tracking/page.tsx:
   - Líneas 287-310: bloque completo de botones "Cambiar estado" con grid de 5 botones
   - Líneas 469-476: sección "Backlog Marketplace 2026" con roadmap en la UI
   - Línea 61: `const [eta, setEta] = useState(25)` — ETA hardcodeado
   - Línea 282: `setEta((x) => Math.max(5, x - 2))` — decremento artificial del ETA

3. Corregir shipment types duplicados en mobile:

   En apps/mobile/app/(tabs)/search.tsx, los tipos de envío están hardcodeados como strings.
   → Importar ShipmentType o SHIPMENT_TYPES de @shared/types en vez de duplicar el array.

   Verificar también en:
   - apps/web/app/(app)/shipment/page.tsx líneas 168-175 (select options)
   - apps/mobile/app/shipment/new.tsx
   Todos deben importar de la misma fuente en packages/shared.

4. Corregir accesibilidad en la navegación:

   En apps/web/app/(app)/layout.tsx líneas 30-48, el nav usa emojis como iconos:
   { href: "/dashboard", icon: "⌂", label: "Inicio" },
   { href: "/shipment", icon: "◎", label: "Envío" },
   { href: "/tracking", icon: "📍", label: "Mapa" },
   { href: "/profile", icon: "◉", label: "Perfil" },

   El span del icon tiene aria-hidden (línea 41), lo cual está bien.
   PERO: cada <Link> no tiene aria-label. Agregar:
     aria-label={tab.label}
   al componente Link (línea 37) para que screen readers lean "Inicio", "Envío", etc.

   También en el header (línea 17-23), el link de settings ya tiene aria-label="Configuración" ✓

5. Eliminar console.log innecesarios:

   Buscar con grep en todo el proyecto:
   - console.log → eliminar si no es error handling
   - console.error → dejar solo los que son genuinos (errores de fetch, geolocation)
   - console.warn → evaluar caso por caso

   Específicamente:
   - lib/hooks/index.ts línea 152: console.error("Geolocation error:", err) → mantener
   - Cualquier console.log de debug → eliminar

6. Eliminar TODOs y comentarios obsoletos:

   Buscar en el codebase:
   - "TODO" → resolver o eliminar
   - "FIXME" → resolver
   - "HACK" → resolver o documentar por qué es necesario
   - "Próximo:" → eliminar (son de secciones settings/page.tsx)
   - "pendiente" → evaluar
   - "por implementar" → evaluar

   En apps/web/app/(app)/settings/page.tsx, TODAS las secciones son placeholder
   (líneas 6-55 tienen texto "Próximo: UI editable" o similar).
   → Dejar la estructura pero reemplazar "Próximo: UI editable" por un mensaje más limpio
     como "Configuración disponible próximamente" o simplemente ocultar las secciones no funcionales.

7. Coordenadas hardcodeadas en shipment wizard:

   En apps/web/app/(app)/shipment/page.tsx líneas 123-126 y 134-137:
     updateLeg(i, "from", e.target.value, {
       lat: -34.6037 + i * 0.01,    // ← coordenadas fake incrementales
       lng: -58.3816 + i * 0.01,
     })
   → Esto es un placeholder hasta que se integre Google Places Autocomplete (PASO 4).
     Agregar un comentario explícito: // TODO(PASO-4): reemplazar con coords de Google Places
     O eliminar las coords fake y dejar null hasta que Places esté integrado.

Ejecutar pnpm test:web y pnpm lint.
```

---

## Orden recomendado de ejecución

| Paso | Prioridad | Dependencias | Descripción |
|------|-----------|--------------|-------------|
| **H1** | 🔴 Crítica | Ninguna | Auth middleware centralizado + mover status updates al backend |
| **H6** | 🔴 Crítica | Ninguna | Proteger documentos PII en Storage |
| **H2** | 🔴 Alta | Ninguna | Consolidar pricing en shared package |
| **H3** | 🟡 Alta | H2 (usa pricing en RPC) | Transacciones de DB |
| **H4** | 🟡 Alta | Ninguna | Eliminar `as any`, agregar Zod runtime validation |
| **H5** | 🟡 Media | H1 (rate limit en nuevas rutas) | Rate limiting distribuido |
| **H7** | 🟡 Media | H1, H4 | Refactorizar tracking page |
| **H8** | 🟢 Media | H1–H7 (testear lo nuevo) | Tests completos del flujo crítico |
| **H9** | 🟢 Baja | H7 (después de refactor) | Limpieza general |

> **H1 y H6 son bloqueantes para producción** — no lanzar sin cerrar las vulnerabilidades de seguridad.
> H2–H4 mejoran la mantenibilidad y previenen bugs de consistencia.
> H5–H9 son polish y calidad.

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
