# FleteYa - Checklist de deploy (Vercel + Supabase + Google OAuth)

## 1) Variables en Vercel

Proyecto en Vercel -> `Settings` -> `Environment Variables`.

Definir para `Production` (y recomendado también en `Preview`):

- `NEXT_PUBLIC_APP_URL` -> URL publica del frontend (ej: `https://fletaya.com.ar`).
- `NEXT_PUBLIC_SUPABASE_URL` -> URL del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` -> publishable key publica de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` -> service role key (solo server-side).
- `ASSIGNMENT_RUN_SECRET` -> secreto fuerte para endpoint de asignacion.
- `NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH` -> `false` (o ausente) si Facebook no se usa.

Nota: para mobile (Expo), las env `EXPO_PUBLIC_*` se manejan en `apps/mobile/.env` o EAS.

## 2) Configuracion Google OAuth en Supabase

Supabase Dashboard -> `Authentication` -> `Providers` -> `Google`:

- Activar provider Google.
- Completar:
  - `Client ID`
  - `Client Secret`

Si falta el secret, Supabase responde:
`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`.

## 3) Redirect URL matrix (Google + Supabase + Frontend)

### Supabase Auth

En `Authentication` -> `URL Configuration`:

- `Site URL`:
  - Produccion: `https://fletaya.com.ar`
  - Dev local (si trabajas local): `http://localhost:3000`
- `Additional Redirect URLs` (agregar previews):
  - `https://*.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

### Google Cloud Console (OAuth Client)

En `APIs & Services` -> `Credentials` -> OAuth 2.0 Client:

- `Authorized JavaScript origins`:
  - `https://fletaya.com.ar`
  - `https://<tu-proyecto>.vercel.app` (si aplica)
  - `http://localhost:3000` (dev)
- `Authorized redirect URIs`:
  - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

## 4) Post-deploy checklist

1. Hacer redeploy en Vercel despues de guardar env vars.
2. Probar login Google en:
   - local
   - preview de Vercel
   - produccion
3. Verificar callback web:
   - `/auth/callback` completa sesion y redirige segun `next`.
4. Verificar SEO runtime:
   - `/sitemap.xml`
   - `/robots.txt`
   - metadata/canonical en landing e institucional.
5. Verificar flows web:
   - login -> onboarding -> dashboard -> shipment -> confirmation -> tracking -> profile/settings.
6. Verificar flows mobile:
   - auth -> tabs -> shipment/new -> tracking/[id] -> account/docs -> vehicles.
7. Verificar politica fletero:
   - sin ubicacion activa/permisos, app bloqueada para fletero.

## 5) Troubleshooting rapido

- Error `missing OAuth secret`:
  - revisar que Google provider tenga `Client Secret` en Supabase.
- Error de callback:
  - revisar `Site URL` y `Additional Redirect URLs` en Supabase.
  - revisar `NEXT_PUBLIC_APP_URL` en Vercel.
- Build falla por env publica faltante:
  - confirmar `NEXT_PUBLIC_SUPABASE_URL` y publishable key en Vercel.
