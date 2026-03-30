import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyUser } from "@/lib/notifications";

const sendEmail = vi.fn();
const isEmailConfigured = vi.fn();
const sendSms = vi.fn();
const isSmsConfigured = vi.fn();
const sendWhatsAppTemplate = vi.fn();
const isWhatsAppConfigured = vi.fn();
const insert = vi.fn();
const from = vi.fn();

vi.mock("@/lib/email", () => ({
  sendEmail: (...args: Parameters<typeof sendEmail>) => sendEmail(...args),
  isEmailConfigured: () => isEmailConfigured(),
}));

vi.mock("@/lib/sms", () => ({
  sendSms: (...args: Parameters<typeof sendSms>) => sendSms(...args),
  isSmsConfigured: () => isSmsConfigured(),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppTemplate: (...args: Parameters<typeof sendWhatsAppTemplate>) =>
    sendWhatsAppTemplate(...args),
  isWhatsAppConfigured: () => isWhatsAppConfigured(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabase: () => ({ from }),
}));

describe("notifyUser adapters orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUSH_SEND_SECRET = "";
    from.mockReturnValue({ insert });
    insert.mockResolvedValue({ error: null });
    isEmailConfigured.mockReturnValue(true);
    isWhatsAppConfigured.mockReturnValue(false);
    isSmsConfigured.mockReturnValue(true);
    sendEmail.mockResolvedValue(true);
    sendSms.mockResolvedValue(true);
  });

  it("sends email and skips sms fallback when a primary channel succeeds", async () => {
    const result = await notifyUser({
      userId: "u1",
      eventType: "event",
      email: { to: "a@b.com", subject: "Hola", html: "<p>ok</p>" },
      sms: { to: "+54911", body: "fallback" },
    });

    expect(result.channels).toContain("email");
    expect(sendSms).not.toHaveBeenCalled();
  });
});
