export interface OcrResult {
  success: boolean;
  rawText: string;
  confidence: number;
  fields: Record<string, string | null>;
  error?: string;
}

export type DocumentType = "dni_front" | "dni_back" | "license" | "insurance" | "vtv";

export interface OcrAdapter {
  isConfigured(): boolean;
  extractText(imageUrl: string): Promise<{ rawText: string; confidence: number } | null>;
}

export interface DniFields {
  numero: string | null;
  apellido: string | null;
  nombre: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  ejemplar: string | null;
}

export interface LicenseFields {
  numero: string | null;
  titular: string | null;
  categoria: string | null;
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
