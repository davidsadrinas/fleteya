# FleteYa - Marketplace Backlog 2026

## Objetivo

Implementar las mejoras de mayor impacto para convertir el MVP en un marketplace de fletes operativo, defendible y escalable.

## Fase 1 - Confiabilidad operativa (MVP implementado)

- Chat in-app por envío (`shipment_chat_messages`) con Realtime.
- Evidencia pre/post carga (`shipment_evidence`) con carga de fotos.
- Flujo de disputa (`shipment_disputes`) con ticket desde tracking.
- Rate limiting inicial para rutas sensibles:
  - `POST /api/shipments`
  - `POST /api/tracking`
  - `POST /api/shipments/[id]/chat`
  - `POST /api/shipments/[id]/evidence`
  - `POST /api/shipments/[id]/disputes`

## Fase 2 - Conversión y retención (pendiente)

- Cotización instantánea sin login.
- Push inteligente con triggers de oportunidad backhaul / winback.
- Agenda recurrente B2B.
- Programa de fidelización por tiers.

## Fase 3 - Escala técnica (pendiente)

- Offline-first real en app de fletero (cola local + sync).
- Rate limiting distribuido (Redis/Upstash) y anti-abuse avanzado.
- Observabilidad completa (Sentry, métricas, logs estructurados).
- CDN/caching de assets públicos.

## Criterios de éxito Fase 1

- Menor desintermediación por WhatsApp gracias a chat interno.
- Menor fricción de soporte por tener evidencia temporal del viaje.
- Trazabilidad de conflictos con tickets por envío.
- Mitigación de abuso básico en endpoints críticos.
