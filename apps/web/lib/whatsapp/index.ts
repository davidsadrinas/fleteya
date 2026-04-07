import { reportError } from "@/lib/error-reporting";

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  language?: string;
  parameters?: string[];
}

function getConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return { phoneNumberId, accessToken };
}

export async function sendWhatsAppTemplate(msg: WhatsAppTemplateMessage): Promise<boolean> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase();
  if (provider === "dry-run") {
    console.log(`[WhatsApp][Dry] To: ${msg.to} | Template: ${msg.templateName}`);
    return true;
  }

  const config = getConfig();

  if (!config) {
    console.log(`[WhatsApp][Dry] To: ${msg.to} | Template: ${msg.templateName}`);
    return true;
  }

  try {
    const response = await fetch(
      `${GRAPH_API}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: msg.to,
          type: "template",
          template: {
            name: msg.templateName,
            language: { code: msg.language ?? "es_AR" },
            components: msg.parameters?.length
              ? [
                  {
                    type: "body",
                    parameters: msg.parameters.map((p) => ({ type: "text", text: p })),
                  },
                ]
              : undefined,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      await reportError(new Error(`WhatsApp API error: ${response.status}`), {
        tags: { service: "whatsapp" },
        extra: { response: errorData },
      });
      return false;
    }

    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "whatsapp" } });
    return false;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;
}
