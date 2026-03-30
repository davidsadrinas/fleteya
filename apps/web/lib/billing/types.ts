export interface InvoiceParams {
  paymentId: string;
  shipmentId: string;
  amount: number;
  clientName?: string;
  clientDni?: string;
}

export interface InvoiceResult {
  success: boolean;
  cae?: string;
  caeVencimiento?: string;
  numeroComprobante?: number;
  error?: string;
}

export interface BillingAdapter {
  readonly name: string;
  isConfigured(): boolean;
  emitInvoice(params: InvoiceParams): Promise<InvoiceResult>;
}
