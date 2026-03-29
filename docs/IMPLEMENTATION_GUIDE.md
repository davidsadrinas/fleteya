# FleteYa - Guia de Implementacion de Servicios Nuevos

Guia detallada de implementacion para cada servicio pendiente, siguiendo los patrones existentes del codebase (Zod validation, rate limiting, service role Supabase, error reporting, graceful degradation).

---

## Indice

1. [RENAPER - Validacion de Identidad](#1-renaper---validacion-de-identidad)
2. [OCR y Procesamiento de Imagenes](#2-ocr-y-procesamiento-de-imagenes)
3. [Email Transaccional](#3-email-transaccional)
4. [Facturacion Electronica AFIP](#4-facturacion-electronica-afip)
5. [WhatsApp Business API](#5-whatsapp-business-api)
6. [Seguro de Carga](#6-seguro-de-carga)
7. [SMS Transaccional](#7-sms-transaccional)
8. [Calculo de Rutas Reales](#8-calculo-de-rutas-reales)
9. [Analytics](#9-analytics)

---

## 1. RENAPER - Validacion de Identidad

### Objetivo

Reemplazar la verificacion manual de DNI/licencia por un admin con una validacion automatica contra la base de datos de RENAPER (Registro Nacional de las Personas).

### Acceso a la API

RENAPER no ofrece acceso directo publico. Hay dos caminos:

**Opcion A: Proveedor intermediario (recomendado para startups)**
- **Nosis Identity** — `https://api.nosis.com/v1/identity/verify`
- **4identity** — verificacion biometrica
- **Veraz (Equifax)** — validacion documental

**Opcion B: Convenio directo con RENAPER**
- Requiere ser persona juridica
- Solicitar en [tramitesadistancia.gob.ar](https://tramitesadistancia.gob.ar)
- Proceso de homologacion (~2-3 meses)

### Variables de entorno

```env
# --- RENAPER / Verificacion de Identidad ------------------------------------
RENAPER_PROVIDER=nosis                    # nosis | 4identity | renaper_direct
RENAPER_API_URL=https://api.nosis.com/v1
RENAPER_API_KEY=
RENAPER_API_SECRET=
```

### Migracion de base de datos

```sql
-- packages/supabase/migrations/011_identity_verification.sql

-- Resultados de verificacion de identidad
CREATE TABLE identity_verifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id      uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  provider       text NOT NULL,                         -- 'nosis', '4identity', 'renaper'
  document_type  text NOT NULL CHECK (document_type IN ('dni', 'license')),
  document_number text NOT NULL,
  status         text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'error')),
  confidence     numeric(5,2),                          -- 0.00 a 100.00
  raw_response   jsonb DEFAULT '{}'::jsonb,             -- respuesta cruda del proveedor
  rejection_reason text,
  verified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indice para buscar por driver
CREATE INDEX idx_identity_verifications_driver ON identity_verifications(driver_id);

-- RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Solo admins y el propio conductor pueden ver
CREATE POLICY "Drivers ven sus verificaciones"
  ON identity_verifications FOR SELECT
  USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Agregar campo al driver para tracking rapido
ALTER TABLE drivers ADD COLUMN identity_verification_id uuid REFERENCES identity_verifications(id);
ALTER TABLE drivers ADD COLUMN license_verification_id uuid REFERENCES identity_verifications(id);
```

### Lib: Cliente de verificacion

```
apps/web/lib/identity/
  ├── index.ts          -- funcion principal verifyIdentity()
  ├── providers/
  │   ├── nosis.ts      -- implementacion Nosis
  │   ├── 4identity.ts  -- implementacion 4identity
  │   └── renaper.ts    -- implementacion directa RENAPER
  └── types.ts          -- interfaces compartidas
```

**`apps/web/lib/identity/types.ts`**

```typescript
export interface VerificationRequest {
  documentType: "dni" | "license";
  documentNumber: string;
  fullName: string;
  birthDate?: string;          // YYYY-MM-DD
  gender?: "M" | "F";
  frontImageUrl: string;       // URL firmada de Supabase Storage
  backImageUrl?: string;
  selfieUrl?: string;          // para comparacion facial
}

export interface VerificationResult {
  status: "verified" | "rejected" | "error";
  confidence: number;          // 0-100
  rejectionReason?: string;
  rawResponse: Record<string, unknown>;
  matchDetails: {
    nameMatch: boolean;
    numberMatch: boolean;
    faceMatch?: boolean;       // si se envio selfie
    documentExpired: boolean;
  };
}

export interface IdentityProvider {
  readonly name: string;
  verify(request: VerificationRequest): Promise<VerificationResult>;
}
```

**`apps/web/lib/identity/providers/nosis.ts`**

```typescript
import type { IdentityProvider, VerificationRequest, VerificationResult } from "../types";

const NOSIS_API_URL = process.env.RENAPER_API_URL;
const NOSIS_API_KEY = process.env.RENAPER_API_KEY;
const NOSIS_API_SECRET = process.env.RENAPER_API_SECRET;

export const nosisProvider: IdentityProvider = {
  name: "nosis",

  async verify(request: VerificationRequest): Promise<VerificationResult> {
    if (!NOSIS_API_URL || !NOSIS_API_KEY) {
      return { status: "error", confidence: 0, rawResponse: {},
               rejectionReason: "Proveedor no configurado",
               matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false } };
    }

    const response = await fetch(`${NOSIS_API_URL}/identity/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NOSIS_API_KEY}`,
        "X-Api-Secret": NOSIS_API_SECRET!,
      },
      body: JSON.stringify({
        document_type: request.documentType === "dni" ? "DNI" : "LIC",
        document_number: request.documentNumber,
        full_name: request.fullName,
        birth_date: request.birthDate,
        gender: request.gender,
        front_image_url: request.frontImageUrl,
        back_image_url: request.backImageUrl,
        selfie_url: request.selfieUrl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        status: "error",
        confidence: 0,
        rejectionReason: `API error: ${response.status}`,
        rawResponse: { error: errorBody },
        matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false },
      };
    }

    const data = await response.json();

    // Mapear respuesta del proveedor al formato interno
    const confidence = data.confidence_score ?? 0;
    const THRESHOLD = 75; // umbral de aprobacion

    return {
      status: confidence >= THRESHOLD ? "verified" : "rejected",
      confidence,
      rejectionReason: confidence < THRESHOLD
        ? `Confianza insuficiente: ${confidence}% (minimo ${THRESHOLD}%)`
        : undefined,
      rawResponse: data,
      matchDetails: {
        nameMatch: data.name_match ?? false,
        numberMatch: data.document_match ?? false,
        faceMatch: data.face_match ?? undefined,
        documentExpired: data.document_expired ?? false,
      },
    };
  },
};
```

**`apps/web/lib/identity/index.ts`**

```typescript
import { nosisProvider } from "./providers/nosis";
import type { IdentityProvider, VerificationRequest, VerificationResult } from "./types";

const providers: Record<string, IdentityProvider> = {
  nosis: nosisProvider,
};

function getProvider(): IdentityProvider | null {
  const providerName = process.env.RENAPER_PROVIDER ?? "nosis";
  return providers[providerName] ?? null;
}

export async function verifyIdentity(
  request: VerificationRequest
): Promise<VerificationResult> {
  const provider = getProvider();

  if (!provider) {
    console.warn("[Identity] No provider configured, skipping verification");
    return {
      status: "error",
      confidence: 0,
      rejectionReason: "No hay proveedor de verificacion configurado",
      rawResponse: {},
      matchDetails: { nameMatch: false, numberMatch: false, documentExpired: false },
    };
  }

  return provider.verify(request);
}

export function isIdentityConfigured(): boolean {
  return !!process.env.RENAPER_API_KEY;
}
```

### API Route

**`apps/web/app/api/admin/drivers/[id]/verify/route.ts`** — modificar el endpoint existente:

```typescript
// Agregar al flujo de verificacion actual:
import { verifyIdentity, isIdentityConfigured } from "@/lib/identity";

// Dentro del PATCH handler, antes de aprobar:
if (action === "approve" && isIdentityConfigured()) {
  // Obtener URLs firmadas de los documentos del conductor
  const frontUrl = await getSignedUrl(driver.dni_front_url);
  const backUrl = await getSignedUrl(driver.dni_back_url);
  const selfieUrl = await getSignedUrl(driver.selfie_url);

  const result = await verifyIdentity({
    documentType: "dni",
    documentNumber: body.dniNumber,  // agregar al schema del request
    fullName: body.fullName,
    frontImageUrl: frontUrl,
    backImageUrl: backUrl,
    selfieUrl: selfieUrl,
  });

  // Guardar resultado
  const { data: verification } = await adminSupabase
    .from("identity_verifications")
    .insert({
      driver_id: driverId,
      provider: process.env.RENAPER_PROVIDER ?? "nosis",
      document_type: "dni",
      document_number: body.dniNumber,
      status: result.status,
      confidence: result.confidence,
      raw_response: result.rawResponse,
      rejection_reason: result.rejectionReason,
      verified_at: result.status === "verified" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (result.status === "rejected") {
    return NextResponse.json({
      error: "Verificacion de identidad fallida",
      reason: result.rejectionReason,
      confidence: result.confidence,
    }, { status: 422 });
  }

  // Vincular al driver
  await adminSupabase
    .from("drivers")
    .update({ identity_verification_id: verification.id })
    .eq("id", driverId);
}
```

### Flujo completo

```
Conductor sube fotos (DNI frente/dorso + selfie)
  ↓
Admin hace click en "Aprobar"
  ↓
API llama a verifyIdentity() → Nosis/RENAPER
  ↓
Si confidence >= 75% → auto-aprueba, guarda resultado
Si confidence < 75% → rechaza con motivo, admin puede override manual
Si provider no configurado → flujo manual actual (sin cambios)
```

---

## 2. OCR y Procesamiento de Imagenes

### Objetivo

Extraer automaticamente datos de los documentos subidos (DNI, licencia, seguro, VTV) y validar calidad de fotos de evidencia.

### Proveedor recomendado: Google Cloud Vision API

Ya se tiene un proyecto de Google Cloud (por Google Maps), asi que agregar Vision API es lo mas simple.

### Variables de entorno

```env
# --- OCR / Vision AI --------------------------------------------------------
# Usar la misma cuenta de servicio de Google Cloud
GOOGLE_CLOUD_CREDENTIALS_JSON=           # JSON de la service account (base64 encoded)
# O alternativamente:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Lib: Servicio de OCR

```
apps/web/lib/ocr/
  ├── index.ts           -- funcion principal extractDocument()
  ├── parsers/
  │   ├── dni.ts         -- parser especifico para DNI argentino
  │   ├── license.ts     -- parser para licencia de conducir
  │   └── insurance.ts   -- parser para poliza de seguro
  └── types.ts
```

**`apps/web/lib/ocr/types.ts`**

```typescript
export interface OcrResult {
  success: boolean;
  rawText: string;
  confidence: number;
  fields: Record<string, string | null>;
  error?: string;
}

export interface DniFields {
  numero: string | null;
  apellido: string | null;
  nombre: string | null;
  fechaNacimiento: string | null;   // DD/MM/YYYY
  sexo: string | null;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  ejemplar: string | null;
}

export interface LicenseFields {
  numero: string | null;
  titular: string | null;
  categoria: string | null;         // A, B, C, D, E
  fechaVencimiento: string | null;
  restricciones: string | null;
  municipio: string | null;
}

export interface InsuranceFields {
  poliza: string | null;
  aseguradora: string | null;
  tomador: string | null;
  vehiculo: string | null;
  patente: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  cobertura: string | null;
}
```

**`apps/web/lib/ocr/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";
import type { OcrResult } from "./types";
import { parseDni } from "./parsers/dni";
import { parseLicense } from "./parsers/license";
import { parseInsurance } from "./parsers/insurance";

let visionClient: any = null;
let visionLoaded = false;

async function getVisionClient() {
  if (visionLoaded) return visionClient;
  visionLoaded = true;

  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn("[OCR] GOOGLE_CLOUD_CREDENTIALS_JSON not set, OCR disabled");
    return null;
  }

  try {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const credentials = JSON.parse(
      Buffer.from(credentialsJson, "base64").toString("utf-8")
    );
    visionClient = new ImageAnnotatorClient({ credentials });
    return visionClient;
  } catch (err) {
    await reportError(err, { tags: { service: "ocr" } });
    return null;
  }
}

export async function extractDocument(
  imageUrl: string,
  documentType: "dni" | "license" | "insurance"
): Promise<OcrResult> {
  const client = await getVisionClient();

  if (!client) {
    return {
      success: false,
      rawText: "",
      confidence: 0,
      fields: {},
      error: "OCR no configurado",
    };
  }

  try {
    // Descargar imagen desde Supabase Storage (URL firmada)
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });

    const fullText = result.textAnnotations?.[0]?.description ?? "";
    const confidence = result.textAnnotations?.[0]?.confidence ?? 0;

    // Parsear segun tipo de documento
    const parser = {
      dni: parseDni,
      license: parseLicense,
      insurance: parseInsurance,
    }[documentType];

    const fields = parser(fullText);

    return {
      success: true,
      rawText: fullText,
      confidence: confidence * 100,
      fields,
    };
  } catch (err) {
    await reportError(err, { tags: { service: "ocr", documentType } });
    return {
      success: false,
      rawText: "",
      confidence: 0,
      fields: {},
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

export function isOcrConfigured(): boolean {
  return !!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
}
```

**`apps/web/lib/ocr/parsers/dni.ts`**

```typescript
import type { DniFields } from "../types";

// Patrones del DNI argentino (frente)
const PATTERNS = {
  numero: /(?:DNI|D\.N\.I\.?|DOCUMENTO)\s*[:\s]*(\d{7,8})/i,
  apellido: /(?:APELLIDO|SURNAME)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
  nombre: /(?:NOMBRE|NAME|NOMBRES)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
  fechaNacimiento: /(?:NACIMIENTO|BIRTH|F\.?\s*NAC)\s*[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
  sexo: /(?:SEXO|SEX)\s*[:\s]*(M|F|MASCULINO|FEMENINO)/i,
  fechaEmision: /(?:EMISION|EMIS)\s*[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
  fechaVencimiento: /(?:VENCIMIENTO|EXPIR|VTO|FEC\.\s*VTO)\s*[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
  ejemplar: /(?:EJEMPLAR|EJMPLAR)\s*[:\s]*([A-Z])/i,
};

export function parseDni(text: string): DniFields {
  const match = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? null;

  return {
    numero: match(PATTERNS.numero),
    apellido: match(PATTERNS.apellido),
    nombre: match(PATTERNS.nombre),
    fechaNacimiento: match(PATTERNS.fechaNacimiento),
    sexo: match(PATTERNS.sexo),
    fechaEmision: match(PATTERNS.fechaEmision),
    fechaVencimiento: match(PATTERNS.fechaVencimiento),
    ejemplar: match(PATTERNS.ejemplar),
  };
}
```

### API Route

**`apps/web/app/api/documents/ocr/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { extractDocument, isOcrConfigured } from "@/lib/ocr";

const ocrSchema = z.object({
  imageUrl: z.string().url(),
  documentType: z.enum(["dni", "license", "insurance"]),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rate = await enforceRateLimit({ key: `ocr:${user.id}:${ip}`, max: 20, windowMs: 15 * 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit excedido" }, { status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (!isOcrConfigured()) {
    return NextResponse.json({ error: "OCR no disponible" }, { status: 503 });
  }

  const body = ocrSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Datos invalidos", details: body.error.flatten() }, { status: 400 });
  }

  const result = await extractDocument(body.data.imageUrl, body.data.documentType);

  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
```

### Integracion con el flujo de verificacion

```
Conductor sube foto de DNI
  ↓
Frontend llama POST /api/documents/ocr { imageUrl, documentType: "dni" }
  ↓
OCR extrae campos (numero, nombre, vencimiento)
  ↓
Frontend pre-llena el formulario con los datos extraidos
  ↓
Si tiene RENAPER configurado:
  Los datos extraidos se pasan a verifyIdentity() para cruzar contra la BD oficial
  ↓
Admin ve resultado de OCR + RENAPER en el panel de verificacion
```

### Dependencias

```bash
pnpm add @google-cloud/vision --filter @fletaya/web
```

### Costo estimado

- Google Cloud Vision: $1.50 USD / 1000 imagenes (primeras 1000/mes gratis)
- Promedio por conductor: 5-6 imagenes (DNI frente/dorso, licencia, seguro, VTV, selfie)

---

## 3. Email Transaccional

### Objetivo

Enviar emails automaticos para eventos clave del negocio. Proveedor recomendado: **Resend** (moderna, excelente DX, templates con React).

### Variables de entorno

```env
# --- Email Transaccional (Resend) -------------------------------------------
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=FleteYa <no-reply@fleteya.com.ar>
EMAIL_REPLY_TO=soporte@fleteya.com.ar
```

### Lib: Servicio de Email

```
apps/web/lib/email/
  ├── index.ts              -- send() principal
  ├── templates/
  │   ├── welcome.tsx       -- bienvenida al registro
  │   ├── shipment-confirmed.tsx
  │   ├── shipment-delivered.tsx
  │   ├── driver-assigned.tsx
  │   ├── payment-receipt.tsx
  │   ├── driver-approved.tsx
  │   └── dispute-update.tsx
  └── types.ts
```

**`apps/web/lib/email/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

let resendModule: any = null;
let resendLoaded = false;

async function getResend() {
  if (resendLoaded) return resendModule;
  resendLoaded = true;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set, emails disabled");
    return null;
  }

  try {
    const { Resend } = await import("resend");
    resendModule = new Resend(apiKey);
    return resendModule;
  } catch {
    return null;
  }
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const resend = await getResend();

  if (!resend) {
    console.log(`[Email][Dry] To: ${params.to} | Subject: ${params.subject}`);
    return true; // graceful degrade: log y retornar ok
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "FleteYa <no-reply@fleteya.com.ar>",
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo ?? process.env.EMAIL_REPLY_TO,
    });

    if (error) {
      await reportError(new Error(error.message), { tags: { service: "email" } });
      return false;
    }

    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "email" } });
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
```

**`apps/web/lib/email/templates/shipment-delivered.tsx`** (ejemplo)

```typescript
export function shipmentDeliveredEmail(params: {
  clientName: string;
  shipmentId: string;
  driverName: string;
  finalPrice: number;
  trackingUrl: string;
}) {
  return {
    subject: `Tu envio fue entregado - FleteYa`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Envio entregado</h2>
        <p>Hola ${params.clientName},</p>
        <p>Tu envio <strong>#${params.shipmentId.slice(0, 8)}</strong> fue entregado
           exitosamente por <strong>${params.driverName}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">Precio final</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
              $${params.finalPrice.toLocaleString("es-AR")}
            </td>
          </tr>
        </table>
        <p>
          <a href="${params.trackingUrl}" style="background: #2563eb; color: white;
             padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Ver detalles y calificar
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          FleteYa - Tu flete, ya.
        </p>
      </div>
    `,
  };
}
```

### Donde disparar emails

| Evento | Template | Trigger (archivo existente) |
|--------|----------|-----------------------------|
| Registro exitoso | `welcome` | Auth callback / profile creation |
| Envio confirmado + pago aprobado | `shipment-confirmed` | `api/payments/webhook/route.ts` (status approved) |
| Conductor asignado | `driver-assigned` | `api/shipments/[id]/assign/route.ts` |
| Envio entregado | `shipment-delivered` | `api/shipments/[id]/status/route.ts` (status delivered) |
| Recibo de pago | `payment-receipt` | `api/payments/webhook/route.ts` (status approved) |
| Conductor aprobado/rechazado | `driver-approved` | `api/admin/drivers/[id]/verify/route.ts` |
| Actualizacion de disputa | `dispute-update` | `api/admin/disputes/[id]/route.ts` |

### Dependencias

```bash
pnpm add resend --filter @fletaya/web
```

### Costo

- Resend free tier: 100 emails/dia, 3000/mes
- Pro: $20 USD/mes por 50K emails

### Configuracion de dominio

1. Crear cuenta en [resend.com](https://resend.com).
2. Ir a **Domains > Add Domain** y agregar `fleteya.com.ar`.
3. Agregar los registros DNS que Resend indica (DKIM, SPF, DMARC).
4. Esperar verificacion (~5 min).
5. Copiar la API Key → `RESEND_API_KEY`.

---

## 4. Facturacion Electronica AFIP

### Objetivo

Emitir comprobantes fiscales (Factura C para monotributistas, Factura B para consumidores finales) automaticamente al completar un envio.

### Proveedor recomendado: afip.js (libreria open source)

Existe una libreria Node.js mantenida que simplifica la interaccion con los web services de AFIP.

### Variables de entorno

```env
# --- AFIP Facturacion Electronica -------------------------------------------
AFIP_CUIT=20123456789                    # CUIT de FleteYa
AFIP_CERT_PATH=./certs/afip.crt         # Certificado digital
AFIP_KEY_PATH=./certs/afip.key          # Clave privada
AFIP_ENVIRONMENT=testing                 # testing | production
# Alternativa SaaS:
# TUSFACTURAS_API_KEY=
# TUSFACTURAS_USER_TOKEN=
```

### Migracion de base de datos

```sql
-- packages/supabase/migrations/012_invoices.sql

CREATE TYPE invoice_type AS ENUM ('factura_b', 'factura_c', 'nota_credito_b', 'nota_credito_c');
CREATE TYPE invoice_status AS ENUM ('pending', 'issued', 'cancelled', 'error');

CREATE TABLE invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        uuid NOT NULL REFERENCES payments(id),
  shipment_id       uuid NOT NULL REFERENCES shipments(id),
  invoice_type      invoice_type NOT NULL,
  status            invoice_status NOT NULL DEFAULT 'pending',

  -- Datos AFIP
  punto_venta       integer NOT NULL,
  numero_comprobante bigint,               -- asignado por AFIP
  cae               text,                  -- Codigo de Autorizacion Electronico
  cae_vencimiento   date,
  fecha_emision     date NOT NULL DEFAULT CURRENT_DATE,

  -- Montos
  total             numeric(12,2) NOT NULL,
  neto              numeric(12,2) NOT NULL,
  iva               numeric(12,2) NOT NULL DEFAULT 0,

  -- Receptor
  receptor_tipo_doc integer NOT NULL DEFAULT 99,  -- 99 = Consumidor Final
  receptor_nro_doc  text NOT NULL DEFAULT '0',
  receptor_nombre   text,

  raw_response      jsonb DEFAULT '{}'::jsonb,
  error_message     text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_shipment ON invoices(shipment_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus facturas"
  ON invoices FOR SELECT
  USING (
    shipment_id IN (
      SELECT id FROM shipments WHERE client_id = auth.uid()
    )
  );
```

### Lib: Servicio de Facturacion

**`apps/web/lib/billing/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

interface InvoiceParams {
  paymentId: string;
  shipmentId: string;
  amount: number;
  commission: number;
  clientName?: string;
  clientDni?: string;
}

interface InvoiceResult {
  success: boolean;
  cae?: string;
  caeVencimiento?: string;
  numeroComprobante?: number;
  error?: string;
}

let afipInstance: any = null;
let afipLoaded = false;

async function getAfip() {
  if (afipLoaded) return afipInstance;
  afipLoaded = true;

  const cuit = process.env.AFIP_CUIT;
  if (!cuit) {
    console.warn("[AFIP] AFIP_CUIT not set, billing disabled");
    return null;
  }

  try {
    const Afip = (await import("@afipsdk/afip.js")).default;
    afipInstance = new Afip({
      CUIT: cuit,
      cert: process.env.AFIP_CERT_PATH,
      key: process.env.AFIP_KEY_PATH,
      production: process.env.AFIP_ENVIRONMENT === "production",
    });
    return afipInstance;
  } catch (err) {
    await reportError(err, { tags: { service: "afip" } });
    return null;
  }
}

export async function emitInvoice(params: InvoiceParams): Promise<InvoiceResult> {
  const afip = await getAfip();

  if (!afip) {
    return { success: false, error: "AFIP no configurado" };
  }

  try {
    const puntoVenta = 1; // Configurar segun la empresa

    // Obtener ultimo comprobante autorizado
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, 11); // 11 = Factura C

    const voucherNumber = lastVoucher + 1;
    const today = new Date();
    const fechaStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const voucherData = {
      CantReg: 1,
      PtoVta: puntoVenta,
      CbteTipo: 11,                                   // 11 = Factura C
      Concepto: 2,                                     // 2 = Servicios
      DocTipo: params.clientDni ? 96 : 99,             // 96 = DNI, 99 = Consumidor Final
      DocNro: params.clientDni ? parseInt(params.clientDni) : 0,
      CbteDesde: voucherNumber,
      CbteHasta: voucherNumber,
      CbteFch: fechaStr,
      ImpTotal: params.amount,
      ImpTotConc: 0,
      ImpNeto: params.amount,
      ImpOpEx: 0,
      ImpIVA: 0,                                       // Factura C no discrimina IVA
      ImpTrib: 0,
      FchServDesde: fechaStr,
      FchServHasta: fechaStr,
      FchVtoPago: fechaStr,
      MonId: "PES",
      MonCotiz: 1,
    };

    const result = await afip.ElectronicBilling.createVoucher(voucherData);

    return {
      success: true,
      cae: result.CAE,
      caeVencimiento: result.CAEFchVto,
      numeroComprobante: voucherNumber,
    };
  } catch (err) {
    await reportError(err, { tags: { service: "afip" } });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al emitir factura",
    };
  }
}

export function isBillingConfigured(): boolean {
  return !!process.env.AFIP_CUIT;
}
```

### Donde disparar

En `apps/web/app/api/payments/webhook/route.ts`, despues de confirmar pago aprobado:

```typescript
import { emitInvoice, isBillingConfigured } from "@/lib/billing";

// Despues de actualizar payment status a "approved":
if (isBillingConfigured()) {
  const invoiceResult = await emitInvoice({
    paymentId: payment.id,
    shipmentId: payment.shipment_id,
    amount: payment.amount,
    commission: payment.commission,
  });

  if (invoiceResult.success) {
    await adminSupabase.from("invoices").insert({
      payment_id: payment.id,
      shipment_id: payment.shipment_id,
      invoice_type: "factura_c",
      status: "issued",
      punto_venta: 1,
      numero_comprobante: invoiceResult.numeroComprobante,
      cae: invoiceResult.cae,
      cae_vencimiento: invoiceResult.caeVencimiento,
      total: payment.amount,
      neto: payment.amount,
    });
  }
}
```

### Pasos de configuracion AFIP

1. Obtener certificado digital:
   ```bash
   # Generar clave privada
   openssl genrsa -out afip.key 2048
   # Generar CSR (Certificate Signing Request)
   openssl req -new -key afip.key -subj "/C=AR/O=FleteYa/CN=fleteya/serialNumber=CUIT 20XXXXXXXX9" -out afip.csr
   ```
2. Subir el CSR en [AFIP con clave fiscal](https://auth.afip.gob.ar/) → Administracion de Certificados Digitales.
3. Descargar el certificado `.crt` emitido.
4. Colocar `afip.crt` y `afip.key` en `apps/web/certs/` (agregar a `.gitignore`).
5. Delegar el web service **wsfe** (Facturacion Electronica) al certificado.
6. Probar en entorno de homologacion (`AFIP_ENVIRONMENT=testing`).

### Dependencias

```bash
pnpm add @afipsdk/afip.js --filter @fletaya/web
```

---

## 5. WhatsApp Business API

### Objetivo

Enviar notificaciones de estado de envio por WhatsApp y ofrecer soporte por este canal.

### Proveedor recomendado: Meta Cloud API (directo) o Twilio for WhatsApp

**Meta Cloud API** es gratis para mensajes de notificacion (templates) y cobra solo por conversaciones.

### Variables de entorno

```env
# --- WhatsApp Business API (Meta Cloud API) ---------------------------------
WHATSAPP_PHONE_NUMBER_ID=1234567890      # ID del numero de WhatsApp Business
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx         # Token permanente de la app
WHATSAPP_VERIFY_TOKEN=mi_token_secreto   # Para verificar webhook
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
```

### Lib: Servicio de WhatsApp

**`apps/web/lib/whatsapp/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface WhatsAppMessage {
  to: string;              // numero con codigo de pais, ej: "5491112345678"
  templateName: string;    // nombre del template aprobado por Meta
  language?: string;
  parameters?: string[];   // parametros del template
}

async function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

export async function sendWhatsAppTemplate(msg: WhatsAppMessage): Promise<boolean> {
  const config = await getConfig();

  if (!config) {
    console.log(`[WhatsApp][Dry] To: ${msg.to} | Template: ${msg.templateName}`);
    return true;
  }

  try {
    const response = await fetch(
      `${GRAPH_API}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: msg.to,
          type: "template",
          template: {
            name: msg.templateName,
            language: { code: msg.language ?? "es_AR" },
            components: msg.parameters?.length
              ? [{
                  type: "body",
                  parameters: msg.parameters.map((p) => ({
                    type: "text",
                    text: p,
                  })),
                }]
              : undefined,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      await reportError(new Error(`WhatsApp API error: ${response.status}`), {
        tags: { service: "whatsapp" },
        extra: { response: errorData },
      });
      return false;
    }

    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "whatsapp" } });
    return false;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!process.env.WHATSAPP_ACCESS_TOKEN;
}
```

### Webhook para mensajes entrantes

**`apps/web/app/api/whatsapp/webhook/route.ts`**

```typescript
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Verificacion del webhook (Meta envia GET para validar)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Mensajes entrantes
export async function POST(request: Request) {
  const body = await request.json();

  // Extraer mensajes
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages;

  if (messages) {
    for (const message of messages) {
      const from = message.from;        // numero del usuario
      const text = message.text?.body;   // texto del mensaje

      // Aqui procesar el mensaje:
      // - Buscar usuario por telefono en profiles
      // - Si pregunta por estado de envio, responder con el ultimo estado
      // - Si es soporte, crear disputa o derivar
      console.log(`[WhatsApp] Mensaje de ${from}: ${text}`);
    }
  }

  return NextResponse.json({ ok: true });
}
```

### Templates de WhatsApp (pre-aprobar en Meta)

Estos templates se crean en el [Meta Business Manager](https://business.facebook.com/) y deben ser aprobados:

| Template Name | Mensaje |
|---------------|---------|
| `shipment_confirmed` | "Hola {{1}}, tu envio #{{2}} fue confirmado. Tu fletero {{3}} esta en camino. Segui el envio en: {{4}}" |
| `shipment_delivered` | "Tu envio #{{1}} fue entregado. Monto: ${{2}}. Califica al fletero en: {{3}}" |
| `driver_approved` | "Felicitaciones {{1}}, tu cuenta de fletero fue aprobada. Ya podes recibir envios en la app." |
| `payment_receipt` | "Recibimos tu pago de ${{1}} por el envio #{{2}}. Comprobante: {{3}}" |

### Configuracion paso a paso

1. Crear una **Meta Business App** en [developers.facebook.com](https://developers.facebook.com/).
2. Agregar el producto **WhatsApp**.
3. En **WhatsApp > Getting Started**:
   - Agregar un numero de telefono de negocio
   - Copiar el **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - Generar un **Permanent Token** → `WHATSAPP_ACCESS_TOKEN`
4. Configurar el **Webhook**:
   - URL: `https://tudominio.com/api/whatsapp/webhook`
   - Verify Token: un string secreto → `WHATSAPP_VERIFY_TOKEN`
   - Suscribirse a: `messages`
5. Crear los templates en **WhatsApp > Message Templates**.
6. Esperar aprobacion de Meta (24-48hs).

### Costo

- Conversaciones de servicio (usuario inicia): gratis primeras 1000/mes
- Conversaciones de marketing (negocio inicia con template): ~$0.05 USD/conversacion en Argentina
- Conversaciones de utilidad (notificaciones transaccionales): ~$0.03 USD/conversacion

---

## 6. Seguro de Carga

### Objetivo

Ofrecer al cliente la posibilidad de asegurar su carga al momento de crear el envio, integrando con una aseguradora.

### Enfoque recomendado: API de cotizacion + contratacion on-demand

### Variables de entorno

```env
# --- Seguro de Carga --------------------------------------------------------
CARGO_INSURANCE_PROVIDER=clupp           # clupp | sancor | manual
CARGO_INSURANCE_API_URL=https://api.clupp.com/v1
CARGO_INSURANCE_API_KEY=
CARGO_INSURANCE_COMMISSION_RATE=0.10     # 10% comision por venta de seguro
```

### Migracion de base de datos

```sql
-- packages/supabase/migrations/013_cargo_insurance.sql

CREATE TYPE insurance_status AS ENUM ('quoted', 'active', 'claimed', 'expired', 'cancelled');

CREATE TABLE cargo_insurance_policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id       uuid NOT NULL REFERENCES shipments(id),
  provider          text NOT NULL,
  policy_number     text,
  status            insurance_status NOT NULL DEFAULT 'quoted',

  -- Cobertura
  declared_value    numeric(12,2) NOT NULL,           -- valor declarado de la carga
  premium           numeric(12,2) NOT NULL,           -- costo del seguro
  deductible        numeric(12,2) DEFAULT 0,
  coverage_type     text NOT NULL DEFAULT 'basic',    -- basic | full | fragile

  -- Datos del proveedor
  external_id       text,
  raw_response      jsonb DEFAULT '{}'::jsonb,

  -- Reclamo (si aplica)
  claim_filed_at    timestamptz,
  claim_description text,
  claim_status      text,
  claim_resolution  text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cargo_insurance_policies ENABLE ROW LEVEL SECURITY;

-- Agregar campo de valor declarado al envio
ALTER TABLE shipments ADD COLUMN declared_value numeric(12,2);
ALTER TABLE shipments ADD COLUMN insurance_policy_id uuid REFERENCES cargo_insurance_policies(id);
```

### Lib: Servicio de Seguro

**`apps/web/lib/insurance/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

interface QuoteParams {
  declaredValue: number;       // valor de la carga en ARS
  shipmentType: string;        // tipo de carga
  distanceKm: number;
  coverageType: "basic" | "full" | "fragile";
}

interface QuoteResult {
  premium: number;             // costo del seguro
  deductible: number;
  coverageDetails: string;
  providerId?: string;
}

interface PolicyResult {
  success: boolean;
  policyNumber?: string;
  externalId?: string;
  error?: string;
}

// Tabla de tarifas interna (si no hay proveedor)
const RATES: Record<string, number> = {
  basic: 0.015,     // 1.5% del valor declarado
  full: 0.03,       // 3%
  fragile: 0.05,    // 5%
};

const MIN_PREMIUM = 500; // ARS

export async function quoteInsurance(params: QuoteParams): Promise<QuoteResult> {
  const apiUrl = process.env.CARGO_INSURANCE_API_URL;
  const apiKey = process.env.CARGO_INSURANCE_API_KEY;

  // Si hay proveedor externo, cotizar con el
  if (apiUrl && apiKey) {
    try {
      const response = await fetch(`${apiUrl}/quotes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          declared_value: params.declaredValue,
          cargo_type: params.shipmentType,
          distance_km: params.distanceKm,
          coverage: params.coverageType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          premium: data.premium,
          deductible: data.deductible ?? 0,
          coverageDetails: data.coverage_details,
          providerId: data.quote_id,
        };
      }
    } catch (err) {
      await reportError(err, { tags: { service: "insurance" } });
    }
  }

  // Fallback: calculo interno
  const rate = RATES[params.coverageType] ?? RATES.basic;
  const premium = Math.max(params.declaredValue * rate, MIN_PREMIUM);

  return {
    premium: Math.round(premium * 100) / 100,
    deductible: Math.round(premium * 0.1 * 100) / 100,
    coverageDetails: `Cobertura ${params.coverageType} - hasta $${params.declaredValue.toLocaleString("es-AR")}`,
  };
}

export async function activatePolicy(
  quoteProviderId: string | undefined,
  shipmentId: string,
): Promise<PolicyResult> {
  const apiUrl = process.env.CARGO_INSURANCE_API_URL;
  const apiKey = process.env.CARGO_INSURANCE_API_KEY;

  if (apiUrl && apiKey && quoteProviderId) {
    try {
      const response = await fetch(`${apiUrl}/policies`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote_id: quoteProviderId,
          shipment_reference: shipmentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          policyNumber: data.policy_number,
          externalId: data.policy_id,
        };
      }
    } catch (err) {
      await reportError(err, { tags: { service: "insurance" } });
    }
  }

  // Fallback: poliza interna (sin aseguradora externa)
  return {
    success: true,
    policyNumber: `FY-${Date.now()}`,
  };
}
```

### Integracion en el flujo de cotizacion

En `apps/web/app/api/quote/route.ts`, agregar campo opcional `declaredValue`:

```typescript
// Agregar al response del quote:
if (body.data.declaredValue) {
  const insuranceQuote = await quoteInsurance({
    declaredValue: body.data.declaredValue,
    shipmentType: body.data.shipmentType,
    distanceKm: totalDistanceKm,
    coverageType: body.data.coverageType ?? "basic",
  });
  response.insurance = insuranceQuote;
}
```

---

## 7. SMS Transaccional

### Objetivo

Enviar SMS para notificaciones criticas y como fallback de push notifications. Proveedor recomendado: **Twilio**.

### Variables de entorno

```env
# --- SMS (Twilio) -----------------------------------------------------------
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+5491100000000       # numero de Twilio para Argentina
```

### Lib: Servicio de SMS

**`apps/web/lib/sms/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

interface SmsParams {
  to: string;     // formato E.164: "+5491112345678"
  body: string;   // max ~160 chars para 1 segmento
}

let twilioClient: any = null;
let twilioLoaded = false;

async function getTwilio() {
  if (twilioLoaded) return twilioClient;
  twilioLoaded = true;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.warn("[SMS] Twilio credentials not set, SMS disabled");
    return null;
  }

  try {
    const twilio = await import("twilio");
    twilioClient = twilio.default(sid, token);
    return twilioClient;
  } catch {
    return null;
  }
}

export async function sendSms(params: SmsParams): Promise<boolean> {
  const client = await getTwilio();

  if (!client) {
    console.log(`[SMS][Dry] To: ${params.to} | Body: ${params.body}`);
    return true;
  }

  try {
    await client.messages.create({
      body: params.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: params.to,
    });
    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "sms" } });
    return false;
  }
}

