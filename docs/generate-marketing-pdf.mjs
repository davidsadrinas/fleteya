#!/usr/bin/env node
/**
 * Generates FleteYa Marketing Plan 2026 PDF.
 * Usage: node docs/generate-marketing-pdf.mjs
 * Requires: puppeteer-core + Google Chrome installed
 */
import puppeteer from "puppeteer-core";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "FleteYa_MarketingPlan.pdf");

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* ─── colour palette ─── */
const BG = "#0F172A";
const BG_CARD = "#1E293B";
const TEXT = "#F8FAFC";
const TEXT_MUTED = "#94A3B8";
const TEAL = "#0D9488";
const TEAL_DIM = "rgba(13,148,136,0.15)";
const AMBER = "#F59E0B";
const AMBER_DIM = "rgba(245,158,11,0.12)";

function html() {
  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: ${BG};
    color: ${TEXT};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 28mm 24mm 32mm;
    page-break-after: always;
    position: relative;
  }
  .page:last-child { page-break-after: auto; }

  /* Footer page number */
  .page::after {
    content: attr(data-page);
    position: absolute;
    bottom: 14mm;
    right: 24mm;
    font-size: 10px;
    color: ${TEXT_MUTED};
  }

  /* ── Cover ── */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 297mm;
    padding: 0 24mm;
  }
  .cover .logo {
    font-size: 64px;
    font-weight: 800;
    color: ${TEAL};
    letter-spacing: -1.5px;
    margin-bottom: 12px;
  }
  .cover .logo span { color: ${AMBER}; }
  .cover .divider {
    width: 80px;
    height: 3px;
    background: linear-gradient(90deg, ${TEAL}, ${AMBER});
    border-radius: 2px;
    margin: 18px auto;
  }
  .cover h1 {
    font-size: 32px;
    font-weight: 700;
    color: ${TEXT};
    margin-bottom: 10px;
  }
  .cover .subtitle {
    font-size: 18px;
    color: ${TEXT_MUTED};
    margin-bottom: 6px;
  }
  .cover .date {
    font-size: 15px;
    color: ${TEAL};
    margin-top: 28px;
    font-weight: 600;
  }

  /* ── Section titles ── */
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: ${TEAL};
    margin-bottom: 16px;
    padding-bottom: 6px;
    border-bottom: 2px solid ${TEAL};
    display: inline-block;
  }
  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${AMBER};
    margin: 18px 0 8px;
  }
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: ${TEXT};
    margin: 12px 0 6px;
  }
  p, li { color: ${TEXT}; }
  p { margin-bottom: 8px; }
  ul, ol { padding-left: 20px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
  strong { color: ${AMBER}; font-weight: 600; }
  em { font-style: normal; color: ${TEAL}; }

  /* Cards */
  .card {
    background: ${BG_CARD};
    border-radius: 8px;
    padding: 16px 18px;
    margin-bottom: 14px;
    border-left: 3px solid ${TEAL};
  }
  .card.amber { border-left-color: ${AMBER}; }
  .card h4 { margin-top: 0; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 12px;
  }
  th {
    background: ${TEAL};
    color: ${BG};
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
  }
  th:first-child { border-radius: 6px 0 0 0; }
  th:last-child { border-radius: 0 6px 0 0; }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(148,163,184,0.15);
    color: ${TEXT};
  }
  tr:nth-child(even) td { background: rgba(30,41,59,0.6); }

  /* Funnel */
  .funnel { text-align: center; margin: 18px 0; }
  .funnel-step {
    display: inline-block;
    padding: 10px 18px;
    margin: 4px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .funnel-arrow {
    display: inline-block;
    color: ${AMBER};
    font-size: 18px;
    vertical-align: middle;
    margin: 0 2px;
  }

  /* Timeline */
  .timeline {
    position: relative;
    margin: 18px 0 12px 16px;
    padding-left: 24px;
    border-left: 2px solid ${TEAL};
  }
  .tl-item {
    position: relative;
    margin-bottom: 16px;
  }
  .tl-item::before {
    content: "";
    position: absolute;
    left: -30px;
    top: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${TEAL};
    border: 2px solid ${BG};
  }
  .tl-item.amber::before { background: ${AMBER}; }
  .tl-label {
    font-size: 11px;
    color: ${TEXT_MUTED};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Highlight box */
  .highlight {
    background: ${TEAL_DIM};
    border: 1px solid ${TEAL};
    border-radius: 8px;
    padding: 14px 18px;
    margin: 14px 0;
  }
  .highlight.amber-hl {
    background: ${AMBER_DIM};
    border-color: ${AMBER};
  }

  /* Numbered steps */
  .steps { counter-reset: step; list-style: none; padding-left: 0; }
  .steps li {
    counter-increment: step;
    position: relative;
    padding-left: 36px;
    margin-bottom: 12px;
  }
  .steps li::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: 0;
    width: 24px;
    height: 24px;
    background: ${TEAL};
    color: ${BG};
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 24px;
  }

  /* 2-col grid */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
</style>
</head>
<body>

<!-- ======================= PORTADA ======================= -->
<div class="cover page" data-page="">
  <div class="logo">Flete<span>Ya</span></div>
  <div class="divider"></div>
  <h1>Plan de Marketing Digital 2026</h1>
  <p class="subtitle">Marketplace de fletes en AMBA</p>
  <p class="date">Marzo 2026</p>
</div>

<!-- ======================= 1. RESUMEN EJECUTIVO ======================= -->
<div class="page" data-page="1">
  <h2>1. Resumen Ejecutivo</h2>
  <p>
    <strong>FleteYa</strong> es un marketplace digital que conecta personas y empresas que necesitan
    transportar objetos con <em>fleteros independientes</em> verificados en el Area Metropolitana de
    Buenos Aires (AMBA).
  </p>
  <div class="highlight">
    <h4>Propuesta de valor central</h4>
    <p>
      Eliminar la friccion del mercado de fletes: cotizacion instantanea, precios transparentes,
      seguimiento en tiempo real y asignacion inteligente por proximidad + reputacion.
    </p>
  </div>

  <h3>Diferenciadores Clave</h3>
  <div class="grid-2">
    <div class="card">
      <h4>Optimizacion de retorno (backhaul)</h4>
      <p>
        Reducimos los viajes de vuelta vacios conectando fleteros que ya completaron un envio con
        nuevos clientes en la zona de destino. Esto baja costos <strong>hasta un 35%</strong>.
      </p>
    </div>
    <div class="card amber">
      <h4>Precios transparentes</h4>
      <p>
        Cotizacion instantanea basada en distancia, volumen y demanda. Sin sorpresas, sin regateo.
        El cliente ve el precio final antes de confirmar.
      </p>
    </div>
    <div class="card">
      <h4>Asignacion inteligente</h4>
      <p>
        Algoritmo que considera proximidad del fletero, rating, tipo de vehiculo y disponibilidad
        para asignar el mejor match posible.
      </p>
    </div>
    <div class="card amber">
      <h4>Modelo de comision</h4>
      <p>
        <strong>22% de comision</strong> sobre cada envio estandar.
        <strong>15% en viajes backhaul</strong>, incentivando la eficiencia de la red.
      </p>
    </div>
  </div>
</div>

<!-- ======================= 2. ANALISIS DE MERCADO ======================= -->
<div class="page" data-page="2">
  <h2>2. Analisis de Mercado</h2>

  <h3>Mercado Objetivo: AMBA</h3>
  <p>
    El Area Metropolitana de Buenos Aires concentra <strong>mas de 15 millones de personas</strong>,
    genera el 52% del PBI nacional y es el epicentro logistico de Argentina.
  </p>

  <h3>Segmentos Primarios</h3>
  <table>
    <tr>
      <th>Segmento</th>
      <th>Frecuencia</th>
      <th>Ticket Promedio</th>
      <th>LTV Potencial</th>
    </tr>
    <tr>
      <td><strong>Mudanzas particulares</strong></td>
      <td>Unica vez</td>
      <td>Alto ($25,000-80,000 ARS)</td>
      <td>Bajo (1 uso + referidos)</td>
    </tr>
    <tr>
      <td><strong>PyMEs (mercaderia, materiales)</strong></td>
      <td>Semanal / Quincenal</td>
      <td>Medio ($8,000-25,000 ARS)</td>
      <td>Muy alto (recurrente)</td>
    </tr>
    <tr>
      <td><strong>Vendedores e-commerce</strong></td>
      <td>Diaria / Semanal</td>
      <td>Medio ($3,000-12,000 ARS)</td>
      <td>Alto (muy recurrente)</td>
    </tr>
  </table>

  <h3>Competencia</h3>
  <div class="grid-2">
    <div class="card">
      <h4>MercadoLibre Envios</h4>
      <p>Domina envios de paqueteria liviana. No atiende fletes pesados ni mudanzas. Mercado masivo.</p>
    </div>
    <div class="card">
      <h4>Grupos de WhatsApp / Facebook</h4>
      <p>Informales, sin garantias, sin seguimiento. Precio variable y negociado caso a caso.</p>
    </div>
    <div class="card">
      <h4>Pedidos Ya / Rappi</h4>
      <p>Limitados a gastronomia y paqueteria chica. No compiten en el segmento de fletes pesados.</p>
    </div>
    <div class="card amber">
      <h4>Oportunidad FleteYa</h4>
      <p><strong>No existe un jugador dominante</strong> en fletes pesados same-day para AMBA. El mercado esta fragmentado e informal.</p>
    </div>
  </div>
</div>

<!-- ======================= 3. OBJETIVOS ======================= -->
<div class="page" data-page="3">
  <h2>3. Objetivos por Fase</h2>

  <div class="card" style="border-left-color: ${TEAL};">
    <h3 style="color:${TEAL}; margin-top:0;">Fase 1 — Validacion (Mes 1-3)</h3>
    <table>
      <tr><th>Metrica</th><th>Objetivo</th></tr>
      <tr><td>Cotizaciones / semana</td><td><strong>50</strong></td></tr>
      <tr><td>Envios completados / semana</td><td><strong>10</strong></td></tr>
      <tr><td>Fleteros activos verificados</td><td><strong>20</strong></td></tr>
      <tr><td>CAC (Costo Adquisicion Cliente)</td><td><strong>&lt; $2,000 ARS</strong></td></tr>
    </table>
  </div>

  <div class="card amber">
    <h3 style="color:${AMBER}; margin-top:0;">Fase 2 — Crecimiento (Mes 4-8)</h3>
    <table>
      <tr><th>Metrica</th><th>Objetivo</th></tr>
      <tr><td>Envios completados / semana</td><td><strong>50+</strong></td></tr>
      <tr><td>CAC</td><td><strong>&lt; $1,500 ARS</strong></td></tr>
      <tr><td>Retencion mes 2</td><td><strong>25%+</strong></td></tr>
      <tr><td>Fleteros activos verificados</td><td><strong>50+</strong></td></tr>
    </table>
  </div>

  <div class="card" style="border-left-color: ${TEAL};">
    <h3 style="color:${TEAL}; margin-top:0;">Fase 3 — Expansion (Mes 9-12)</h3>
    <table>
      <tr><th>Metrica</th><th>Objetivo</th></tr>
      <tr><td>Expansion geografica</td><td><strong>Rosario y Cordoba</strong></td></tr>
      <tr><td>Suscripciones B2B</td><td><strong>Lanzamiento</strong></td></tr>
      <tr><td>Envios completados / semana</td><td><strong>200+</strong></td></tr>
    </table>
  </div>
</div>

<!-- ======================= 4. ESTRATEGIA DE CANALES ======================= -->
<div class="page" data-page="4">
  <h2>4. Estrategia de Canales</h2>

  <h3>4.1 Organico (Costo $0)</h3>

  <div class="card">
    <h4>SEO &mdash; Contenido Transaccional</h4>
    <p>Publicar <strong>5 articulos</strong> orientados a keywords de alta intencion:</p>
    <ul>
      <li>"Cuanto cuesta un flete en Buenos Aires 2026"</li>
      <li>"Mudanza CABA precio"</li>
      <li>"Flete zona sur Buenos Aires"</li>
      <li>"Enviar muebles Capital Federal"</li>
      <li>"Comparar precios de fletes AMBA"</li>
    </ul>
  </div>

  <div class="card">
    <h4>Instagram / TikTok &mdash; 3 videos por semana</h4>
    <ul>
      <li>Screen recordings mostrando la app en accion</li>
      <li>Comparativas de precios vs. alternativas informales</li>
      <li>Historias de fleteros: un dia con FleteYa</li>
    </ul>
  </div>

  <div class="card">
    <h4>WhatsApp &amp; Facebook Groups</h4>
    <p>
      Participar activamente en grupos existentes de "Necesito flete" respondiendo
      consultas con informacion util + enlace a la plataforma.
    </p>
  </div>

  <div class="card amber">
    <h4>Programa de Referidos</h4>
    <p>
      <strong>$500 ARS</strong> de descuento para quien refiere y quien es referido.
      Maximo <strong>50 usos por codigo</strong>. Distribucion via WhatsApp.
    </p>
  </div>
</div>

<!-- ======================= 4.2 - 4.3 CANALES (cont.) ======================= -->
<div class="page" data-page="5">
  <h3>4.2 Pago (Budget: $250-500 USD/mes)</h3>

  <div class="card">
    <h4>Google Ads &mdash; Campanas de Busqueda</h4>
    <p>Foco en keywords transaccionales de alta intencion de compra:</p>
    <ul>
      <li><strong>"flete zona sur"</strong> &mdash; CPC estimado $30-50 ARS</li>
      <li><strong>"mudanza CABA precio"</strong> &mdash; CPC estimado $50-80 ARS</li>
      <li><strong>"transporte muebles Buenos Aires"</strong> &mdash; CPC estimado $40-60 ARS</li>
    </ul>
    <p>Landing page: <em>/cotizar</em> (cotizacion instantanea sin registro).</p>
  </div>

  <div class="card amber">
    <h4>Meta Ads (Fase 2 en adelante)</h4>
    <ul>
      <li><strong>Retargeting:</strong> Visitantes que cotizaron pero no convirtieron</li>
      <li><strong>Lookalike:</strong> Audiencias similares a los primeros 100 clientes</li>
      <li><strong>Creativos:</strong> Video testimoniales de fleteros y clientes satisfechos</li>
    </ul>
  </div>

  <h3>4.3 Alianzas Estrategicas</h3>

  <div class="grid-2">
    <div class="card">
      <h4>Ferreterias &amp; Mueblerías</h4>
      <p>
        Flyers con QR en <strong>20 locales</strong> de zona sur y oeste. Comision por cada cliente
        referido que complete un envio.
      </p>
    </div>
    <div class="card">
      <h4>Tiendanube Integration</h4>
      <p>
        Plugin de despacho para vendedores de e-commerce. El comprador elige FleteYa como
        opcion de envio al finalizar la compra.
      </p>
    </div>
    <div class="card">
      <h4>Referidos para Empresas</h4>
      <p>
        Programa de comisiones para negocios que refieran clientes recurrentes. Descuentos
        por volumen mensual.
      </p>
    </div>
    <div class="card">
      <h4>Aseguradoras</h4>
      <p>
        Partnership con companias de seguros para cobertura de Responsabilidad Civil
        integrada en cada envio.
      </p>
    </div>
  </div>
</div>

<!-- ======================= 5. EMBUDO DE CONVERSION ======================= -->
<div class="page" data-page="6">
  <h2>5. Embudo de Conversion</h2>

  <div class="funnel">
    <span class="funnel-step" style="background:${TEAL}; color:${BG};">Awareness<br/><small>SEO, Social, Ads</small></span>
    <span class="funnel-arrow">&rarr;</span>
    <span class="funnel-step" style="background:rgba(13,148,136,0.7); color:${TEXT};">Interes<br/><small>/cotizar</small></span>
    <span class="funnel-arrow">&rarr;</span>
    <span class="funnel-step" style="background:${AMBER}; color:${BG};">Lead<br/><small>Email capture</small></span>
    <span class="funnel-arrow">&rarr;</span>
    <span class="funnel-step" style="background:rgba(245,158,11,0.7); color:${TEXT};">Conversion<br/><small>Registro + Pago</small></span>
    <span class="funnel-arrow">&rarr;</span>
    <span class="funnel-step" style="background:${BG_CARD}; color:${TEAL}; border:1px solid ${TEAL};">Retencion<br/><small>Fletero favorito</small></span>
    <span class="funnel-arrow">&rarr;</span>
    <span class="funnel-step" style="background:${BG_CARD}; color:${AMBER}; border:1px solid ${AMBER};">Referral<br/><small>WhatsApp share</small></span>
  </div>

  <h3>Detalle de cada etapa</h3>

  <div class="card">
    <h4>Awareness &rarr; Landing page</h4>
    <p>SEO, redes sociales y anuncios pagos dirigen trafico a la landing principal. Mensaje: "Tu flete al mejor precio, en minutos."</p>
  </div>
  <div class="card">
    <h4>Interes &rarr; /cotizar (cotizacion instantanea)</h4>
    <p>Sin registro requerido. El usuario ingresa origen, destino y tipo de carga. Recibe precio en <strong>menos de 10 segundos</strong>.</p>
  </div>
  <div class="card">
    <h4>Lead &rarr; Captura de email</h4>
    <p>"Reserva este precio por 2 horas." El usuario deja su email y queda en el funnel para remarketing.</p>
  </div>
  <div class="card">
    <h4>Conversion &rarr; Registro, creacion de envio y pago</h4>
    <p>Registro simplificado (Google OAuth / email). Confirma el envio y paga online (MercadoPago / tarjeta).</p>
  </div>
  <div class="card">
    <h4>Retencion &rarr; Envios repetidos</h4>
    <p>Fletero favorito, historial de envios, descuentos por lealtad. Notificaciones push para ofertas backhaul.</p>
  </div>
  <div class="card">
    <h4>Referral &rarr; Loop viral por WhatsApp</h4>
    <p>Cada envio genera un link de tracking compartible. El destinatario ve la marca FleteYa y se convierte en cliente potencial.</p>
  </div>
</div>

<!-- ======================= 6. GROWTH LOOPS ======================= -->
<div class="page" data-page="7">
  <h2>6. Growth Loops</h2>

  <div class="highlight">
    <h3 style="margin-top:0;">Loop 1: Tracking Viral</h3>
    <p>
      Cada envio completado genera un <strong>link de seguimiento en tiempo real</strong> que el
      cliente comparte por WhatsApp con el destinatario. Este link lleva el branding de FleteYa
      y funciona como publicidad gratuita.
    </p>
    <p style="text-align:center; margin:12px 0 4px; font-size:12px; color:${TEXT_MUTED};">
      Envio &rarr; Link de tracking &rarr; Compartido por WhatsApp &rarr; Destinatario ve FleteYa &rarr; Nuevo cliente potencial
    </p>
  </div>

  <div class="highlight amber-hl">
    <h3 style="margin-top:0;">Loop 2: Fletero como Canal</h3>
    <p>
      Cada fletero verificado recibe <strong>50 tarjetas personales</strong> con QR y codigo de
      referido. El fletero las entrega a sus propios clientes, comercios y contactos.
    </p>
    <p style="text-align:center; margin:12px 0 4px; font-size:12px; color:${TEXT_MUTED};">
      Fletero &rarr; Tarjetas con QR &rarr; Clientes escanean &rarr; Nuevos usuarios &rarr; Mas ingresos para el fletero
    </p>
  </div>

  <div class="highlight">
    <h3 style="margin-top:0;">Loop 3: Efecto de Red Backhaul</h3>
    <p>
      A mas fleteros en la red, mas oportunidades de <strong>matches backhaul</strong> (viajes de
      retorno). Esto reduce precios para los clientes, lo que atrae mas demanda, lo que a su
      vez atrae mas fleteros.
    </p>
    <p style="text-align:center; margin:12px 0 4px; font-size:12px; color:${TEXT_MUTED};">
      Mas fleteros &rarr; Mas backhaul &rarr; Precios mas bajos &rarr; Mas clientes &rarr; Mas fleteros
    </p>
  </div>
</div>

<!-- ======================= 7. METRICAS CLAVE ======================= -->
<div class="page" data-page="8">
  <h2>7. Metricas Clave (KPIs)</h2>

  <table>
    <tr>
      <th>KPI</th>
      <th>Definicion</th>
      <th>Meta Fase 1</th>
      <th>Meta Fase 2</th>
      <th>Meta Fase 3</th>
    </tr>
    <tr>
      <td><strong>GMV</strong></td>
      <td>Valor bruto de envios</td>
      <td>$500K ARS/mes</td>
      <td>$3M ARS/mes</td>
      <td>$15M ARS/mes</td>
    </tr>
    <tr>
      <td><strong>Revenue</strong></td>
      <td>Comisiones cobradas</td>
      <td>$110K ARS/mes</td>
      <td>$600K ARS/mes</td>
      <td>$3M ARS/mes</td>
    </tr>
    <tr>
      <td><strong>CAC</strong></td>
      <td>Costo adquisicion cliente</td>
      <td>&lt; $2,000 ARS</td>
      <td>&lt; $1,500 ARS</td>
      <td>&lt; $1,000 ARS</td>
    </tr>
    <tr>
      <td><strong>LTV</strong></td>
      <td>Valor de vida del cliente</td>
      <td>$4,000 ARS</td>
      <td>$8,000 ARS</td>
      <td>$15,000 ARS</td>
    </tr>
    <tr>
      <td><strong>Cotizaciones/sem</strong></td>
      <td>Cotizaciones solicitadas</td>
      <td>50</td>
      <td>200</td>
      <td>800</td>
    </tr>
    <tr>
      <td><strong>Envios/sem</strong></td>
      <td>Envios completados</td>
      <td>10</td>
      <td>50</td>
      <td>200</td>
    </tr>
    <tr>
      <td><strong>Fleteros activos</strong></td>
      <td>Fleteros verificados y activos</td>
      <td>20</td>
      <td>50</td>
      <td>200</td>
    </tr>
    <tr>
      <td><strong>Conversion %</strong></td>
      <td>Cotizacion &rarr; envio</td>
      <td>20%</td>
      <td>25%</td>
      <td>30%</td>
    </tr>
    <tr>
      <td><strong>Retencion M2</strong></td>
      <td>Clientes que repiten al mes 2</td>
      <td>15%</td>
      <td>25%</td>
      <td>35%</td>
    </tr>
    <tr>
      <td><strong>NPS</strong></td>
      <td>Net Promoter Score</td>
      <td>40+</td>
      <td>50+</td>
      <td>60+</td>
    </tr>
  </table>
</div>

<!-- ======================= 8. PRESUPUESTO ======================= -->
<div class="page" data-page="9">
  <h2>8. Presupuesto</h2>

  <h3>Fase 1 &mdash; Validacion (Mes 1-3): $150-300 USD/mes</h3>
  <table>
    <tr><th>Rubro</th><th>Inversion Mensual</th><th>Detalle</th></tr>
    <tr>
      <td>Google Ads</td>
      <td><strong>$100 USD</strong></td>
      <td>Keywords transaccionales, zona sur y CABA</td>
    </tr>
    <tr>
      <td>Flyers &amp; Material impreso</td>
      <td><strong>$50 USD</strong></td>
      <td>1,000 flyers + 200 tarjetas para fleteros</td>
    </tr>
    <tr>
      <td>Herramientas (analytics, email)</td>
      <td><strong>$50 USD</strong></td>
      <td>Plausible Analytics, Resend, etc.</td>
    </tr>
  </table>

  <h3>Fase 2 &mdash; Crecimiento (Mes 4-8): $500-800 USD/mes</h3>
  <table>
    <tr><th>Rubro</th><th>Inversion Mensual</th><th>Detalle</th></tr>
    <tr>
      <td>Google Ads</td>
      <td><strong>$200 USD</strong></td>
      <td>Expansion de keywords + remarketing</td>
    </tr>
    <tr>
      <td>Meta Ads</td>
      <td><strong>$400 USD</strong></td>
      <td>Retargeting + Lookalike + Video ads</td>
    </tr>
    <tr>
      <td>Tarjetas para fleteros</td>
      <td><strong>$50 USD</strong></td>
      <td>500 tarjetas/mes para nuevos fleteros</td>
    </tr>
    <tr>
      <td>PR &amp; Contenido</td>
      <td><strong>$0</strong></td>
      <td>Notas de prensa organicas, blog interno</td>
    </tr>
  </table>

  <h3>Fase 3 &mdash; Expansion (Mes 9-12): $1,500-2,500 USD/mes</h3>
  <table>
    <tr><th>Rubro</th><th>Inversion Mensual</th><th>Detalle</th></tr>
    <tr>
      <td>Ads (Google + Meta)</td>
      <td><strong>$1,000 USD</strong></td>
      <td>Multi-ciudad: AMBA + Rosario + Cordoba</td>
    </tr>
    <tr>
      <td>Equipo comercial</td>
      <td><strong>$1,000 USD</strong></td>
      <td>1 ejecutivo B2B part-time + comisiones</td>
    </tr>
    <tr>
      <td>Eventos &amp; Sponsoring</td>
      <td><strong>$500 USD</strong></td>
      <td>Ferias PyME, eventos e-commerce</td>
    </tr>
  </table>

  <div class="highlight" style="margin-top:18px;">
    <p><strong>Inversion total anual estimada:</strong> $7,500 - $16,000 USD</p>
    <p>ROI esperado: <strong>3-5x</strong> sobre la inversion en marketing al cierre del ano 1.</p>
  </div>
</div>

<!-- ======================= 9. CRONOGRAMA ======================= -->
<div class="page" data-page="10">
  <h2>9. Cronograma</h2>

  <div class="timeline">
    <div class="tl-item">
      <div class="tl-label">Mes 1</div>
      <p><strong>Lanzamiento:</strong> Google Ads activos, primeros 5 fleteros, 3 videos en redes, flyers en 10 locales.</p>
    </div>
    <div class="tl-item">
      <div class="tl-label">Mes 2</div>
      <p><strong>Iteracion:</strong> Optimizar campanas segun data, primer articulo SEO publicado, programa de referidos activo.</p>
    </div>
    <div class="tl-item">
      <div class="tl-label">Mes 3</div>
      <p><strong>Validacion:</strong> Evaluar CAC, tasa de conversion y NPS. Ajustar pricing si es necesario. Meta: 10 envios/semana.</p>
    </div>
    <div class="tl-item amber">
      <div class="tl-label">Mes 4-5</div>
      <p><strong>Escalar organico:</strong> 5 articulos SEO online, 3 videos/semana constantes, Meta Ads retargeting activo.</p>
    </div>
    <div class="tl-item amber">
      <div class="tl-label">Mes 6-7</div>
      <p><strong>Alianzas:</strong> Integracion Tiendanube en beta, 20 comercios con flyers, partnership con aseguradora.</p>
    </div>
    <div class="tl-item amber">
      <div class="tl-label">Mes 8</div>
      <p><strong>Consolidacion:</strong> 50+ envios/semana, 50+ fleteros, Lookalike audiences optimizadas. Preparar expansion.</p>
    </div>
    <div class="tl-item">
      <div class="tl-label">Mes 9-10</div>
      <p><strong>Expansion Rosario:</strong> Onboarding de fleteros en Rosario, campanas geolocalizadas, alianzas locales.</p>
    </div>
    <div class="tl-item">
      <div class="tl-label">Mes 11</div>
      <p><strong>Expansion Cordoba:</strong> Replicar playbook de Rosario. Lanzar suscripciones B2B para PyMEs.</p>
    </div>
    <div class="tl-item">
      <div class="tl-label">Mes 12</div>
      <p><strong>Cierre Ano 1:</strong> 200+ envios/semana, 200+ fleteros, 3 ciudades activas. Evaluar Serie Pre-Seed.</p>
    </div>
  </div>
</div>

<!-- ======================= 10. PROXIMOS PASOS ======================= -->
<div class="page" data-page="11">
  <h2>10. Proximos Pasos Inmediatos</h2>

  <p style="margin-bottom: 18px;">
    Acciones concretas para ejecutar en las proximas <strong>2 semanas</strong>, antes de lanzar
    la Fase 1 de forma completa:
  </p>

  <ol class="steps">
    <li>
      <strong>Configurar Google Ads con $100 USD</strong><br/>
      Campana de busqueda en keywords transaccionales: "flete zona sur", "mudanza CABA precio",
      "transporte muebles Buenos Aires". Landing: /cotizar.
    </li>
    <li>
      <strong>Publicar 3 videos en Instagram/TikTok</strong><br/>
      Contenido: screen recording de la app mostrando cotizacion instantanea, comparativa de
      precios vs. alternativas informales, y un "dia con un fletero FleteYa".
    </li>
    <li>
      <strong>Visitar 10 ferreterias/mueblerias en zona sur</strong><br/>
      Llevar flyers con QR code que lleve a /cotizar. Ofrecer comision por referidos a los
      duenos de comercio.
    </li>
    <li>
      <strong>Activar campana de referidos por WhatsApp</strong><br/>
      $500 ARS de descuento para quien refiere y quien es referido. Distribuir codigos a los
      primeros 20 clientes y 10 fleteros.
    </li>
    <li>
      <strong>Publicar primer articulo SEO</strong><br/>
      Titulo: "Cuanto cuesta un flete en Buenos Aires en 2026 &mdash; Guia completa de precios."
      Optimizado para posicionar en Google en 30-60 dias.
    </li>
  </ol>

  <div class="highlight amber-hl" style="margin-top: 24px;">
    <h4 style="margin-top:0; color:${AMBER};">Meta semana 2:</h4>
    <p>
      Tener la primera cotizacion real de un usuario que llego por Google Ads, y el primer envio
      completado con un fletero onboardeado via el programa de referidos.
    </p>
  </div>

  <div style="text-align:center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(148,163,184,0.2);">
    <div style="font-size: 28px; font-weight: 800; color: ${TEAL};">Flete<span style="color:${AMBER};">Ya</span></div>
    <p style="color: ${TEXT_MUTED}; font-size: 12px; margin-top: 8px;">
      www.fletaya.com.ar &nbsp;&bull;&nbsp; hola@fletaya.com.ar
    </p>
    <p style="color: ${TEXT_MUTED}; font-size: 11px; margin-top: 4px;">
      Documento confidencial &mdash; Marzo 2026
    </p>
  </div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  console.log("Setting HTML content...");
  await page.setContent(html(), { waitUntil: "networkidle0" });

  console.log("Generating PDF...");
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log(`PDF saved to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
