import { reportError } from "@/lib/error-reporting";

interface SmsParams {
  to: string;  // E.164 format: "+5491112345678"
  body: string;
}

let twilioClient: any = null;
let twilioLoaded = false;

async function getTwilio() {
  if (twilioLoaded) return twilioClient;
  twilioLoaded = true;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.warn("[SMS] Twilio credentials not set, SMS disabled");
    return null;
  }

  try {
    const twilio = await import("twilio");
    twilioClient = twilio.default(sid, token);
    return twilioClient;
  } catch {
    return null;
  }
}

export async function sendSms(params: SmsParams): Promise<boolean> {
  const client = await getTwilio();

  if (!client) {
    console.log(`[SMS][Dry] To: ${params.to} | Body: ${params.body}`);
    return true;
  }

  try {
    await client.messages.create({
      body: params.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: params.to,
    });
    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "sms" } });
    return false;
  }
}

export function isSmsConfigured(): boolean {
  return !!process.env.TWILIO_ACCOUNT_SID;
}
