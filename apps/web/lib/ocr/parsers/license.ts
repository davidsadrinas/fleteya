import type { LicenseFields } from "../types";

const PATTERNS = {
  numero: /(?:N[°ºUÚ]MERO|LICENCIA|LIC)\s*[:\s]*(\d{7,8})/i,
  titular: /(?:TITULAR|NOMBRE|APELLIDO\s*Y\s*NOMBRE)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s,]+)/i,
  categoria: /(?:CATEGOR[IÍ]A|CAT|CLASE)\s*[:\s]*([A-E]\d?(?:\.[1-3])?)/i,
  fechaVencimiento: /(?:VENCIMIENTO|EXPIR|VTO|V[ÁA]LIDA?\s*HASTA)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
  restricciones: /(?:RESTRICCI[OÓ]N|OBSERVACI[OÓ]N)\s*[:\s]*([\w\s,.]+)/i,
  municipio: /(?:MUNICIPIO|MUNICIPALIDAD|OTORGANTE)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
};

export function parseLicense(text: string): LicenseFields {
  const match = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? null;

  return {
    numero: match(PATTERNS.numero),
    titular: match(PATTERNS.titular),
    categoria: match(PATTERNS.categoria),
    fechaVencimiento: match(PATTERNS.fechaVencimiento),
    restricciones: match(PATTERNS.restricciones),
    municipio: match(PATTERNS.municipio),
  };
}
