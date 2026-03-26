import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const exchangeCodeForSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/config", () => ({
  getSupabaseUrl: () => "https://test.supabase.co",
  getSupabaseBrowserKey: () => "test-key",
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("redirects to login when code is missing", async () => {
    const res = await GET(new Request("http://localhost/auth/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("missing_code");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to login when code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid_grant" },
    });
    const res = await GET(
      new Request("http://localhost/auth/callback?code=abc")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("invalid_grant");
  });

  it("redirects to dashboard on success with default next", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(
      new Request("http://localhost/auth/callback?code=valid")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects to sanitized next when valid", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(
      new Request(
        "http://localhost/auth/callback?code=valid&next=%2Fshipment"
      )
    );
    expect(res.headers).toBeDefined();
    expect(res.headers.get("location")).toBe("http://localhost/shipment");
  });

  it("ignores malicious next param", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const res = await GET(
      new Request(
        "http://localhost/auth/callback?code=valid&next=https%3A%2F%2Fevil.com"
      )
    );
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
