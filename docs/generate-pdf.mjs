#!/usr/bin/env node
/**
 * Generates FleteYa use-case PDF with screenshots.
 * Usage: node docs/generate-pdf.mjs
 * Requires: npx puppeteer (auto-downloads Chromium)
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "FleteYa_UseCases.pdf");

const BASE = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
  // Landing page sections
  { url: "/", label: "Landing — Hero principal", scroll: 0 },
  { url: "/", label: "Landing — Metricas y propuesta de valor", scroll: 548 },
  { url: "/", label: "Landing — Como funciona (pasos 1-2)", scroll: 1093 },
  { url: "/", label: "Landing — Como funciona (pasos 3-4)", scroll: 1893 },
  { url: "/", label: "Landing — Seccion para fleteros", scroll: 2562 },
  { url: "/", label: "Landing — Beneficios para fleteros", scroll: 2803 },
  { url: "/", label: "Landing — Testimonios de usuarios", scroll: 3498 },
  { url: "/", label: "Landing — Precios y transparencia", scroll: 4335 },
  { url: "/", label: "Landing — Preguntas frecuentes (FAQ)", scroll: 5120 },
  // Cotizador
  { url: "/cotizar", label: "Cotizador — Formulario de recorrido", scroll: 0 },
  { url: "/cotizar", label: "Cotizador — Tipos de envio y CTA", scroll: 500 },
  // Fleteros landing
  { url: "/fleteros", label: "Fleteros — Landing y propuesta", scroll: 0 },
  { url: "/fleteros", label: "Fleteros — Beneficios detallados", scroll: 500 },
  // Login
  { url: "/login", label: "Pantalla de Login / Registro", scroll: 0 },
];

const MOBILE_PAGES = [
  { url: "/", label: "Landing — Vista mobile", scroll: 0 },
  { url: "/cotizar", label: "Cotizador — Vista mobile", scroll: 0 },
  { url: "/login", label: "Login — Vista mobile", scroll: 0 },
];

async function captureScreenshots(browser) {
  const screenshots = [];

  // Desktop captures
  const dPage = await browser.newPage();
  await dPage.setViewport({ width: 1280, height: 800 });

  let lastUrl = "";
  for (const pg of PAGES) {
    if (pg.url !== lastUrl) {
      await dPage.goto(`${BASE}${pg.url}`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 800));
      lastUrl = pg.url;
    }
    if (pg.scroll > 0) {
      await dPage.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), pg.scroll);
      await new Promise((r) => setTimeout(r, 400));
    } else {
      await dPage.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 200));
    }
    const buf = await dPage.screenshot({ type: "jpeg", quality: 90 });
    screenshots.push({ label: pg.label, data: buf.toString("base64"), device: "Desktop" });
    console.log(`  [desktop] ${pg.label}`);
  }
  await dPage.close();

  // Mobile captures
  const mPage = await browser.newPage();
  await mPage.setViewport({ width: 375, height: 812, isMobile: true });

  for (const pg of MOBILE_PAGES) {
    await mPage.goto(`${BASE}${pg.url}`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 800));
    if (pg.scroll > 0) {
      await mPage.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), pg.scroll);
      await new Promise((r) => setTimeout(r, 400));
    }
    const buf = await mPage.screenshot({ type: "jpeg", quality: 90 });
    screenshots.push({ label: pg.label, data: buf.toString("base64"), device: "Mobile" });
    console.log(`  [mobile] ${pg.label}`);
  }
  await mPage.close();

  return screenshots;
}

function buildHTML(screenshots) {
  const desktopShots = screenshots.filter(s => s.device === "Desktop");
  const mobileShots = screenshots.filter(s => s.device === "Mobile");

  const desktopHTML = desktopShots.map((s) => `
    <div class="screenshot-block">
      <h4>${s.label} <span class="device-tag">${s.device}</span></h4>
      <img src="data:image/jpeg;base64,${s.data}" alt="${s.label}" />
    </div>
  `).join("\n");

  const mobileHTML = mobileShots.length > 0 ? `
    <h3>Vistas Mobile</h3>
    <div class="mobile-grid">
      ${mobileShots.map((s) => `
        <div class="screenshot-block mobile-shot">
          <h4>${s.label}</h4>
          <img src="data:image/jpeg;base64,${s.data}" alt="${s.label}" />
        </div>
      `).join("\n")}
    </div>
  ` : "";

  const screenshotHTML = desktopHTML + mobileHTML;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 40px 50px; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #1a1a2e; line-height: 1.5; margin: 0; padding: 0; font-size: 11px; }

  .cover { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 60px; }
  .cover h1 { font-size: 42px; margin: 0 0 8px; }
  .cover h1 span { color: #f59e0b; }
  .cover p.subtitle { font-size: 18px; color: #94a3b8; margin: 0 0 30px; }
  .cover .meta { font-size: 12px; color: #64748b; margin-top: 40px; }

  h2 { color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; font-size: 18px; margin-top: 30px; page-break-after: avoid; }
  h3 { color: #334155; font-size: 14px; margin-top: 20px; page-break-after: avoid; }
  h4 { color: #475569; font-size: 12px; margin: 12px 0 6px; }

  .section { page-break-inside: avoid; margin-bottom: 16px; }
  .flow-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 10px 0; page-break-inside: avoid; }
  .flow-box .step { display: flex; align-items: flex-start; gap: 10px; margin: 6px 0; }
  .flow-box .step-num { background: #f59e0b; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; flex-shrink: 0; margin-top: 2px; }
  .flow-box .step-text { flex: 1; }
  .flow-box .step-text strong { color: #0f172a; }

  .actor-tag { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-right: 4px; text-transform: uppercase; }
  .actor-tag.driver { background: #dcfce7; color: #166534; }
  .actor-tag.admin { background: #fce7f3; color: #9d174d; }
  .actor-tag.system { background: #f3e8ff; color: #6b21a8; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 10px 0; page-break-inside: avoid; }
  th { background: #1e293b; color: white; text-align: left; padding: 6px 10px; font-size: 10px; }
  td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }

  .screenshot-block { page-break-inside: avoid; margin: 14px 0; text-align: center; }
  .screenshot-block img { max-width: 100%; max-height: 420px; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .device-tag { font-size: 9px; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 3px; font-weight: normal; }

  .api-table td:first-child { font-family: "SF Mono", "Fira Code", monospace; font-size: 9px; white-space: nowrap; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .two-col .screenshot-block img { max-height: 320px; }
  .mobile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; page-break-inside: avoid; }
  .mobile-shot img { max-height: 350px; width: auto; margin: 0 auto; display: block; }

  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }

  .page-break { page-break-before: always; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>flete <span>ya</span></h1>
  <p class="subtitle">Marketplace de fletes para AMBA, Argentina</p>
  <p style="font-size:14px; color:#cbd5e1; max-width:500px;">
    Casos de uso, flujos funcionales y capturas de pantalla de la plataforma web y mobile.
  </p>
  <div class="meta">
    Documento generado automaticamente &bull; ${new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<h2>Indice</h2>
<ol style="font-size:12px; line-height:2;">
  <li>Resumen de la plataforma</li>
  <li>Actores del sistema</li>
  <li>Caso de uso 1: Cotizar sin registro</li>
  <li>Caso de uso 2: Crear y pagar un envio</li>
  <li>Caso de uso 3: Postulacion y asignacion del fletero</li>
  <li>Caso de uso 4: Tracking en vivo, chat y evidencia</li>
  <li>Caso de uso 5: Disputas y resolucion</li>
  <li>Caso de uso 6: Panel de administracion</li>
  <li>Caso de uso 7: Referidos</li>
  <li>Caso de uso 8: Notificaciones push</li>
  <li>Caso de uso 9: Registro y verificacion de fletero</li>
  <li>Flujo completo end-to-end</li>
  <li>Endpoints de API</li>
  <li>Capturas de pantalla</li>
</ol>

<div class="page-break"></div>

<!-- 1. RESUMEN -->
<h2>1. Resumen de la plataforma</h2>
<div class="section">
  <p>
    <strong>FleteYa</strong> es un marketplace digital de fletes y mudanzas para el Area Metropolitana de Buenos Aires (AMBA).
    Conecta clientes que necesitan mover cosas con fleteros verificados que tienen vehiculos disponibles.
  </p>
  <p>
    La plataforma optimiza los <strong>retornos (backhaul)</strong>: cuando un fletero termina un viaje, el sistema detecta si hay envios
    cerca de su ubicacion para encadenar trabajo sin viajar vacio, reduciendo el precio para el cliente.
  </p>
  <p><strong>Plataformas:</strong></p>
  <ul>
    <li><strong>Web</strong> (Next.js 14) &mdash; Landing publica, app autenticada, panel admin, API REST</li>
    <li><strong>Mobile</strong> (React Native + Expo) &mdash; App nativa para fleteros con tracking GPS</li>
  </ul>
</div>

<!-- 2. ACTORES -->
<h2>2. Actores del sistema</h2>
<table>
  <tr><th>Actor</th><th>Descripcion</th><th>Plataforma</th></tr>
  <tr><td><span class="actor-tag">Cliente</span></td><td>Publica envios, paga, trackea, califica</td><td>Web + Mobile</td></tr>
  <tr><td><span class="actor-tag driver">Fletero</span></td><td>Se postula a envios, transporta, cobra</td><td>Mobile (principal) + Web</td></tr>
  <tr><td><span class="actor-tag admin">Admin</span></td><td>Verifica fleteros, resuelve disputas, ve metricas</td><td>Web</td></tr>
  <tr><td><span class="actor-tag system">Sistema</span></td><td>Calcula precios, asigna fleteros, procesa pagos</td><td>Backend (API)</td></tr>
</table>

<div class="page-break"></div>

<!-- 3. UC: COTIZAR -->
<h2>3. Caso de uso: Cotizar sin registro</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span> (visitante anonimo)</p>
  <h3>Descripcion</h3>
  <p>Un visitante puede obtener un precio estimado sin crear cuenta. Ingresa origen, destino, tipo de envio y recibe una cotizacion al instante con desglose de precios y descuentos por multiples paradas.</p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Accede a /cotizar</strong> &mdash; Desde la landing o el menu</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Ingresa origen y destino</strong> &mdash; Con autocompletado de Google Maps</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>(Opcional) Agrega paradas</strong> &mdash; Hasta 5 tramos con descuento progresivo</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Selecciona tipo de envio</strong> &mdash; Mudanza, mercaderia, materiales, muebles, residuos, etc.</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Recibe cotizacion</strong> &mdash; Precio por tramo, descuento cadena, total, comision</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>CTA: Publicar envio</strong> &mdash; Redirige a registro/login para confirmar</div></div>
  </div>

  <h3>Reglas de negocio</h3>
  <ul>
    <li>Precio base por tramo: $3.200 + $1.800/km</li>
    <li>Descuentos cadena: 2do tramo 15%, 3ro 27%, 4to 39%, 5to 45%</li>
    <li>Bonus circuito: +8% si el ultimo destino = primer origen</li>
    <li>Rate limit: 30 cotizaciones cada 15 min por IP</li>
    <li>La cotizacion se guarda en BD con session_token para retomar</li>
  </ul>
</div>

<div class="page-break"></div>

<!-- 4. UC: CREAR Y PAGAR -->
<h2>4. Caso de uso: Crear y pagar un envio</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span> (autenticado)</p>
  <h3>Precondicion</h3>
  <p>El cliente tiene cuenta y esta logueado.</p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Accede a /shipment</strong> &mdash; Wizard de 4 pasos</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Paso 1: Recorrido</strong> &mdash; Define origen, destino y paradas intermedias (1-5 tramos)</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Paso 2: Detalles</strong> &mdash; Tipo de envio, descripcion, cantidad de ayudantes</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Paso 3: Confirmacion</strong> &mdash; Resumen con desglose de precio calculado por el servidor</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Paso 4: Pago</strong> &mdash; Redirige a MercadoPago checkout (tarjeta, efectivo, etc.)</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Webhook confirma pago</strong> &mdash; El sistema auto-acepta el envio y programa el payout al fletero (48hs)</div></div>
  </div>

  <h3>Flujo de pago (MercadoPago)</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">A</div><div class="step-text"><strong>POST /api/payments/create</strong> &mdash; Crea preferencia MP con external_reference = shipmentId</div></div>
    <div class="step"><div class="step-num">B</div><div class="step-text"><strong>Redirect a MP Checkout</strong> &mdash; Cliente paga en MercadoPago</div></div>
    <div class="step"><div class="step-num">C</div><div class="step-text"><strong>POST /api/payments/webhook</strong> &mdash; MP envia notificacion IPN con firma HMAC-SHA256</div></div>
    <div class="step"><div class="step-num">D</div><div class="step-text"><strong>Verificacion</strong> &mdash; Se valida firma, se consulta API de MP, se mapea estado</div></div>
    <div class="step"><div class="step-num">E</div><div class="step-text"><strong>Actualizacion</strong> &mdash; Pago aprobado &rarr; envio aceptado, payout programado a 48hs</div></div>
  </div>

  <h3>Validaciones</h3>
  <ul>
    <li>Solo el dueno del envio puede pagar</li>
    <li>Solo envios en estado "pending" o "accepted"</li>
    <li>No se permiten pagos duplicados aprobados</li>
    <li>Rate limit: 10 pagos cada 15 min por usuario+IP</li>
  </ul>
</div>

<div class="page-break"></div>

<!-- 5. UC: POSTULACION Y ASIGNACION -->
<h2>5. Caso de uso: Postulacion y asignacion</h2>
<div class="section">
  <p><span class="actor-tag driver">Fletero</span> + <span class="actor-tag system">Sistema</span></p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Fletero busca envios</strong> &mdash; Ve lista de envios disponibles cerca suyo (radio 15km)</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Se postula</strong> &mdash; POST /api/shipments/[id]/applications con ubicacion GPS</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Auto-asignacion</strong> &mdash; Si AUTO_ASSIGN_ON_APPLICATION=true, el sistema evalua candidatos</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Estrategia proximity_then_rating_v1:</strong>
      <ul>
        <li>Filtra fleteros con rating &lt; 3.0</li>
        <li>Calcula "distancia efectiva" (GPS directo o desde destino del viaje en curso)</li>
        <li>Agrupa en bandas: 0-5km, 5-10km, 10-15km</li>
        <li>Dentro de cada banda, elige el de mejor rating</li>
      </ul>
    </div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Backhaul auto-detection</strong> &mdash; Si el destino del viaje actual del fletero esta a &le;5km del pickup, marca is_backhaul=true (comision 15% vs 22%)</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Notificacion</strong> &mdash; Push notification al fletero asignado</div></div>
  </div>
</div>

<!-- 6. UC: TRACKING -->
<h2>6. Caso de uso: Tracking en vivo, chat y evidencia</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span> + <span class="actor-tag driver">Fletero</span></p>

  <h3>Flujo de tracking</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Fletero inicia viaje</strong> &mdash; Cambia estado a "en_route_to_pickup"</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>GPS automatico</strong> &mdash; La app mobile envia ubicacion cada pocos segundos via batch/flush</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Cliente ve en tiempo real</strong> &mdash; Mapa con posicion del fletero via Supabase Realtime</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Pickup</strong> &mdash; Fletero confirma retiro, sube fotos de evidencia</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Delivery</strong> &mdash; Fletero confirma entrega, sube fotos finales</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Fin</strong> &mdash; Estado "delivered", se habilita resena</div></div>
  </div>

  <h3>Paneles en tracking (mobile)</h3>
  <table>
    <tr><th>Panel</th><th>Funcionalidad</th></tr>
    <tr><td>Mapa</td><td>GPS en vivo del fletero sobre el mapa, estados del viaje</td></tr>
    <tr><td>Chat</td><td>Mensajes en tiempo real entre cliente y fletero (Supabase Realtime)</td></tr>
    <tr><td>Fotos</td><td>Subida de evidencia fotografica en pickup y delivery</td></tr>
    <tr><td>Disputas</td><td>Crear reclamos con descripcion y tipo (dano, retraso, etc.)</td></tr>
  </table>
</div>

<div class="page-break"></div>

<!-- 7. UC: DISPUTAS -->
<h2>7. Caso de uso: Disputas y resolucion</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span> / <span class="actor-tag driver">Fletero</span> + <span class="actor-tag admin">Admin</span></p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Reportar</strong> &mdash; Cliente o fletero crea disputa desde el panel de tracking</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Tipos</strong> &mdash; Dano a mercaderia, demora excesiva, cobro incorrecto, comportamiento inapropiado, otro</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Admin revisa</strong> &mdash; Ve la disputa en /admin/disputes con contexto del envio</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Resolucion</strong> &mdash; Marca como under_review, resolved o rejected con nota</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Auditoria</strong> &mdash; Accion logueada en admin_actions con timestamp y admin_id</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Realtime</strong> &mdash; La resolucion se ve en tiempo real en la app del usuario (Supabase Realtime)</div></div>
  </div>
</div>

<!-- 8. UC: ADMIN -->
<h2>8. Caso de uso: Panel de administracion</h2>
<div class="section">
  <p><span class="actor-tag admin">Admin</span></p>

  <h3>Funcionalidades</h3>
  <table>
    <tr><th>Seccion</th><th>Ruta</th><th>Acciones</th></tr>
    <tr><td>Dashboard</td><td>/admin</td><td>Estadisticas de plataforma (envios, ingresos, fleteros activos)</td></tr>
    <tr><td>Fleteros</td><td>/admin/drivers</td><td>Listar, filtrar (pendientes/verificados), aprobar/rechazar con motivo</td></tr>
    <tr><td>Disputas</td><td>/admin/disputes</td><td>Listar por estado, resolver con nota, log de auditoria</td></tr>
    <tr><td>Envios</td><td>/admin/shipments</td><td>Vista general con filtros por estado, fecha, paginacion</td></tr>
  </table>

  <h3>Seguridad</h3>
  <ul>
    <li>Verificacion de rol admin via service role (bypass RLS) para prevenir escalamiento de privilegios</li>
    <li>Todas las acciones se registran en tabla admin_actions</li>
    <li>Solo usuarios con role="admin" en profiles tienen acceso</li>
  </ul>
</div>

<div class="page-break"></div>

<!-- 9. UC: REFERIDOS -->
<h2>9. Caso de uso: Sistema de referidos</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span></p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Obtener codigo</strong> &mdash; GET /api/referrals genera codigo unico (ej: USR4X8K2M)</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Compartir</strong> &mdash; El usuario copia y comparte su codigo</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Canjear</strong> &mdash; Otro usuario ingresa el codigo en /settings</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Recompensa</strong> &mdash; Ambos ganan $500 ARS para su proximo envio</div></div>
  </div>

  <h3>Validaciones</h3>
  <ul>
    <li>No se puede usar el propio codigo</li>
    <li>Un usuario solo puede canjear un codigo</li>
    <li>Maximo 50 canjes por codigo</li>
    <li>El codigo debe estar activo</li>
  </ul>
</div>

<!-- 10. UC: PUSH -->
<h2>10. Caso de uso: Notificaciones push</h2>
<div class="section">
  <p><span class="actor-tag">Cliente</span> + <span class="actor-tag driver">Fletero</span></p>

  <h3>Web Push</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Activar</strong> &mdash; En /settings, el usuario activa notificaciones</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Service Worker</strong> &mdash; Se registra sw.js con VAPID keys</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Subscripcion</strong> &mdash; POST /api/push/subscribe guarda endpoint y keys</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Envio</strong> &mdash; POST /api/push/send (interno, con Bearer token) envia a todas las suscripciones activas del usuario</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Recepcion</strong> &mdash; El browser muestra la notificacion nativa; click abre la URL relevante</div></div>
  </div>

  <h3>Mobile Push</h3>
  <p>Usa Expo Notifications + FCM para iOS/Android con token de dispositivo.</p>
</div>

<div class="page-break"></div>

<!-- 11. UC: REGISTRO FLETERO -->
<h2>11. Caso de uso: Registro y verificacion de fletero</h2>
<div class="section">
  <p><span class="actor-tag driver">Fletero</span> + <span class="actor-tag admin">Admin</span></p>

  <h3>Flujo</h3>
  <div class="flow-box">
    <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Registro</strong> &mdash; El fletero crea cuenta via Google o email magic link</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Onboarding</strong> &mdash; Selecciona rol "fletero" y completa datos personales</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Documentos</strong> &mdash; Sube DNI frente, DNI dorso y selfie a Supabase Storage</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text"><strong>Vehiculos</strong> &mdash; Registra 1+ vehiculos con tipo, patente, fotos y certificaciones</div></div>
    <div class="step"><div class="step-num">5</div><div class="step-text"><strong>Revision admin</strong> &mdash; Admin ve documentos en /admin/drivers y aprueba o rechaza con motivo</div></div>
    <div class="step"><div class="step-num">6</div><div class="step-text"><strong>Verificado</strong> &mdash; El fletero puede postularse a envios</div></div>
  </div>

  <h3>Tipos de vehiculo</h3>
  <table>
    <tr><th>Tipo</th><th>Capacidad tipica</th></tr>
    <tr><td>Moto</td><td>Paquetes pequenos</td></tr>
    <tr><td>Auto</td><td>Electrodomesticos chicos, cajas</td></tr>
    <tr><td>Camioneta</td><td>Mudanzas pequenas, muebles</td></tr>
    <tr><td>Utilitario</td><td>Mudanzas medianas</td></tr>
    <tr><td>Camion</td><td>Mudanzas grandes, materiales</td></tr>
    <tr><td>Atmosferico</td><td>Residuos industriales</td></tr>
  </table>
</div>

<div class="page-break"></div>

<!-- 12. FLUJO E2E -->
<h2>12. Flujo completo end-to-end</h2>
<div class="section">
  <div class="flow-box" style="background: #fefce8; border-color: #fde68a;">
    <p style="font-weight: bold; color: #92400e; margin: 0 0 10px;">Ciclo de vida de un envio</p>
    <div class="step"><div class="step-num" style="background:#92400e">1</div><div class="step-text"><strong>Cotizacion</strong> &mdash; Cliente obtiene precio (con o sin cuenta)</div></div>
    <div class="step"><div class="step-num" style="background:#92400e">2</div><div class="step-text"><strong>Creacion</strong> &mdash; POST /api/shipments &rarr; estado: <code>pending</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">3</div><div class="step-text"><strong>Pago</strong> &mdash; MercadoPago checkout &rarr; webhook &rarr; estado: <code>accepted</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">4</div><div class="step-text"><strong>Postulaciones</strong> &mdash; Fleteros se postulan &rarr; estado: <code>awaiting_assignment</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">5</div><div class="step-text"><strong>Asignacion</strong> &mdash; Sistema asigna al mejor &rarr; estado: <code>assigned</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">6</div><div class="step-text"><strong>En camino al retiro</strong> &mdash; GPS tracking activo &rarr; estado: <code>en_route_to_pickup</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">7</div><div class="step-text"><strong>Retiro</strong> &mdash; Fotos de evidencia &rarr; estado: <code>picked_up</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">8</div><div class="step-text"><strong>En transito</strong> &mdash; GPS tracking continua &rarr; estado: <code>in_transit</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">9</div><div class="step-text"><strong>Entrega</strong> &mdash; Fotos finales &rarr; estado: <code>delivered</code></div></div>
    <div class="step"><div class="step-num" style="background:#92400e">10</div><div class="step-text"><strong>Resena</strong> &mdash; Cliente califica al fletero (1-5 estrellas)</div></div>
    <div class="step"><div class="step-num" style="background:#92400e">11</div><div class="step-text"><strong>Payout</strong> &mdash; Pago al fletero liberado 48hs despues de la entrega</div></div>
  </div>
</div>

<!-- 13. API -->
<h2>13. Endpoints de API</h2>
<div class="section">
  <h3>Publicos</h3>
  <table class="api-table">
    <tr><th>Metodo</th><th>Ruta</th><th>Descripcion</th></tr>
    <tr><td>POST</td><td>/api/quote</td><td>Cotizacion instantanea sin auth</td></tr>
    <tr><td>POST</td><td>/api/payments/webhook</td><td>Webhook MercadoPago (HMAC auth)</td></tr>
    <tr><td>GET</td><td>/api/health</td><td>Health check</td></tr>
  </table>

  <h3>Autenticados</h3>
  <table class="api-table">
    <tr><th>Metodo</th><th>Ruta</th><th>Descripcion</th></tr>
    <tr><td>GET/POST</td><td>/api/shipments</td><td>Listar / crear envios</td></tr>
    <tr><td>PATCH</td><td>/api/shipments/[id]/status</td><td>Actualizar estado del envio</td></tr>
    <tr><td>POST</td><td>/api/shipments/[id]/assign</td><td>Asignar fletero</td></tr>
    <tr><td>GET/POST</td><td>/api/shipments/[id]/applications</td><td>Postulaciones de fleteros</td></tr>
    <tr><td>GET/POST</td><td>/api/shipments/[id]/chat</td><td>Chat del envio</td></tr>
    <tr><td>POST</td><td>/api/shipments/[id]/evidence</td><td>Subir fotos de evidencia</td></tr>
    <tr><td>POST</td><td>/api/shipments/[id]/disputes</td><td>Crear disputa</td></tr>
    <tr><td>GET/POST</td><td>/api/drivers</td><td>Perfil y documentos del fletero</td></tr>
    <tr><td>POST</td><td>/api/payments/create</td><td>Crear preferencia MercadoPago</td></tr>
    <tr><td>POST</td><td>/api/tracking</td><td>Enviar ubicacion GPS</td></tr>
    <tr><td>GET/POST</td><td>/api/referrals</td><td>Codigos de referido</td></tr>
    <tr><td>POST/DEL</td><td>/api/push/subscribe</td><td>Suscripcion push</td></tr>
    <tr><td>POST</td><td>/api/documents/signed-url</td><td>URL firmada para storage</td></tr>
  </table>

  <h3>Admin</h3>
  <table class="api-table">
    <tr><th>Metodo</th><th>Ruta</th><th>Descripcion</th></tr>
    <tr><td>GET</td><td>/api/admin/stats</td><td>Estadisticas de plataforma</td></tr>
    <tr><td>GET</td><td>/api/admin/shipments</td><td>Todos los envios (paginado)</td></tr>
    <tr><td>GET</td><td>/api/admin/drivers</td><td>Todos los fleteros</td></tr>
    <tr><td>PATCH</td><td>/api/admin/drivers/[id]/verify</td><td>Verificar/rechazar fletero</td></tr>
    <tr><td>GET</td><td>/api/admin/disputes</td><td>Todas las disputas</td></tr>
    <tr><td>PATCH</td><td>/api/admin/disputes/[id]</td><td>Resolver disputa</td></tr>
  </table>
</div>

<div class="page-break"></div>

<!-- 14. SCREENSHOTS -->
<h2>14. Capturas de pantalla</h2>
<p>Capturas de las pantallas publicas de la plataforma web en desktop y mobile.</p>

${screenshotHTML}

<div class="page-break"></div>

<!-- SECURITY SUMMARY -->
<h2>Anexo: Resumen de seguridad</h2>
<table>
  <tr><th>Mecanismo</th><th>Implementacion</th></tr>
  <tr><td>CSRF</td><td>Header X-Requested-With requerido en POST/PUT/PATCH/DELETE. apiFetch() lo agrega.</td></tr>
  <tr><td>Rate Limiting</td><td>Upstash Redis (prod) + Map in-memory (dev). Limites por IP y usuario.</td></tr>
  <tr><td>CSP</td><td>Content-Security-Policy con whitelist (Supabase, MercadoPago, Google Maps).</td></tr>
  <tr><td>HSTS</td><td>Strict-Transport-Security con 1 ano de max-age.</td></tr>
  <tr><td>Path Traversal</td><td>Validacion regex UUID + decodificacion percent-encoding en signed URLs.</td></tr>
  <tr><td>Webhook Auth</td><td>HMAC-SHA256 para firmas de webhooks MercadoPago.</td></tr>
  <tr><td>Admin Auth</td><td>Verificacion de rol via service role (bypass RLS).</td></tr>
  <tr><td>Min Rating</td><td>Fleteros con rating &lt; 3.0 excluidos automaticamente de asignaciones.</td></tr>
  <tr><td>RLS</td><td>Row Level Security en todas las tablas de Supabase.</td></tr>
</table>

<h2>Anexo: Pricing</h2>
<table>
  <tr><th>Concepto</th><th>Valor</th></tr>
  <tr><td>Precio base por tramo</td><td>$3.200 + $1.800/km</td></tr>
  <tr><td>Comision normal</td><td>22%</td></tr>
  <tr><td>Comision backhaul</td><td>15%</td></tr>
  <tr><td>MercadoPago fee</td><td>~3.4%</td></tr>
  <tr><td>Seguro RC</td><td>~2.5%</td></tr>
  <tr><td>Referidos reward</td><td>$500 ARS c/u</td></tr>
  <tr><td>Payout delay</td><td>48 horas post-entrega</td></tr>
</table>

</body>
</html>`;
}

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    channel: "chrome",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });

  let screenshots = [];
  try {
    console.log("Capturing screenshots from", BASE, "...");
    screenshots = await captureScreenshots(browser);
    console.log(`Captured ${screenshots.length} screenshots`);
  } catch (err) {
    console.warn("Could not capture screenshots (is dev server running?):", err.message);
    console.log("Generating PDF without live screenshots...");
  }

  console.log("Building HTML...");
  const html = buildHTML(screenshots);

  console.log("Generating PDF...");
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "50px", right: "50px" },
  });

  await browser.close();
  console.log(`PDF generated: ${OUT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
