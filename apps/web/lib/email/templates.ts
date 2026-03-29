// Shared wrapper for consistent email styling
function wrap(body: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">${body}<p style="color:#999;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">FleteYa — Tu flete, ya.<br/>Este es un mensaje automatico, no respondas a este email.</p></div>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: "Bienvenido a FleteYa",
    html: wrap(`
      <h2>Bienvenido a FleteYa, ${name}!</h2>
      <p>Tu cuenta fue creada exitosamente. Ya podes empezar a cotizar y enviar tus fletes.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Ir al dashboard</a></p>
    `),
  };
}

export function shipmentConfirmedEmail(params: {
  clientName: string;
  shipmentId: string;
  finalPrice: number;
}) {
  return {
    subject: `Envio confirmado #${params.shipmentId.slice(0, 8)} — FleteYa`,
    html: wrap(`
      <h2>Envio confirmado</h2>
      <p>Hola ${params.clientName},</p>
      <p>Tu envio <strong>#${params.shipmentId.slice(0, 8)}</strong> fue confirmado y tu pago de <strong>$${params.finalPrice.toLocaleString("es-AR")}</strong> fue recibido.</p>
      <p>Te vamos a notificar cuando un fletero sea asignado.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tracking?id=${params.shipmentId}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Ver envio</a></p>
    `),
  };
}

export function driverAssignedEmail(params: {
  clientName: string;
  shipmentId: string;
  driverName: string;
}) {
  return {
    subject: `Fletero asignado — FleteYa`,
    html: wrap(`
      <h2>Fletero asignado</h2>
      <p>Hola ${params.clientName},</p>
      <p>El fletero <strong>${params.driverName}</strong> fue asignado a tu envio <strong>#${params.shipmentId.slice(0, 8)}</strong>.</p>
      <p>Podes seguir su ubicacion en tiempo real desde el mapa.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tracking?id=${params.shipmentId}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Seguir envio</a></p>
    `),
  };
}

export function shipmentDeliveredEmail(params: {
  clientName: string;
  shipmentId: string;
  driverName: string;
  finalPrice: number;
}) {
  return {
    subject: `Envio entregado — FleteYa`,
    html: wrap(`
      <h2>Envio entregado</h2>
      <p>Hola ${params.clientName},</p>
      <p>Tu envio <strong>#${params.shipmentId.slice(0, 8)}</strong> fue entregado exitosamente por <strong>${params.driverName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">Precio final</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${params.finalPrice.toLocaleString("es-AR")}</td></tr>
      </table>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tracking?id=${params.shipmentId}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Ver detalles y calificar</a></p>
    `),
  };
}

export function driverApprovedEmail(params: { driverName: string; approved: boolean; reason?: string }) {
  const title = params.approved ? "Cuenta aprobada" : "Verificacion rechazada";
  const body = params.approved
    ? `<p>Felicitaciones ${params.driverName}, tu cuenta de fletero fue <strong>aprobada</strong>. Ya podes recibir envios en la app.</p>`
    : `<p>Hola ${params.driverName}, lamentablemente tu verificacion fue <strong>rechazada</strong>.</p>${params.reason ? `<p>Motivo: ${params.reason}</p>` : ""}<p>Podes volver a subir tus documentos desde tu perfil.</p>`;

  return {
    subject: `${title} — FleteYa`,
    html: wrap(`<h2>${title}</h2>${body}`),
  };
}

export function paymentReceiptEmail(params: {
  clientName: string;
  shipmentId: string;
  amount: number;
  cae?: string;
}) {
  return {
    subject: `Recibo de pago — FleteYa`,
    html: wrap(`
      <h2>Recibo de pago</h2>
      <p>Hola ${params.clientName},</p>
      <p>Recibimos tu pago por el envio <strong>#${params.shipmentId.slice(0, 8)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;">Monto</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${params.amount.toLocaleString("es-AR")}</td></tr>
        ${params.cae ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;">CAE</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${params.cae}</td></tr>` : ""}
      </table>
    `),
  };
}

export function disputeUpdateEmail(params: {
  userName: string;
  shipmentId: string;
  status: string;
  resolutionNote?: string;
}) {
  return {
    subject: `Actualizacion de reclamo — FleteYa`,
    html: wrap(`
      <h2>Actualizacion de reclamo</h2>
      <p>Hola ${params.userName},</p>
      <p>Tu reclamo sobre el envio <strong>#${params.shipmentId.slice(0, 8)}</strong> fue actualizado a: <strong>${params.status}</strong>.</p>
      ${params.resolutionNote ? `<p>Nota: ${params.resolutionNote}</p>` : ""}
    `),
  };
}
