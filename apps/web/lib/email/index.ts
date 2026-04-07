import { reportError } from "@/lib/error-reporting";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface ResendClient {
  emails: {
    send(params: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  };
}

let resendInstance: ResendClient | null = null;
let resendLoaded = false;

async function getResend(): Promise<ResendClient | null> {
  if (resendLoaded) return resendInstance;
  resendLoaded = true;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set, emails disabled");
    return null;
  }

  try {
    const { Resend } = await import("resend");
    resendInstance = new Resend(apiKey) as unknown as ResendClient;
    return resendInstance;
  } catch {
    return null;
  }
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const provider = (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase();
  if (provider === "dry-run") {
    console.log(`[Email][Dry] To: ${params.to} | Subject: ${params.subject}`);
    return true;
  }

  const resend = await getResend();

  if (!resend) {
    console.log(`[Email][Dry] To: ${params.to} | Subject: ${params.subject}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "FleteYa <no-reply@fleteya.com.ar>",
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo ?? process.env.EMAIL_REPLY_TO,
    });

    if (error) {
      await reportError(new Error(error.message), { tags: { service: "email" } });
      return false;
    }
    return true;
  } catch (err) {
    await reportError(err, { tags: { service: "email" } });
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
