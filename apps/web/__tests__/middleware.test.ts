import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { middleware } from "@/middleware";

const updateSession = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => updateSession(...args),
}));

const fakeUser = { id: "u1", email: "a@b.com" } as User;

describe("middleware", () => {
  beforeEach(() => {
    updateSession.mockReset();
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
  });

  it("redirects unauthenticated requests from /onboarding to /login with next param", async () => {
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    const req = new NextRequest(new URL("http://localhost/onboarding"));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fonboarding"
    );
  });

  it("redirects unauthenticated requests from /dashboard to /login with next param", async () => {
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });
    const req = new NextRequest(new URL("http://localhost/dashboard"));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard"
    );
  });

  it("allows authenticated user to access /dashboard", async () => {
    const nextResponse = NextResponse.next();
    updateSession.mockResolvedValue({
      response: nextResponse,
      user: fakeUser,
    });
    const req = new NextRequest(new URL("http://localhost/dashboard"));
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it("redirects authenticated user away from /login to dashboard", async () => {
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: fakeUser,
    });
    const req = new NextRequest(new URL("http://localhost/login"));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("uses safe next when redirecting from /login", async () => {
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: fakeUser,
    });
    const req = new NextRequest(
      new URL("http://localhost/login?next=%2Fprofile")
    );
    const res = await middleware(req);
    expect(res.headers.get("location")).toBe("http://localhost/profile");
  });

  it("rejects open redirect on login next param", async () => {
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: fakeUser,
    });
    const req = new NextRequest(
      new URL("http://localhost/login?next=%2F%2Fevil.com")
    );
    const res = await middleware(req);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