export function isSmsConfigured(): boolean {
  return !!process.env.TWILIO_ACCOUNT_SID;
}
```

### Servicio unificado de notificaciones

Crear un servicio que envie por el mejor canal disponible:

**`apps/web/lib/notifications/index.ts`**

```typescript
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "@/lib/whatsapp";

interface NotifyParams {
  userId: string;
  type: "shipment_confirmed" | "shipment_delivered" | "driver_assigned" | "payment_receipt";
  data: Record<string, string>;
}

/**
 * Envia notificacion por el mejor canal disponible:
 * 1. Push notification (ya existente)
 * 2. WhatsApp (si tiene telefono y esta configurado)
 * 3. Email (si tiene email y esta configurado)
 * 4. SMS (fallback, si tiene telefono y esta configurado)
 */
export async function notifyUser(
  params: NotifyParams,
  userProfile: { email?: string; phone?: string }
): Promise<void> {
  const results: string[] = [];

  // Push (ya existe, llamar al endpoint interno)
  // ... usar fetch a /api/push/send

  // WhatsApp
  if (userProfile.phone && isWhatsAppConfigured()) {
    const sent = await sendWhatsAppTemplate({
      to: userProfile.phone.replace(/\D/g, ""),
      templateName: params.type,
      parameters: Object.values(params.data),
    });
    if (sent) results.push("whatsapp");
  }

  // Email
  if (userProfile.email && isEmailConfigured()) {
    // ... renderizar template y enviar
    results.push("email");
  }

  // SMS como ultimo recurso (si no se pudo por ningun otro canal)
  if (results.length === 0 && userProfile.phone && isSmsConfigured()) {
    const sent = await sendSms({
      to: userProfile.phone,
      body: `FleteYa: ${params.data.message ?? "Tenes una actualizacion en tu envio"}`,
    });
    if (sent) results.push("sms");
  }

  console.log(`[Notify] user=${params.userId} type=${params.type} channels=${results.join(",") || "none"}`);
}
```

### Configuracion Twilio

1. Crear cuenta en [twilio.com](https://www.twilio.com/).
2. Ir a **Console > Account Info**:
   - Copiar **Account SID** → `TWILIO_ACCOUNT_SID`
   - Copiar **Auth Token** → `TWILIO_AUTH_TOKEN`
3. Comprar un numero argentino en **Phone Numbers > Buy a Number**.
   - Buscar numeros de Argentina (+54)
   - Copiar el numero → `TWILIO_PHONE_NUMBER`
4. Para testing, verificar numeros destino en **Verified Caller IDs**.

### Dependencias

```bash
pnpm add twilio --filter @fletaya/web
```

### Costo

- SMS a Argentina: ~$0.07 USD por mensaje
- Numero argentino: ~$1 USD/mes

---

## 8. Calculo de Rutas Reales

### Objetivo

Reemplazar el calculo de distancia en linea recta (`calcDistanceKm` con formula Haversine) por distancias reales por ruta, incluyendo ETA.

### Opcion recomendada: Google Directions API

Ya se tiene el proyecto de Google Cloud y la API key. Solo hay que habilitar la Directions API.

### Variables de entorno

No se necesitan nuevas — se usa la misma `NEXT_PUBLIC_GOOGLE_MAPS_KEY`. Para llamadas server-side, conviene una key aparte:

```env
# --- Google Directions (server-side) ----------------------------------------
GOOGLE_DIRECTIONS_API_KEY=               # Key sin restriccion de referrer (server-only)
```

### Lib: Servicio de Rutas

**`apps/web/lib/routes/index.ts`**

```typescript
import { reportError } from "@/lib/error-reporting";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  polyline: string;            // encoded polyline para dibujar en mapa
  distanceText: string;        // "15.3 km"
  durationText: string;        // "23 min"
}

