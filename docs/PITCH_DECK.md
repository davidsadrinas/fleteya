# FleteYa — Pitch Deck para Inversores

---

## 1. EL PROBLEMA

**Mover cosas en Buenos Aires es caro, lento e inseguro.**

- **+3.5 millones de mudanzas y fletes/ano** solo en AMBA (Area Metropolitana Buenos Aires).
- El 70% se resuelve por contactos informales, redes sociales o clasificados — sin garantia, sin precio transparente, sin seguro.
- Los fleteros vuelven vacios el **40% de los viajes** (dead miles), encareciendo el costo para todos.
- No existe una plataforma dominante que resuelva esto en Argentina.

### El dolor del cliente:
- No sabe cuanto deberia costar un flete.
- No sabe si el fletero es confiable.
- No tiene forma de rastrear su carga en tiempo real.
- Si algo se rompe, no tiene cobertura.

### El dolor del fletero:
- Pierde horas buscando trabajo.
- Vuelve vacio despues de cada entrega.
- No tiene herramientas para gestionar su negocio.
- Cobra en efectivo, sin facturacion ni respaldo.

---

## 2. LA SOLUCION: FLETEYA

**FleteYa es el Uber del flete en Argentina.**

Una plataforma que conecta personas y empresas que necesitan mover cosas con fleteros verificados, con precio transparente, pago digital y seguimiento en tiempo real.

### Propuesta de valor:

| Para el cliente | Para el fletero |
|-----------------|-----------------|
| Cotizacion instantanea sin registro | Flujo constante de trabajo |
| Precio transparente y fijo | Cobro digital garantizado en 48hs |
| Fleteros verificados (DNI + selfie) | Herramientas de gestion profesional |
| Tracking GPS en tiempo real | **Backhaul**: viajes extra sin volver vacio |
| Chat directo con el conductor | Rating y reputacion que genera mas trabajo |
| Seguro de carga opcional | Facturacion automatica |
| Pago digital (tarjeta, transferencia, efectivo) | App mobile nativa |

---

## 3. LA INNOVACION: BACKHAUL

**El diferencial clave de FleteYa es la optimizacion de backhaul.**

Cuando un fletero termina una entrega, el sistema detecta envios cercanos a su ubicacion actual y le ofrece tomarlos **sin volver vacio**.

```
Ejemplo:
  Juan entrega una mudanza en Tigre.
  Maria necesita enviar muebles desde San Isidro (a 5km de Tigre).

  Sin FleteYa: Juan vuelve vacio a CABA (30km). Maria paga flete completo.
  Con FleteYa: Juan toma el envio de Maria. Maria paga 15% menos. Juan gana mas.
```

**Impacto del backhaul:**
- **-15% en el precio** para el cliente (22% comision normal → 15% en backhaul)
- **+30% de ingresos** para el fletero (mas viajes por dia)
- **-40% de km vacios** → menor huella de carbono

**Esto es un network effect real:** mas fleteros = mas backhauls posibles = precios mas bajos = mas clientes = mas fleteros.

---

## 4. MODELO DE NEGOCIO

### Revenue principal: Comision por transaccion

| Concepto | % |
|----------|---|
| Comision base | **22%** del precio del envio |
| Comision backhaul | **15%** (descuento para incentivar eficiencia) |

### Revenue adicional (en desarrollo):

| Stream | Descripcion | Potencial |
|--------|-------------|-----------|
| **Seguro de carga** | Cobertura opcional, comision 10% sobre prima | Alto |
| **Suscripcion Premium fleteros** | Prioridad en asignacion, analytics, facturacion | Medio |
| **Publicidad contextual** | Mueblerías, ferreterías en la app del cliente | Medio |
| **API B2B** | Integracion para e-commerce (ej: MercadoLibre, Tiendanube) | Alto |

### Unit Economics (estimados por envio):

```
Precio promedio del envio:     $18,500 ARS
Comision FleteYa (22%):         $4,070
  - Gateway MercadoPago (3.4%):   -$629
  - Seguro RC (2.5%):              -$463
  - IVA neto (3.5%):               -$648
  - IIBB (3.5%):                   -$648
  - Ganancias (5%):                -$925
  = Margen neto por envio:         $757 ARS (~4.1%)

Con escala (10K envios/mes):    $7.57M ARS/mes en margen neto
```

### Pricing: Transparente y predecible

```
Precio por tramo = $3,200 (base) + $1,800 x km
```

Descuentos por multi-parada (chain discount): 15% → 27% → 39% → 45% por tramo adicional. Si el ultimo destino = primer origen (circuito), +8% de descuento extra.

---

## 5. MERCADO

### TAM (Total Addressable Market) — Argentina

