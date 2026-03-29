import type { InsuranceFields } from "../types";

const PATTERNS = {
  poliza: /(?:P[OÓ]LIZA|N[°ºUÚ]MERO)\s*[:\s]*([A-Z0-9\-/]+)/i,
  aseguradora: /(?:COMPA[NÑ][IÍ]A|ASEGURADORA|EMPRESA)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s.]+)/i,
  tomador: /(?:TOMADOR|ASEGURADO|TITULAR)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s,]+)/i,
  vehiculo: /(?:VEH[IÍ]CULO|MARCA|MODELO)\s*[:\s]*([A-ZÁÉÍÓÚÑ0-9\s]+)/i,
  patente: /(?:PATENTE|DOMINIO|CHAPA)\s*[:\s]*([A-Z]{2,3}\s?\d{3}\s?[A-Z]{0,3})/i,
  vigenciaDesde: /(?:DESDE|VIGENCIA\s*DESDE|INICIO)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
  vigenciaHasta: /(?:HASTA|VIGENCIA\s*HASTA|VENCIMIENTO)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
  cobertura: /(?:COBERTURA|TIPO)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
};

export function parseInsurance(text: string): InsuranceFields {
  const match = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? null;

  return {
    poliza: match(PATTERNS.poliza),
    aseguradora: match(PATTERNS.aseguradora),
    tomador: match(PATTERNS.tomador),
    vehiculo: match(PATTERNS.vehiculo),
    patente: match(PATTERNS.patente),
    vigenciaDesde: match(PATTERNS.vigenciaDesde),
    vigenciaHasta: match(PATTERNS.vigenciaHasta),
    cobertura: match(PATTERNS.cobertura),
  };
}