interface MultiStopRouteResult {
  legs: RouteResult[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

const DIRECTIONS_API = "https://maps.googleapis.com/maps/api/directions/json";

export async function calculateRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteResult | null> {
  const apiKey = process.env.GOOGLE_DIRECTIONS_API_KEY
    ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.warn("[Routes] No API key, falling back to Haversine");
    return null;
  }

  try {
    const url = new URL(DIRECTIONS_API);
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("language", "es");
    url.searchParams.set("region", "ar");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.routes?.[0]) {
      console.warn(`[Routes] Directions API status: ${data.status}`);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distanceKm: leg.distance.value / 1000,
      durationMinutes: Math.ceil(leg.duration.value / 60),
      polyline: route.overview_polyline.points,
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
    };
  } catch (err) {
    await reportError(err, { tags: { service: "routes" } });
    return null;
  }
}

export async function calculateMultiStopRoute(
  stops: RoutePoint[]
): Promise<MultiStopRouteResult | null> {
  if (stops.length < 2) return null;

  const legs: RouteResult[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const leg = await calculateRoute(stops[i], stops[i + 1]);
    if (!leg) return null; // si falla una pata, devolver null
    legs.push(leg);
  }

  return {
    legs,
    totalDistanceKm: legs.reduce((sum, l) => sum + l.distanceKm, 0),
    totalDurationMinutes: legs.reduce((sum, l) => sum + l.durationMinutes, 0),
  };
}

