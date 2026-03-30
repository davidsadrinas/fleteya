export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

export interface NotificationEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationSmsInput {
  to: string;
  body: string;
}

export interface NotificationWhatsAppInput {
  to: string;
  templateName: string;
  parameters?: string[];
}

export interface NotificationPushInput {
  title: string;
  body: string;
  url?: string;
}

export interface NotifyParams {
  userId: string;
  eventType: string;
  email?: NotificationEmailInput;
  whatsapp?: NotificationWhatsAppInput;
  sms?: NotificationSmsInput;
  push?: NotificationPushInput;
}

export interface NotifyResult {
  channels: NotificationChannel[];
  errors: string[];
}

export interface NotificationAdapter {
  readonly channel: NotificationChannel;
  isConfigured(): boolean;
  send(params: NotifyParams): Promise<{ sent: boolean; recipient?: string; error?: string }>;
}
