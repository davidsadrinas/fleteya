import { reportError } from "@/lib/error-reporting";
import type { BillingAdapter, InvoiceParams, InvoiceResult } from "../types";

type AfipClient = {
  ElectronicBilling: {
    getLastVoucher: (puntoVenta: number, cbteTipo: number) => Promise<number>;
    createVoucher: (payload: Record<string, unknown>) => Promise<{
      CAE?: string;
      CAEFchVto?: string;
    }>;
  };
};

let afipInstance: AfipClient | null = null;
let afipLoaded = false;

async function getAfip(): Promise<AfipClient | null> {
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
    }) as AfipClient;
    return afipInstance;
  } catch (err) {
    await reportError(err, { tags: { service: "afip" } });
    return null;
  }
}

export const afipBillingAdapter: BillingAdapter = {
  name: "afip",

  isConfigured(): boolean {
    return Boolean(process.env.AFIP_CUIT);
  },

  async emitInvoice(params: InvoiceParams): Promise<InvoiceResult> {
    const afip = await getAfip();
    if (!afip) {
      return { success: false, error: "AFIP no configurado" };
    }

    try {
      const puntoVenta = parseInt(process.env.AFIP_PUNTO_VENTA ?? "1", 10);
      const cbteTipo = 11; // 11 = Factura C
      const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, cbteTipo);
      const voucherNumber = lastVoucher + 1;
      const today = new Date();
      const fechaStr = today.toISOString().slice(0, 10).replace(/-/g, "");

      const voucherData = {
        CantReg: 1,
        PtoVta: puntoVenta,
        CbteTipo: cbteTipo,
        Concepto: 2,
        DocTipo: params.clientDni ? 96 : 99,
        DocNro: params.clientDni ? parseInt(params.clientDni, 10) : 0,
        CbteDesde: voucherNumber,
        CbteHasta: voucherNumber,
        CbteFch: fechaStr,
        ImpTotal: params.amount,
        ImpTotConc: 0,
        ImpNeto: params.amount,
        ImpOpEx: 0,
        ImpIVA: 0,
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
  },
};