// Haversine fallback (ya existente en el codebase)
export function calcDistanceKmHaversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Integracion en el flujo de cotizacion

Modificar `apps/web/app/api/quote/route.ts`:

```typescript
import { calculateRoute, calcDistanceKmHaversine } from "@/lib/routes";

// Para cada leg:
for (const leg of legs) {
  // Intentar ruta real primero
  const realRoute = await calculateRoute(
    { lat: leg.originLat, lng: leg.originLng },
    { lat: leg.destLat, lng: leg.destLng }
  );

  if (realRoute) {
    leg.distanceKm = realRoute.distanceKm;
    leg.estimatedMinutes = realRoute.durationMinutes;
    leg.polyline = realRoute.polyline;
  } else {
    // Fallback a Haversine con factor de correccion (rutas reales ~30% mas largas)
    const haversine = calcDistanceKmHaversine(
      leg.originLat, leg.originLng,
      leg.destLat, leg.destLng
    );
    leg.distanceKm = haversine * 1.3;
    leg.estimatedMinutes = Math.ceil(leg.distanceKm / 30 * 60); // 30 km/h promedio AMBA
  }
}
```

### Configuracion

1. En Google Cloud Console, habilitar **Directions API**.
2. Crear una API key sin restriccion de HTTP referrer (para uso server-side).
3. Restringir esa key por IP (la IP del servidor de Vercel).
4. Copiar → `GOOGLE_DIRECTIONS_API_KEY`.

