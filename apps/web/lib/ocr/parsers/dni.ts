import type { DniFields } from "../types";

const PATTERNS = {
  numero: /(?:DNI|D\.N\.I\.?|DOCUMENTO)\s*[:\s]*(\d{7,8})/i,
  apellido: /(?:APELLIDO|SURNAME)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
  nombre: /(?:NOMBRE|NAME|NOMBRES)\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
  fechaNacimiento: /(?:NACIMIENTO|BIRTH|F\.?\s*NAC)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
  sexo: /(?:SEXO|SEX)\s*[:\s]*(M|F|MASCULINO|FEMENINO)/i,
  fechaEmision: /(?:EMISI[OÓ]N|EMIS)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
  fechaVencimiento: /(?:VENCIMIENTO|EXPIR|VTO|FEC\.\s*VTO)\s*[:\s]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i,
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
