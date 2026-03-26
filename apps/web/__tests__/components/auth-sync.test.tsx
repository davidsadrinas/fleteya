import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSync } from "@/components/auth-sync";
import { useAuthStore } from "@/lib/stores";
import { useSession } from "@/lib/hooks";

vi.mock("@/lib/hooks", () => ({
  useSession: vi.fn(),
}));

const maybeSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: () => ({
    eq: () => ({
      maybeSingle,
    }),
  }),
}));

vi.mock("@/lib/supabase-client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockedUseSession = vi.mocked(useSession);

describe("AuthSync", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false });
    mockedUseSession.mockReset();
    mockFrom.mockClear();
    maybeSingle.mockReset();
  });

  it("sets loading on the auth store while the session is loading", async () => {
    mockedUseSession.mockReturnValue({
      user: undefined,
      loading: true,
      session: null,
    });
    render(
      <AuthSync>
        <span>child</span>
      </AuthSync>
    );
    await waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(true);
    });
  });

  it("clears the user when there is no session", async () => {
    mockedUseSession.mockReturnValue({
      user: undefined,
      loading: false,
      session: null,
    });
    useAuthStore.getState().setUser({
      id: "x",
      email: "a@b.com",
      name: "A",
      role: "client",
    });
    render(
      <AuthSync>
        <span>x</span>
      </AuthSync>
    );
    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  it("merges profile row into the auth store user", async () => {
    mockedUseSession.mockReturnValue({
      user: {
        id: "u1",
        email: "u@e.com",
        user_metadata: { full_name: "From Meta" },
      } as import("@supabase/supabase-js").User,
      loading: false,
      session: {} as import("@supabase/supabase-js").Session,
    });
    maybeSingle.mockResolvedValue({
      data: {
        name: "Profile Name",
        role: "driver",
        avatar_url: "https://example.com/a.png",
        phone: null,
      },
    });
    render(
      <AuthSync>
        <span>x</span>
      </AuthSync>
    );
    await waitFor(() => {
      const u = useAuthStore.getState().user;
      expect(u?.name).toBe("Profile Name");
      expect(u?.role).toBe("driver");
      expect(u?.avatarUrl).toBe("https://example.com/a.png");
    });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });
});