### Costo

- Directions API: $5.00 USD / 1000 requests
- Cada cotizacion con 3 paradas = 3 requests = ~$0.015 USD
- Con $200 USD de credito gratis: ~40K cotizaciones/mes gratis

---

## 9. Analytics

### Objetivo

Implementar tracking de eventos para entender el funnel de conversion y comportamiento de usuarios.

### Proveedor recomendado: PostHog

Open source, self-hosteable, generous free tier, product analytics + session replay.

### Variables de entorno

```env
# --- Analytics (PostHog) ----------------------------------------------------
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# Para Metabase (dashboards SQL sobre Supabase):
# METABASE_SITE_URL=
# METABASE_SECRET_KEY=
```

### Lib: Cliente de Analytics

**`apps/web/lib/analytics/index.ts`**

```typescript
import type { PostHog } from "posthog-js";

let posthogInstance: PostHog | null = null;
let posthogLoaded = false;

export async function getPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null; // SSR guard
  if (posthogLoaded) return posthogInstance;
  posthogLoaded = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage",
    });
    posthogInstance = posthog;
    return posthog;
  } catch {
    return null;
  }
}

// Eventos de negocio
export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const posthog = await getPostHog();
  posthog?.capture(event, properties);
}

// Identificar usuario
export async function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): Promise<void> {
  const posthog = await getPostHog();
  posthog?.identify(userId, traits);
}

// Reset al logout
export async function resetAnalytics(): Promise<void> {
  const posthog = await getPostHog();
  posthog?.reset();
}
```