- **Fletes urbanos y mudanzas**: ~USD $2.8B/ano
- **Logistica de ultima milla**: ~USD $1.2B/ano
- **Acarreo de vehiculos**: ~USD $400M/ano
- **Servicios atmosfericos**: ~USD $200M/ano
- **Total**: ~USD $4.6B/ano

### SAM (Serviceable Available Market) — AMBA

- AMBA concentra el **40%** del mercado nacional
- **SAM**: ~USD $1.84B/ano

### SOM (Serviceable Obtainable Market) — Ano 2-3

- Target: **1% del SAM** en 24 meses
- **SOM**: ~USD $18.4M/ano
- Con take rate del 22%: **~USD $4M/ano en revenue**

### Comparables regionales:

| Plataforma | Pais | Valuacion | Status |
|------------|------|-----------|--------|
| **Loggi** | Brasil | USD $2.1B | Unicornio |
| **Rappi** (logistica) | Colombia | USD $5.25B | Vertical en crecimiento |
| **99Minutos** | Mexico | USD $200M | Serie B |
| **Pickapp** | Argentina | USD $15M | Serie A |

---

## 6. TRACCION Y ESTADO ACTUAL

### Producto construido (MVP completo):

- **Web app** (Next.js 14, SSR, responsive)
- **Mobile app** (React Native + Expo, iOS + Android)
- **Backend** (Supabase: PostgreSQL + PostGIS + Realtime + Auth)
- **Pagos** integrados (MercadoPago: tarjeta, transferencia, efectivo)
- **Tracking GPS** en tiempo real con mapa interactivo
- **Chat** in-app entre cliente y fletero
- **Sistema de verificacion** de conductores (DNI + selfie + licencia)
- **Algoritmo de asignacion** por proximidad + rating
- **Sistema de disputas** con evidencia fotografica
- **Programa de referidos** ($500 ARS para ambas partes)
- **Panel admin** con metricas en tiempo real

### Integraciones listas:

- **9 servicios externos** integrados:
  - RENAPER (verificacion de identidad automatica)
  - OCR de documentos (Google Vision)
  - Email transaccional (Resend)
  - Facturacion AFIP (automatica post-pago)
  - WhatsApp Business API
  - SMS (Twilio)
  - Seguro de carga (cotizacion + contratacion)
  - Rutas reales (Google Directions, no linea recta)
  - Analytics (PostHog)
- **Sistema unificado de notificaciones**: push + WhatsApp + email + SMS con fallback automatico

### Lo que falta para lanzamiento:

- [ ] Onboarding de primeros 50 fleteros
- [ ] Prueba beta con 200 usuarios
- [ ] Configurar credenciales de produccion (MercadoPago, AFIP, etc.)
- [ ] Deployment en Vercel + Expo EAS
- [ ] Marketing de lanzamiento

---

## 7. COMPETENCIA

| Feature | FleteYa | Clasificados (ML, OLX) | Grupos WhatsApp | Pickapp | Fleteros informales |
|---------|---------|----------------------|-----------------|---------|-------------------|
| Precio transparente | Si | No | No | Si | No |
| Pago digital | Si | No | No | Si | No |
| Tracking GPS | Si | No | No | Parcial | No |
| Verificacion de conductor | Si | No | No | Basica | No |
| Backhaul optimization | **Si** | No | No | **No** | No |
| Seguro de carga | Si | No | No | No | No |
| Multi-parada | Si | No | No | No | Manual |
| Facturacion automatica | Si | No | No | No | No |
| App mobile nativa | Si | No | No | Si | No |
| Chat in-app | Si | No | Si (desorganizado) | Si | No |
| Cotizacion sin registro | **Si** | No | No | No | No |

**Ventaja competitiva defensible:**
1. **Backhaul algorithm** — network effect: mas fleteros = mas eficiencia = mejores precios
2. **Data geoespacial** — cada envio mejora el algoritmo de pricing y asignacion
3. **Verificacion end-to-end** — RENAPER + OCR + selfie, barrera de entrada para competidores

---

## 8. GO-TO-MARKET

### Fase 1: Lanzamiento (Meses 1-3) — AMBA Norte

- **Target**: Mudanzas residenciales en zona norte (Tigre, San Isidro, Vicente Lopez)
- **Estrategia**:
  - Onboarding presencial de fleteros en centros de mudanzas
  - Google Ads local ("flete palermo", "mudanza zona norte")
  - Referidos: $500 ARS para quien invita y quien se registra
  - Instagram/TikTok: contenido "antes/despues" de mudanzas
- **Meta**: 500 envios completados, 50 fleteros activos

### Fase 2: Expansion AMBA (Meses 4-9)

- **Target**: Todo AMBA + segmento PyME (ferreterias, mueblerías)
- **Estrategia**:
  - Partnerships con mueblerías para delivery
  - API B2B para Tiendanube/WooCommerce
  - Programa de fidelidad para clientes frecuentes