### Provider de Next.js

**`apps/web/components/analytics-provider.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    getPostHog(); // inicializar
  }, []);

  useEffect(() => {
    getPostHog().then((posthog) => {
      if (posthog && pathname) {
        let url = window.origin + pathname;
        if (searchParams.toString()) url += `?${searchParams.toString()}`;
        posthog.capture("$pageview", { $current_url: url });
      }
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
```

Agregar en `apps/web/app/(app)/layout.tsx`:

```tsx
import { AnalyticsProvider } from "@/components/analytics-provider";

// Envolver el layout:
<AnalyticsProvider>
  {children}
</AnalyticsProvider>
```

### Eventos clave a trackear

| Evento | Donde | Properties |
|--------|-------|------------|
| `quote_started` | Pagina de cotizacion | `{ shipmentType, legs }` |
| `quote_completed` | POST /api/quote response | `{ quoteId, finalPrice, distanceKm }` |
| `signup_completed` | Auth callback | `{ method: "google"/"email" }` |
| `shipment_created` | POST /api/shipments | `{ type, legs, price, isBackhaul }` |
| `payment_initiated` | POST /api/payments/create | `{ amount, shipmentId }` |
| `payment_completed` | Webhook approved | `{ amount, paymentType }` |
| `driver_applied` | POST /api/shipments/[id]/applications | `{ shipmentId, distanceKm }` |
| `driver_assigned` | POST /api/shipments/[id]/assign | `{ strategy, isBackhaul }` |
| `shipment_delivered` | PATCH status=delivered | `{ totalDurationMin, distanceKm }` |
| `dispute_filed` | POST /api/shipments/[id]/disputes | `{ reason }` |
| `referral_used` | POST /api/referrals | `{ code }` |

### Server-side tracking

Para eventos del backend (webhooks, cambios de estado), usar la API directa de PostHog:

**`apps/web/lib/analytics/server.ts`**

```typescript
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!POSTHOG_KEY) return;

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "fletaya-server" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // fire and forget
  }
}
```

### Configuracion

1. Crear cuenta en [posthog.com](https://posthog.com) (o self-host con Docker).
2. Crear un proyecto.
3. Copiar:
   - **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`
   - **Host** → `NEXT_PUBLIC_POSTHOG_HOST`
4. Opcionalmente, configurar **Metabase** conectado a Supabase para dashboards SQL custom:
   - Instalar Metabase (Docker o [metabase.com](https://metabase.com) cloud)
   - Conectar la base PostgreSQL de Supabase como data source
   - Crear dashboards de revenue, GMV, retention

### Dependencias

```bash
pnpm add posthog-js --filter @fletaya/web
```

### Costo

- PostHog Cloud free: 1M eventos/mes, session replay, feature flags
- PostHog self-hosted: gratis (solo costo de infra)
- Metabase: open source gratis, cloud desde $85 USD/mes

---

## Resumen de Dependencias Nuevas

```bash
# Todas las dependencias nuevas:
pnpm add \
  @google-cloud/vision \
  resend \
  @afipsdk/afip.js \
  twilio \
  posthog-js \
  --filter @fletaya/web
```

## Resumen de Variables de Entorno Nuevas

```env
# RENAPER / Identidad
RENAPER_PROVIDER=nosis
RENAPER_API_URL=
RENAPER_API_KEY=
RENAPER_API_SECRET=

# OCR
GOOGLE_CLOUD_CREDENTIALS_JSON=

# Email
RESEND_API_KEY=
EMAIL_FROM=FleteYa <no-reply@fleteya.com.ar>
EMAIL_REPLY_TO=soporte@fleteya.com.ar

# AFIP
AFIP_CUIT=
AFIP_CERT_PATH=./certs/afip.crt
AFIP_KEY_PATH=./certs/afip.key
AFIP_ENVIRONMENT=testing

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# Seguro de Carga
CARGO_INSURANCE_PROVIDER=clupp
CARGO_INSURANCE_API_URL=
CARGO_INSURANCE_API_KEY=
CARGO_INSURANCE_COMMISSION_RATE=0.10

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Rutas
GOOGLE_DIRECTIONS_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Resumen de Migraciones Nuevas

| Migracion | Tabla(s) | Servicio |
|-----------|----------|----------|
| `011_identity_verification.sql` | `identity_verifications` | RENAPER |
| `012_invoices.sql` | `invoices` | AFIP |
| `013_cargo_insurance.sql` | `cargo_insurance_policies` | Seguro de carga |

## Orden de Implementacion Sugerido

```
1. Email (Resend)          — mas simple, impacto inmediato
2. Rutas reales (Directions)  — ya tiene la cuenta de Google, minima config
3. Analytics (PostHog)     — entender el negocio antes de optimizar
4. OCR (Vision AI)         — automatizar onboarding
5. RENAPER (Nosis)         — complementa OCR
6. WhatsApp Business       — canal de comunicacion principal
7. AFIP (Facturacion)      — necesario para operar legalmente
8. SMS (Twilio)            — fallback de notificaciones
9. Seguro de Carga         — feature adicional de revenue
```