- **Meta**: 3,000 envios/mes, 200 fleteros activos

### Fase 3: Verticales especializadas (Meses 10-18)

- **Gruas y acarreo**: convenio con seguros automotor para derivar acarreos
- **Atmosfericos**: limpieza de cisternas, transporte de residuos (B2B)
- **E-commerce**: integracion nativa con MercadoLibre y otros marketplaces
- **Meta**: 10,000 envios/mes, breakeven operativo

### Fase 4: Nacional (Mes 18+)

- Cordoba, Rosario, Mendoza
- Fletes interurbanos (larga distancia)

---

## 9. EQUIPO

*(Completar con datos reales del equipo)*

- **CEO / Founder**: [Nombre] — Vision de producto, experiencia en logistica/tech
- **CTO**: [Nombre] — Full-stack, arquitectura de la plataforma
- **COO**: [Nombre] — Operaciones, onboarding de fleteros

**Advisory board buscado:**
- Alguien del sector logistico argentino
- Alguien con experiencia en marketplace / network effects
- Alguien con conexiones en el ecosistema inversor local

---

## 10. FINANCIALS Y RONDA

### Proyeccion a 3 anos

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Envios/mes | 1,500 | 8,000 | 25,000 |
| GMV mensual | $27.8M ARS | $148M ARS | $462M ARS |
| Revenue mensual (22%) | $6.1M ARS | $32.5M ARS | $101.7M ARS |
| Fleteros activos | 100 | 500 | 1,500 |
| Usuarios registrados | 5,000 | 30,000 | 100,000 |
| Margen neto | -15% (inversion) | 5% | 12% |

### Ronda Pre-Seed / Seed

**Monto buscado:** USD $300K - $500K

**Uso de fondos:**

| Categoria | % | Destino |
|-----------|---|---------|
| **Producto** | 35% | Mobile polish, features B2B, QA |
| **Operaciones** | 25% | Onboarding fleteros, soporte, verificacion |
| **Marketing** | 25% | Google Ads, referidos, contenido, partnerships |
| **Legal/Compliance** | 10% | AFIP, seguros, terminos legales |
| **Infraestructura** | 5% | Servidores, APIs, servicios |

### Metricas clave a demostrar (6 meses post-inversion)

- **500+ envios completados/mes**
- **Retention de fleteros > 70%** (mes 3)
- **NPS > 40** (clientes)
- **CAC < $2,000 ARS** por cliente adquirido
- **LTV/CAC > 3x**
- **Tasa de backhaul > 15%** de envios

### Valuation target

- Pre-money: USD $1.5M - $2.5M
- Basado en: MVP completo, 20+ integraciones, algoritmo de backhaul diferencial

---

## 11. POR QUE AHORA

1. **Digitalizacion post-COVID**: los argentinos se acostumbraron a pedir todo por app.
2. **MercadoPago como infraestructura**: pagos digitales resueltos, sin friccion.
3. **Costo de oportunidad**: no hay un player dominante en este espacio en Argentina.
4. **Inflacion**: precio transparente en ARS con formula clara le da certidumbre al usuario.
5. **Gig economy en crecimiento**: mas personas buscan ingresos flexibles como fleteros.
6. **Regulacion**: la AFIP incentiva la facturacion digital — FleteYa lo hace automatico.

---

## 12. POR QUE NOSOTROS

1. **Producto real, no slides**: MVP completo con 20+ integraciones, listo para lanzar.
2. **Backhaul algorithm**: ningun competidor en Argentina lo tiene.
3. **Stack moderno**: Next.js + React Native + Supabase = rapido de iterar, barato de escalar.
4. **Deep knowledge del mercado**: entendemos el dolor del fletero Y del cliente.
5. **Capital-efficient**: toda la plataforma construida con equipo lean antes de levantar capital.

---

## 13. ASK

**Buscamos USD $300-500K en ronda Pre-Seed/Seed para:**

1. Lanzar en AMBA con 50+ fleteros verificados.
2. Alcanzar 500+ envios/mes en 6 meses.
3. Demostrar product-market fit y unit economics positivos.
4. Preparar la Serie A para expansion nacional.

**Lo que ofrecemos:**
- Equity acorde a la etapa (15-25% de la ronda)
- Acceso al dashboard de metricas en tiempo real
- Board seat o observer seat para lead investor
- Reportes mensuales de KPIs

---

## CONTACTO

- **Email**: [completar]
- **Web**: [completar]
- **Demo**: [link al staging]
- **Repo**: Codigo disponible para due diligence tecnica

---

*"En Argentina, todo el mundo necesita un flete. Nadie tiene una buena forma de pedirlo. Hasta ahora."*
